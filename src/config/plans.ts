export type PlanId = "free" | "paid";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceJpy: number;
  billingCycleLabel: string;
  description: string;
  limits: {
    maxEntryChars: number;
    monthlyAiChatLimit: number;
    monthlyAnalysisLimit: number;
    monthlyReportEnabled: boolean;
    deepAnalysisEnabled: boolean;
  };
  features: string[];
}

export const TRIAL_LIMITS = {
  maxAttempts: 3,
  maxChars: 500,
} as const;

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "無料プラン",
    priceJpy: 0,
    billingCycleLabel: "無料",
    description: "まずは本音を吐き出し、AIとの対話を試したい方向け",
    limits: {
      maxEntryChars: 1500,
      monthlyAiChatLimit: 10,
      monthlyAnalysisLimit: 2,
      monthlyReportEnabled: false,
      deepAnalysisEnabled: false,
    },
    features: [
      "本音の記録・編集・削除（無制限）",
      "過去の記録の閲覧・検索",
      "AIとの深掘り対話（月10回まで）",
      "簡易感情分析（月2回まで）",
    ],
  },
  paid: {
    id: "paid",
    name: "プレミアムプラン",
    priceJpy: 480,
    billingCycleLabel: "月額 480円（税込）",
    description: "継続的に自分の思考パターンや変化を深く理解したい方向け",
    limits: {
      maxEntryChars: 3000,
      monthlyAiChatLimit: 150,
      monthlyAnalysisLimit: 15,
      monthlyReportEnabled: true,
      deepAnalysisEnabled: true,
    },
    features: [
      "本音の記録・過去の記録（全期間）",
      "AIとの深掘り対話（月150回まで）",
      "詳細感情分析・思考パターン分析（月15回まで）",
      "月間レポート（前月比較・振り返り）",
      "過去と現在の変化の可視化",
    ],
  },
};

export function getPlanConfig(plan: PlanId | string | undefined): PlanConfig {
  return plan === "paid" ? PLANS.paid : PLANS.free;
}
