import type { EmotionKey } from "@/config/emotions";
import type { PlanId } from "@/config/plans";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "canceled_pending"
  | "past_due"
  | "canceled";

export interface UserProfile {
  uid: string;
  email: string;
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  billingProvider: "square" | "stripe" | null;
  currentPeriodEnd: string | null;
  aiConsentAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntryItem {
  id: string;
  content: string;
  emotion: EmotionKey;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSummary {
  period: string;
  aiChatCount: number;
  aiAnalysisCount: number;
}

export interface ConversationSummary {
  id: string;
  entryId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "safety";
  content: string;
  createdAt: string;
}

export interface AnalysisResult {
  summary: string;
  observations: {
    frequentEmotions: string[];
    emotionChanges: string;
    recurringWorries: string[];
    relationshipThemes: string[];
    selfCriticalPatterns: string[];
    triggerSituations: string[];
    pastVsPresent: string;
  };
  hypotheses: string[];
  checkQuestion: string;
}

export interface AnalysisItem {
  id: string;
  type: "simple" | "deep";
  entryCount: number;
  result: AnalysisResult;
  userCorrection: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReportData {
  frequentEmotions: string[];
  recurringWorries: string[];
  comparisonWithPrevMonth: string;
  thinkingPatterns: string[];
  questionForSelf: string;
  reflectionForNextMonth: string;
}

export interface MonthlyReportItem {
  targetMonth: string;
  entryCount: number;
  report: MonthlyReportData;
  createdAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  provider: "square" | "stripe";
  invoiceId: string | null;
  amountJpy: number;
  status: "paid" | "failed" | "refunded";
  paidAt: string;
  note?: string | null;
}

export interface BillingStatusResponse {
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  billingProvider: "square" | "stripe" | null;
  currentPeriodEnd: string | null;
  stripeConfigured: boolean;
  hasCustomerPortal: boolean;
  payments: PaymentHistoryItem[];
}
