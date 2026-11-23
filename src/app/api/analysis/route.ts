import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getEmotionMeta } from "@/config/emotions";
import { getPlanConfig } from "@/config/plans";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { decryptText, encryptText } from "@/lib/security/crypto";
import {
  getOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "@/lib/ai/client";
import { buildAnalysisSystemPrompt } from "@/lib/ai/prompts";
import { checkAndReserveAiUsage, recordAiUsage } from "@/lib/ai/usage";
import type { AnalysisItem, AnalysisResult } from "@/types";

function safeParseAnalysis(encrypted: unknown): AnalysisResult | null {
  if (typeof encrypted !== "string" || !encrypted) return null;
  try {
    const raw = decryptText(encrypted);
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("analyses")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const analyses: AnalysisItem[] = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      const parsed = safeParseAnalysis(d.resultEncrypted);
      if (!parsed) continue;
      let correction: string | null = null;
      if (typeof d.userCorrectionEncrypted === "string" && d.userCorrectionEncrypted) {
        try {
          correction = decryptText(d.userCorrectionEncrypted);
        } catch {
          correction = null;
        }
      }

      analyses.push({
        id: doc.id,
        type: d.type === "deep" ? "deep" : "simple",
        entryCount: Number(d.entryCount ?? 0),
        result: parsed,
        userCorrection: correction,
        createdAt:
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        updatedAt:
          d.updatedAt instanceof Timestamp
            ? d.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
      });
    }

    return NextResponse.json({ analyses });
  } catch {
    return NextResponse.json(
      { error: "分析履歴の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(user);
    const planConfig = getPlanConfig(profile.plan);
    const analysisType: "simple" | "deep" = planConfig.limits.deepAnalysisEnabled
      ? "deep"
      : "simple";

    const usageCheck = await checkAndReserveAiUsage({
      uid: user.uid,
      plan: profile.plan,
      kind: "analysis",
    });
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `今月の感情分析上限（${usageCheck.limit}回）に達しました。`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI機能（OPENAI_API_KEY）がサーバーに設定されていないため、分析を実行できません。",
        },
        { status: 503 }
      );
    }

    // 必要範囲の記録だけを取得（無料: 直近15件 / 有料: 直近40件）
    const maxEntries = analysisType === "deep" ? 40 : 15;
    const entriesSnap = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .orderBy("createdAt", "desc")
      .limit(maxEntries)
      .get();

    if (entriesSnap.size < 2) {
      return NextResponse.json(
        {
          error:
            "感情分析を行うには、2件以上の本音の記録が必要です。まずは記録を残してみてください。",
        },
        { status: 400 }
      );
    }

    // 各記録の本文は必要範囲（最大280文字）に丸めてトークン暴走を防止
    const formattedEntries = entriesSnap.docs
      .reverse()
      .map((doc) => {
        const d = doc.data();
        const dateStr =
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate().toISOString().slice(0, 10)
            : "";
        const emotionLabel = getEmotionMeta(String(d.emotion ?? "other")).label;
        let text = "";
        try {
          text = decryptText(String(d.contentEncrypted ?? "")).slice(0, 280);
        } catch {
          text = "";
        }
        return `[${dateStr} / ${emotionLabel}] ${text}`;
      })
      .join("\n");

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.4,
      max_tokens: 1100,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildAnalysisSystemPrompt(analysisType) },
        {
          role: "user",
          content: `以下は利用者の記録（${entriesSnap.size}件）です。傾向と推測を区別して整理してください。\n\n${formattedEntries}`,
        },
      ],
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsedResult = JSON.parse(rawJson) as AnalysisResult;

    const now = Timestamp.now();
    const docRef = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("analyses")
      .add({
        type: analysisType,
        entryCount: entriesSnap.size,
        resultEncrypted: encryptText(JSON.stringify(parsedResult)),
        userCorrectionEncrypted: null,
        createdAt: now,
        updatedAt: now,
      });

    await recordAiUsage({
      uid: user.uid,
      kind: "analysis",
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    });

    const item: AnalysisItem = {
      id: docRef.id,
      type: analysisType,
      entryCount: entriesSnap.size,
      result: parsedResult,
      userCorrection: null,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };

    return NextResponse.json({ analysis: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "感情分析の実行に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
