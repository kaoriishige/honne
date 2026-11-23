import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
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
        {
          error:
            "Stripe 決済の環境変数が未設定のため、現在お申し込みを受け付けられません。",
        },
        { status: 503 }
      );
    }

    const profile = await getOrCreateUserProfile(user);
    if (profile.plan === "paid" && profile.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "すでに有料プランをご利用中です。" },
        { status: 409 }
      );
    }

    const userSnap = await getAdminDb().collection("users").doc(user.uid).get();
    const existingCustomerId =
      typeof userSnap.data()?.stripeCustomerId === "string"
        ? (userSnap.data()!.stripeCustomerId as string)
        : undefined;

    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl(request);
    const priceId = process.env.STRIPE_PRICE_ID_PAID_MONTHLY!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.uid,
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email || undefined }),
      metadata: {
        uid: user.uid,
      },
      subscription_data: {
        metadata: {
          uid: user.uid,
        },
      },
      success_url: `${baseUrl}/app/settings?billing=success`,
      cancel_url: `${baseUrl}/app/settings?billing=canceled`,
      locale: "ja",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "決済ページの生成に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "決済セッションの作成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
