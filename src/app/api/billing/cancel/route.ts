import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/security/auth";
import {
  extractSubscriptionPeriodEnd,
  getStripeClient,
  isStripeServerConfigured,
  mapStripeSubscriptionStatus,
} from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    if (!isStripeServerConfigured()) {
      return NextResponse.json(
        { error: "Stripe 決済の環境変数が未設定です。" },
        { status: 503 }
      );
    }

    const userRef = getAdminDb().collection("users").doc(user.uid);
    const snap = await userRef.get();
    const data = snap.data();

    const subscriptionId =
      typeof data?.stripeSubscriptionId === "string"
        ? data.stripeSubscriptionId
        : null;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "解約対象のサブスクリプションが見つかりません。" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const mappedStatus = mapStripeSubscriptionStatus(
      updatedSub.status,
      updatedSub.cancel_at_period_end
    );
    const periodEnd = extractSubscriptionPeriodEnd(updatedSub);

    await userRef.update({
      subscriptionStatus: mappedStatus,
      plan: mappedStatus === "canceled" ? "free" : "paid",
      ...(periodEnd ? { currentPeriodEnd: Timestamp.fromDate(periodEnd) } : {}),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      subscriptionStatus: mappedStatus,
      currentPeriodEnd: periodEnd ? periodEnd.toISOString() : null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "解約処理に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
