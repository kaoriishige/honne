"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPlanConfig, PLANS } from "@/config/plans";
import { apiFetch } from "@/lib/api-client";
import type { MonthlyReportItem } from "@/types";

function getDefaultMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);
  const canUseReports = planConfig.limits.monthlyReportEnabled;

  const [targetMonth, setTargetMonth] = useState(getDefaultMonth());
  const [reports, setReports] = useState<MonthlyReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ reports: MonthlyReportItem[] }>(
          "/api/reports"
        );
        if (active) setReports(data.reports);
      } catch {
        // ignore initial load error
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const data = await apiFetch<{ report: MonthlyReportItem }>(
        "/api/reports",
        {
          method: "POST",
          body: JSON.stringify({ targetMonth }),
        }
      );
      setReports((prev) => {
        const filtered = prev.filter(
          (r) => r.targetMonth !== data.report.targetMonth
        );
        return [data.report, ...filtered].sort((a, b) =>
          b.targetMonth.localeCompare(a.targetMonth)
        );
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "月間レポートの作成に失敗しました。"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">月間レポート</h1>
        <p className="text-xs text-slate-500 mt-1">
          毎月、自分の感情や思考の変化を振り返るためのレポートです。
        </p>
      </div>

      {/* 無料プラン時のロック案内 */}
      {!canUseReports ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            月間レポートは{PLANS.paid.name}（{PLANS.paid.billingCycleLabel}
            ）限定機能です
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            今月よく出てきた感情・繰り返した悩み・前月との変化・気づいた思考パターン・来月に向けた振り返りを、毎月自動で整理できます。
          </p>
          <Link
            href="/app/settings"
            className="inline-block bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-medium"
          >
            設定・プラン確認へ
          </Link>
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="report-month"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              振り返る対象月
            </label>
            <input
              id="report-month"
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-medium"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "作成中..." : "この月のレポートを作成"}
          </button>
        </section>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      ) : reports.length === 0 ? (
        canUseReports && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-600">
            まだ作成された月間レポートはありません。対象月を選んで作成してください。
          </div>
        )
      ) : (
        <div className="space-y-6">
          {reports.map((item) => (
            <article
              key={item.targetMonth}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    {item.targetMonth} の振り返り
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  対象記録：{item.entryCount}件
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                  <p className="font-semibold text-slate-900">
                    今月よく出てきた感情
                  </p>
                  <p>{item.report.frequentEmotions?.join("、") || "—"}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                  <p className="font-semibold text-slate-900">
                    今月繰り返した悩み
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {(item.report.recurringWorries ?? []).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 sm:col-span-2">
                  <p className="font-semibold text-slate-900">
                    前月との感情の変化
                  </p>
                  <p className="leading-relaxed">
                    {item.report.comparisonWithPrevMonth || "—"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 sm:col-span-2">
                  <p className="font-semibold text-slate-900">
                    気づいた思考パターン
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {(item.report.thinkingPatterns ?? []).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-indigo-50/40 border border-indigo-200/70 rounded-xl p-4 space-y-1.5 text-xs">
                <p className="font-semibold text-indigo-950">
                  今月の自分への問いかけ
                </p>
                <p className="text-slate-800 leading-relaxed">
                  {item.report.questionForSelf}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  来月に向けた振り返り
                </p>
                <p className="leading-relaxed">
                  {item.report.reflectionForNextMonth}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
