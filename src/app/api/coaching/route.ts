import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getPlanConfig } from "@/config/plans";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { decryptText, encryptText } from "@/lib/security/crypto";
import {
  getOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "@/lib/ai/client";
import { COACHING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  CRISIS_RESPONSE_MESSAGE,
  checkCrisisRisk,
} from "@/lib/ai/safety";
import { checkAndReserveAiUsage, recordAiUsage } from "@/lib/ai/usage";
import type { ChatMessage, ConversationSummary } from "@/types";

function safeDecrypt(val: unknown): string {
  if (typeof val !== "string" || !val) return "";
  try {
    return decryptText(val);
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId")?.trim();
    const userRef = getAdminDb().collection("users").doc(user.uid);

    if (conversationId) {
      const convRef = userRef.collection("conversations").doc(conversationId);
      const convSnap = await convRef.get();
      if (!convSnap.exists) {
        return NextResponse.json(
          { error: "対話が見つかりませんでした。" },
          { status: 404 }
        );
      }

      const msgsSnap = await convRef
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limit(100)
        .get();

      const messages: ChatMessage[] = msgsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          role: d.role as "user" | "assistant" | "safety",
          content: safeDecrypt(d.contentEncrypted),
          createdAt:
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        };
      });

      return NextResponse.json({ conversationId, messages });
    }

    const convsSnap = await userRef
      .collection("conversations")
      .orderBy("updatedAt", "desc")
      .limit(30)
      .get();

    const conversations: ConversationSummary[] = convsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        entryId: typeof d.entryId === "string" ? d.entryId : null,
        title: safeDecrypt(d.titleEncrypted) || "本音の対話",
        createdAt:
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        updatedAt:
          d.updatedAt instanceof Timestamp
            ? d.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
      };
    });

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { error: "対話履歴の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

const postCoachingSchema = z.object({
  conversationId: z.string().trim().optional(),
  entryId: z.string().trim().optional(),
  message: z.string().trim().min(1, "メッセージを入力してください。"),
});

export async function POST(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(user);
    const planConfig = getPlanConfig(profile.plan);

    const body = await request.json();
    const parsed = postCoachingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" },
        { status: 400 }
      );
    }

    if (parsed.data.message.length > planConfig.limits.maxEntryChars) {
      return NextResponse.json(
        {
          error: `1回の入力は${planConfig.limits.maxEntryChars}文字以内で入力してください。`,
        },
        { status: 400 }
      );
    }

    // 月間利用枠チェック
    const usageCheck = await checkAndReserveAiUsage({
      uid: user.uid,
      plan: profile.plan,
      kind: "chat",
    });
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `今月のAI対話上限（${usageCheck.limit}回）に達しました。`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const now = Timestamp.now();

    let conversationId = parsed.data.conversationId;
    let convRef;

    if (conversationId) {
      convRef = userRef.collection("conversations").doc(conversationId);
      const existing = await convRef.get();
      if (!existing.exists) {
        return NextResponse.json(
          { error: "指定された対話が見つかりませんでした。" },
          { status: 404 }
        );
      }
    } else {
      const titlePreview = parsed.data.message.slice(0, 28);
      convRef = await userRef.collection("conversations").add({
        entryId: parsed.data.entryId ?? null,
        titleEncrypted: encryptText(titlePreview),
        createdAt: now,
        updatedAt: now,
      });
      conversationId = convRef.id;
    }

    // ユーザー発言を暗号化保存
    const userMsgRef = await convRef.collection("messages").add({
      role: "user",
      contentEncrypted: encryptText(parsed.data.message),
      createdAt: now,
    });

    // 危機介入二重チェック（最優先）
    if (await checkCrisisRisk(parsed.data.message)) {
      const safetyNow = Timestamp.now();
      const safetyMsgRef = await convRef.collection("messages").add({
        role: "safety",
        contentEncrypted: encryptText(CRISIS_RESPONSE_MESSAGE),
        createdAt: safetyNow,
      });
      await convRef.update({ updatedAt: safetyNow });

      return NextResponse.json({
        conversationId,
        userMessage: {
          id: userMsgRef.id,
          role: "user",
          content: parsed.data.message,
          createdAt: now.toDate().toISOString(),
        } satisfies ChatMessage,
        assistantMessage: {
          id: safetyMsgRef.id,
          role: "safety",
          content: CRISIS_RESPONSE_MESSAGE,
          createdAt: safetyNow.toDate().toISOString(),
        } satisfies ChatMessage,
      });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI機能（OPENAI_API_KEY）がサーバーに設定されていないため、応答を生成できません。",
        },
        { status: 503 }
      );
    }

    // 必要最小限の直近履歴（最大12件）のみを復号してOpenAIへ渡す
    const recentSnap = await convRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();

    const historyMessages = recentSnap.docs
      .reverse()
      .map((doc) => {
        const d = doc.data();
        const role = d.role === "assistant" ? "assistant" : "user";
        return {
          role: role as "user" | "assistant",
          content: safeDecrypt(d.contentEncrypted),
        };
      })
      .filter((m) => m.content.length > 0);

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.7,
      max_tokens: 450,
      messages: [
        { role: "system", content: COACHING_SYSTEM_PROMPT },
        ...historyMessages,
      ],
    });

    const aiReply =
      completion.choices[0]?.message?.content?.trim() ||
      "いま話してくださった中で、一番言葉にしづらかった部分はどこでしょうか？";

    const replyNow = Timestamp.now();
    const aiMsgRef = await convRef.collection("messages").add({
      role: "assistant",
      contentEncrypted: encryptText(aiReply),
      createdAt: replyNow,
    });
    await convRef.update({ updatedAt: replyNow });

    await recordAiUsage({
      uid: user.uid,
      kind: "chat",
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    });

    return NextResponse.json({
      conversationId,
      userMessage: {
        id: userMsgRef.id,
        role: "user",
        content: parsed.data.message,
        createdAt: now.toDate().toISOString(),
      } satisfies ChatMessage,
      assistantMessage: {
        id: aiMsgRef.id,
        role: "assistant",
        content: aiReply,
        createdAt: replyNow.toDate().toISOString(),
      } satisfies ChatMessage,
    });
  } catch {
    return NextResponse.json(
      { error: "AI応答の生成に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
