import type { SubscriptionStatus } from "@/types";

export interface CreateSubscriptionInput {
  uid: string;
  email: string;
  existingCustomerId?: string | null;
  sourceId: string;
  verificationToken?: string;
}

export interface CreateSubscriptionResult {
  provider: "square" | "stripe";
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

export interface CancelSubscriptionResult {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

/**
 * 将来 Stripe 等を追加する際に差し替え・併存できる決済プロバイダ抽象インターフェース
 */
export interface BillingProvider {
  readonly name: "square" | "stripe";
  isConfigured(): boolean;
  createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult>;
}
