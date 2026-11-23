import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getPlanConfig, type PlanId } from "@/config/plans";

export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function checkAndReserveAiUsage(params: {
  uid: string;
  plan: PlanId;
  kind: "chat" | "analysis";
}): Promise<{ allowed: boolean; current: number; limit: number; period: string }> {
  const period = getCurrentPeriod();
  const planConfig = getPlanConfig(params.plan);
  const limit =
    params.kind === "chat"
      ? planConfig.limits.monthlyAiChatLimit
      : planConfig.limits.monthlyAnalysisLimit;

  const ref = getAdminDb()
    .collection("users")
    .doc(params.uid)
    .collection("usage")
    .doc(period);

  const snap = await ref.get();
  const data = snap.data() ?? {};
  const current = Number(
    params.kind === "chat"
      ? data.aiChatCount ?? 0
      : data.aiAnalysisCount ?? 0
  );

  if (current >= limit) {
    return { allowed: false, current, limit, period };
  }

  return { allowed: true, current, limit, period };
}

export async function recordAiUsage(params: {
  uid: string;
  kind: "chat" | "analysis";
  inputTokens?: number;
  outputTokens?: number;
}): Promise<void> {
  const period = getCurrentPeriod();
  const ref = getAdminDb()
    .collection("users")
    .doc(params.uid)
    .collection("usage")
    .doc(period);

  await ref.set(
    {
      period,
      aiChatCount:
        params.kind === "chat" ? FieldValue.increment(1) : FieldValue.increment(0),
      aiAnalysisCount:
        params.kind === "analysis"
          ? FieldValue.increment(1)
          : FieldValue.increment(0),
      inputTokensTotal: FieldValue.increment(params.inputTokens ?? 0),
      outputTokensTotal: FieldValue.increment(params.outputTokens ?? 0),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
