import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { EMOTION_KEYS, type EmotionKey } from "@/config/emotions";
import { getPlanConfig } from "@/config/plans";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { decryptText, encryptText } from "@/lib/security/crypto";
import type { EntryItem } from "@/types";

const updateEntrySchema = z.object({
  content: z.string().trim().min(1, "内容を入力してください。"),
  emotion: z.enum(EMOTION_KEYS as [EmotionKey, ...EmotionKey[]]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const snap = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .doc(id)
      .get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "記録が見つかりませんでした。" },
        { status: 404 }
      );
    }

    const data = snap.data()!;
    const entry: EntryItem = {
      id: snap.id,
      content: decryptText(String(data.contentEncrypted ?? "")),
      emotion: (data.emotion ?? "other") as EmotionKey,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date().toISOString(),
    };

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "記録の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profile = await getOrCreateUserProfile(user);
    const planConfig = getPlanConfig(profile.plan);

    const body = await request.json();
    const parsed = updateEntrySchema.safeParse(body);
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

    const ref = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "記録が見つかりませんでした。" },
        { status: 404 }
      );
    }

    const now = Timestamp.now();
    await ref.update({
      contentEncrypted: encryptText(parsed.data.content),
      emotion: parsed.data.emotion,
      updatedAt: now,
    });

    const createdAt =
      snap.data()?.createdAt instanceof Timestamp
        ? snap.data()!.createdAt.toDate().toISOString()
        : now.toDate().toISOString();

    const entry: EntryItem = {
      id: snap.id,
      content: parsed.data.content,
      emotion: parsed.data.emotion,
      createdAt,
      updatedAt: now.toDate().toISOString(),
    };

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "記録の更新に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ref = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("entries")
      .doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "記録が見つかりませんでした。" },
        { status: 404 }
      );
    }

    await ref.delete();
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "記録の削除に失敗しました。" },
      { status: 500 }
    );
  }
}
