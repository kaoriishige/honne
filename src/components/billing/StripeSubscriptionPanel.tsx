"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PLANS } from "@/config/plans";
import { apiFetch } from "@/lib/api-client";
import type { BillingStatusResponse, SubscriptionStatus } from "@/types";

function formatStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "有効（自動継続中）";
    case "canceled_pending":
      return "解約予約済み（期間終了まで利用可）";
    case "past_due":
      return "支払い失敗（要確認）";
    case "canceled":
      return "解約済み";
    default:
      return "未契約（無料プラン）";
  }
}

export function StripeSubscriptionPanel() {
  const searchParams = useSearchParams();
  const billingParam = searchParams.get("billing");

  const { refreshProfile } = useAuth();
  const [statusData, setStatusData] = useState<BillingStatusResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBillingStatus = async () => {
    try {
      const data = await apiFetch<BillingStatusResponse>("/api/billing/status");
      setStatusData(data);
    } catch {
      // ignore if backend not configured yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<BillingStatusResponse>(
          "/api/billing/status"
        );
        if (active) setStatusData(data);
        if (billingParam === "success" && active) {
          setMessage(
            "決済手続きが完了しました。反映まで数秒かかる場合があります。"
          );
          await refreshProfile();
        } else if (billingParam === "canceled" && active) {
          setMessage("決済手続きをキャンセルしました。");
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [billingParam, refreshProfile]);

  const handleCheckout = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const data = await apiFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
      });
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "決済ページの起動に失敗しました。"
      );
      setBusy(false);
    }
  };

  const handleOpenPortal = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const data = await apiFetch<{ url: string }>("/api/billing/portal", {
        method: "POST",
      });
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "契約管理ページの起動に失敗しました。"
      );
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "プレミアムプランを解約しますか？解約手続き後も、現在の請求期間終了までは有料機能をご利用いただけます。"
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch("/api/billing/cancel", { method: "POST" });
      setMessage(
        "解約予約を受け付けました。現在の請求期間終了まで引き続きご利用いただけます。"
      );
      await Promise.all([loadBillingStatus(), refreshProfile()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "解約手続きに失敗しました。"
      );
    } finally {
      setBusy(false);
    }
  };

  const isPaidActive =
    statusData?.plan === "paid" &&
    statusData?.subscriptionStatus === "active";
  const isCanceledPending =
    statusData?.subscriptionStatus === "canceled_pending";
  const isPastDue = statusData?.subscriptionStatus === "past_due";

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            契約プラン・サブスクリプション管理
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            決済は Stripe Checkout により安全に処理されます。
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-800">
          {statusData?.plan === "paid" ? PLANS.paid.name : PLANS.free.name}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">契約状態を確認中...</p>
      ) : (
        <>
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-1.5 text-xs text-slate-700">
            <p>
              <strong>契約状態：</strong>
              {formatStatusLabel(statusData?.subscriptionStatus ?? "none")}
            </p>
            {statusData?.currentPeriodEnd && (
              <p>
                <strong>
                  {isCanceledPending ? "有料機能の利用期限：" : "次回更新日："}
                </strong>
                {new Date(statusData.currentPeriodEnd).toLocaleDateString(
                  "ja-JP",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            )}
          </div>

          {isPastDue && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                直近のお支払いに失敗しました。Stripe のお支払い管理画面からカード情報をご確認ください。
              </p>
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* 無料プランの場合：Stripe Checkout 申込案内 */}
          {statusData?.plan !== "paid" && (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {PLANS.paid.name}
                </h3>
                <span className="text-base font-semibold text-slate-900">
                  {PLANS.paid.billingCycleLabel}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {PLANS.paid.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {!statusData?.stripeConfigured ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  Stripe 決済の環境変数が未設定のため、現在はお申し込み手続きを開始できません。環境変数設定後にご利用いただけます。
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCheckout}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  {busy
                    ? "決済ページへ移動中..."
                    : "プレミアムプランに申し込む（月額480円）"}
                </button>
              )}
            </div>
          )}

          {/* Stripe Customer Portal & 解約ボタン */}
          {(statusData?.hasCustomerPortal || isPaidActive) && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {statusData?.hasCustomerPortal && statusData?.stripeConfigured && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleOpenPortal}
                  className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  お支払い・契約管理（Stripeポータル）
                </button>
              )}

              {isPaidActive && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCancel}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
                >
                  サブスクリプションを解約する
                </button>
              )}
            </div>
          )}

          {/* 決済履歴 */}
          {statusData && statusData.payments.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>決済履歴</span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {statusData.payments.map((p) => (
                  <div
                    key={p.id}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs bg-white"
                  >
                    <div>
                      <p className="text-slate-800 font-medium">
                        ¥{p.amountJpy.toLocaleString("ja-JP")}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.paidAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        p.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : p.status === "failed"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status === "paid"
                        ? "決済完了"
                        : p.status === "failed"
                        ? "失敗"
                        : "返金済み"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
