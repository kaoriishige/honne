import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { z } from "zod";

function getCurrentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(user);
    const period = getCurrentPeriod();
    const usageSnap = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("usage")
      .doc(period)
      .get();

    const usageData = usageSnap.data();

    return NextResponse.json({
      profile,
      emailVerified: user.emailVerified,
      usage: {
        period,
        aiChatCount: Number(usageData?.aiChatCount ?? 0),
        aiAnalysisCount: Number(usageData?.aiAnalysisCount ?? 0),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "プロフィール情報の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

const patchProfileSchema = z.object({
  acceptAiConsent: z.boolean().optional(),
  syncEmail: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = patchProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力形式が正しくありません。" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (parsed.data.acceptAiConsent) {
      updates["settings.aiConsentAcceptedAt"] = now;
    }
    if (parsed.data.syncEmail && user.email) {
      updates.email = user.email;
    }

    await getAdminDb().collection("users").doc(user.uid).update(updates);
    const profile = await getOrCreateUserProfile(user);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "設定の更新に失敗しました。" },
      { status: 500 }
    );
  }
}
