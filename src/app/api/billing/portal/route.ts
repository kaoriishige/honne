import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/security/auth";
import {
  getAppBaseUrl,
  getStripeClient,
  isStripeServerConfigured,
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

    const snap = await getAdminDb().collection("users").doc(user.uid).get();
    const customerId =
      typeof snap.data()?.stripeCustomerId === "string"
        ? (snap.data()!.stripeCustomerId as string)
        : null;

    if (!customerId) {
      return NextResponse.json(
        { error: "Stripe の顧客情報が見つかりません。" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl(request);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/app/settings`,
      locale: "ja",
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Customer Portal の起動に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
