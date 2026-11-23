import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { EMOTION_KEYS, type EmotionKey } from "@/config/emotions";
import { getPlanConfig } from "@/config/plans";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { decryptText, encryptText } from "@/lib/security/crypto";
import type { EntryItem } from "@/types";

const createEntrySchema = z.object({
  content: z.string().trim().min(1, "内容を入力してください。"),
  emotion: z.enum(EMOTION_KEYS as [EmotionKey, ...EmotionKey[]]),
});

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const emotionFilter = searchParams.get("emotion")?.trim() || "";
    const keyword = searchParams.get("q")?.trim().toLowerCase() || "";
    const monthFilter = searchParams.get("month")?.trim() || ""; // YYYY-MM

    const snapshot = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const entries: EntryItem[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const createdDate =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date();
      const updatedDate =
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : createdDate;

      const emotion = (data.emotion ?? "other") as EmotionKey;
      if (emotionFilter && emotionFilter !== "all" && emotion !== emotionFilter) {
        continue;
      }

      if (monthFilter) {
        const docMonth = `${createdDate.getFullYear()}-${String(
          createdDate.getMonth() + 1
        ).padStart(2, "0")}`;
        if (docMonth !== monthFilter) {
          continue;
        }
      }

      let content = "";
      try {
        content = decryptText(String(data.contentEncrypted ?? ""));
      } catch {
        content = "（復号できませんでした）";
      }

      if (keyword && !content.toLowerCase().includes(keyword)) {
        continue;
      }

      entries.push({
        id: doc.id,
        content,
        emotion,
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString(),
      });
    }

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json(
      { error: "記録の読み込みに失敗しました。" },
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

    const body = await request.json();
    const parsed = createEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" },
        { status: 400 }
      );
    }

    if (parsed.data.content.length > planConfig.limits.maxEntryChars) {
      return NextResponse.json(
        {
          error: `1回の記録は${planConfig.limits.maxEntryChars}文字以内で入力してください。`,
        },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const contentEncrypted = encryptText(parsed.data.content);

    const ref = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .add({
        contentEncrypted,
        emotion: parsed.data.emotion,
        createdAt: now,
        updatedAt: now,
      });

    const entry: EntryItem = {
      id: ref.id,
      content: parsed.data.content,
      emotion: parsed.data.emotion,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "記録の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
