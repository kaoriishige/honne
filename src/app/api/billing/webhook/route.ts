import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  extractSubscriptionPeriodEnd,
  getStripeClient,
  mapStripeSubscriptionStatus,
  verifyStripeWebhookEvent,
} from "@/lib/billing/stripe";

async function findUserRef(params: {
  uid?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  const db = getAdminDb();
  const usersCol = db.collection("users");

  if (params.uid) {
    const docRef = usersCol.doc(params.uid);
    const snap = await docRef.get();
    if (snap.exists) return docRef;
  }

  if (params.subscriptionId) {
    const snap = await usersCol
      .where("stripeSubscriptionId", "==", params.subscriptionId)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  if (params.customerId) {
    const snap = await usersCol
      .where("stripeCustomerId", "==", params.customerId)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  return null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id?: string } })
    .subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && legacy.id) return legacy.id;

  const parentSub = (
    invoice as unknown as {
      parent?: { subscription_details?: { subscription?: string | { id?: string } } };
    }
  ).parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  if (parentSub && typeof parentSub === "object" && parentSub.id) {
    return parentSub.id;
  }
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = verifyStripeWebhookEvent({
      rawBody,
      signatureHeader: signature,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 }
    );
  }

  try {
    const now = Timestamp.now();

    // 1. Checkout 完了：顧客ID・サブスクリプションIDを紐付け、サーバー検証のうえで有料プラン有効化
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        return NextResponse.json({ received: true });
      }

      const uid = session.metadata?.uid || session.client_reference_id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      const userRef = await findUserRef({ uid, customerId, subscriptionId });
      if (userRef && subscriptionId) {
        const stripe = getStripeClient();
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const mappedStatus = mapStripeSubscriptionStatus(
          sub.status,
          sub.cancel_at_period_end
        );
        const periodEnd = extractSubscriptionPeriodEnd(sub);
        const isPaid =
          mappedStatus === "active" || mappedStatus === "canceled_pending";

        await userRef.update({
          plan: isPaid ? "paid" : "free",
          subscriptionStatus: mappedStatus,
          billingProvider: "stripe",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          ...(periodEnd
            ? { currentPeriodEnd: Timestamp.fromDate(periodEnd) }
            : {}),
          updatedAt: now,
        });
      }
      return NextResponse.json({ received: true });
    }

    // 2. サブスクリプション状態変更・解約完了
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

      const userRef = await findUserRef({
        uid: sub.metadata?.uid,
        customerId,
        subscriptionId: sub.id,
      });

      if (userRef) {
        const mappedStatus =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : mapStripeSubscriptionStatus(sub.status, sub.cancel_at_period_end);
        const periodEnd = extractSubscriptionPeriodEnd(sub);
        const isPaid =
          mappedStatus === "active" || mappedStatus === "canceled_pending";

        await userRef.update({
          plan: isPaid ? "paid" : "free",
          subscriptionStatus: mappedStatus,
          billingProvider: "stripe",
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          stripeSubscriptionId: sub.id,
          ...(periodEnd
            ? { currentPeriodEnd: Timestamp.fromDate(periodEnd) }
            : {}),
          updatedAt: now,
        });
      }
      return NextResponse.json({ received: true });
    }

    // 3. 毎月の自動課金成功
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      const userRef = await findUserRef({ customerId, subscriptionId });
      if (userRef && invoice.id) {
        const amountJpy = Number(invoice.amount_paid ?? 0);
        await userRef
          .collection("payments")
          .doc(invoice.id)
          .set(
            {
              provider: "stripe",
              invoiceId: invoice.id,
              amountJpy,
              status: "paid",
              paidAt: now,
              createdAt: now,
            },
            { merge: true }
          );

        const snap = await userRef.get();
        const curStatus = snap.data()?.subscriptionStatus;
        await userRef.update({
          plan: "paid",
          subscriptionStatus:
            curStatus === "canceled_pending" ? "canceled_pending" : "active",
          updatedAt: now,
        });
      }
      return NextResponse.json({ received: true });
    }

    // 4. 支払い失敗
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      const userRef = await findUserRef({ customerId, subscriptionId });
      if (userRef && invoice.id) {
        const amountJpy = Number(invoice.amount_due ?? 480);
        await userRef
          .collection("payments")
          .doc(`${invoice.id}_failed`)
          .set(
            {
              provider: "stripe",
              invoiceId: invoice.id,
              amountJpy,
              status: "failed",
              note: "お支払いに失敗しました。Stripe ポータルからカード情報をご確認ください。",
              paidAt: now,
              createdAt: now,
            },
            { merge: true }
          );

        await userRef.update({
          subscriptionStatus: "past_due",
          updatedAt: now,
        });
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
