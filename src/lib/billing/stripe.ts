import Stripe from "stripe";
import type { SubscriptionStatus } from "@/types";

let cachedStripe: Stripe | null = null;

export function isStripeServerConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PAID_MONTHLY
  );
}

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY が設定されていません。");
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey);
  }
  return cachedStripe;
}

export function getAppBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status | string | undefined,
  cancelAtPeriodEnd?: boolean
): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return cancelAtPeriodEnd ? "canceled_pending" : "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "none";
  }
}

export function extractSubscriptionPeriodEnd(
  sub: Stripe.Subscription
): Date | null {
  const topLevel = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const itemLevel = (
    sub.items?.data?.[0] as unknown as { current_period_end?: number }
  )?.current_period_end;
  const unixSec = topLevel ?? itemLevel;
  return typeof unixSec === "number" ? new Date(unixSec * 1000) : null;
}

export function verifyStripeWebhookEvent(params: {
  rawBody: string;
  signatureHeader: string | null;
}): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET が設定されていません。");
  }
  if (!params.signatureHeader) {
    throw new Error("Stripe-Signature ヘッダーがありません。");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    params.rawBody,
    params.signatureHeader,
    webhookSecret
  );
}
