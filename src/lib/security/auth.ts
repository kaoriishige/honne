import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { PlanId } from "@/config/plans";
import type { SubscriptionStatus, UserProfile } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export async function verifyRequestAuth(
  request: Request
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      emailVerified: Boolean(decoded.email_verified),
    };
  } catch {
    return null;
  }
}

function toIsoString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return null;
}

export async function getOrCreateUserProfile(
  authUser: AuthenticatedUser
): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(authUser.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const now = Timestamp.now();
    const initial = {
      uid: authUser.uid,
      email: authUser.email,
      plan: "free" as PlanId,
      subscriptionStatus: "none" as SubscriptionStatus,
      billingProvider: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      settings: {
        aiConsentAcceptedAt: null,
      },
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(initial);
    return {
      uid: initial.uid,
      email: initial.email,
      plan: initial.plan,
      subscriptionStatus: initial.subscriptionStatus,
      billingProvider: null,
      currentPeriodEnd: null,
      aiConsentAcceptedAt: null,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  }

  const data = snap.data() ?? {};

  // 解約予約済みで期限切れの場合はサーバー側で無料へダウングレード判定
  let effectivePlan: PlanId = data.plan === "paid" ? "paid" : "free";
  const currentPeriodEndIso = toIsoString(data.currentPeriodEnd);
  if (
    effectivePlan === "paid" &&
    data.subscriptionStatus === "canceled_pending" &&
    currentPeriodEndIso &&
    new Date(currentPeriodEndIso).getTime() < Date.now()
  ) {
    effectivePlan = "free";
    await ref.update({
      plan: "free",
      subscriptionStatus: "canceled",
      updatedAt: Timestamp.now(),
    });
  }

  return {
    uid: authUser.uid,
    email: typeof data.email === "string" ? data.email : authUser.email,
    plan: effectivePlan,
    subscriptionStatus: (data.subscriptionStatus ?? "none") as SubscriptionStatus,
    billingProvider: data.billingProvider ?? null,
    currentPeriodEnd: currentPeriodEndIso,
    aiConsentAcceptedAt: toIsoString(data.settings?.aiConsentAcceptedAt),
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(data.updatedAt) ?? new Date().toISOString(),
  };
}
