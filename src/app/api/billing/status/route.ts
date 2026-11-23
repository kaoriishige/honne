import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOrCreateUserProfile, verifyRequestAuth } from "@/lib/security/auth";
import { isStripeServerConfigured } from "@/lib/billing/stripe";
import type { BillingStatusResponse, PaymentHistoryItem } from "@/types";

export async function GET(request: Request) {
  const user = await verifyRequestAuth(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(user);
    const userRef = getAdminDb().collection("users").doc(user.uid);

    const [userSnap, paymentsSnap] = await Promise.all([
      userRef.get(),
      userRef
        .collection("payments")
        .orderBy("paidAt", "desc")
        .limit(24)
        .get(),
    ]);

    const hasCustomerPortal = Boolean(userSnap.data()?.stripeCustomerId);

    const payments: PaymentHistoryItem[] = paymentsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        provider: d.provider === "square" ? "square" : "stripe",
        invoiceId: typeof d.invoiceId === "string" ? d.invoiceId : null,
        amountJpy: Number(d.amountJpy ?? 0),
        status:
          d.status === "failed"
            ? "failed"
            : d.status === "refunded"
            ? "refunded"
            : "paid",
        paidAt:
          d.paidAt instanceof Timestamp
            ? d.paidAt.toDate().toISOString()
            : new Date().toISOString(),
        note: typeof d.note === "string" ? d.note : null,
      };
    });

    const response: BillingStatusResponse = {
      plan: profile.plan,
      subscriptionStatus: profile.subscriptionStatus,
      billingProvider: profile.billingProvider,
      currentPeriodEnd: profile.currentPeriodEnd,
      stripeConfigured: isStripeServerConfigured(),
      hasCustomerPortal,
      payments,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "契約状態の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
