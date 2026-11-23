import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/security/auth";
import { encryptText } from "@/lib/security/crypto";

const correctionSchema = z.object({
  correction: z
    .string()
    .trim()
    .max(1000, "訂正メモは1000文字以内で入力してください。"),
});

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
    const body = await request.json();
    const parsed = correctionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" },
        { status: 400 }
      );
    }

    const ref = getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("analyses")
      .doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "分析結果が見つかりませんでした。" },
        { status: 404 }
      );
    }

    const encrypted = parsed.data.correction
      ? encryptText(parsed.data.correction)
      : null;

    await ref.update({
      userCorrectionEncrypted: encrypted,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      id,
      userCorrection: parsed.data.correction || null,
    });
  } catch {
    return NextResponse.json(
      { error: "訂正の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
