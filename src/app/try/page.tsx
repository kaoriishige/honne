"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { TRIAL_LIMITS } from "@/config/plans";

interface TrialExchange {
  userText: string;
  aiReply: string;
  isSafetyResponse: boolean;
}

export default function FreeTrialPage() {
  const [content, setContent] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [remaining, setRemaining] = useState<number>(TRIAL_LIMITS.maxAttempts);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<TrialExchange[]>([]);

  const replySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (exchanges.length > 0) {
      replySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [exchanges]);

  const submitTrial = async () => {
    if (submitting) return;
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setError("今の気持ちを少しでも書いてみてください。");
      return;
    }
    if (!agreed) {
      setError(
        "上の「AIへ送信することに同意する」にチェックを入れてから送信してください。"
      );
      return;
    }

    setSubmitting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch("/api/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          agreedToAiTransmission: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawText = await res.text();
      let data: {
        reply?: string;
        isSafetyResponse?: boolean;
        remaining?: number;
        error?: string;
      } = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `サーバー応答の読み込みに失敗しました（ステータス: ${res.status}）。もう一度お試しください。`
        );
      }

      if (!res.ok) {
        if (typeof data.remaining === "number") {
          setRemaining(data.remaining);
        }
        throw new Error(
          data.error || `応答の生成に失敗しました（ステータス: ${res.status}）。`
        );
      }

      if (!data.reply) {
        throw new Error("AIからの返答が空でした。もう一度お試しください。");
      }

      setExchanges((prev) => [
        ...prev,
        {
          userText: trimmed,
          aiReply: data.reply!,
          isSafetyResponse: Boolean(data.isSafetyResponse),
        },
      ]);
      setRemaining(
        typeof data.remaining === "number"
          ? data.remaining
          : Math.max(0, remaining - 1)
      );
      setContent("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "通信がタイムアウトしました。電波状況をご確認のうえ、もう一度お試しください。"
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "通信エラーが発生しました。もう一度お試しください。"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitTrial();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-12 pb-16 sm:py-14">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            トップへ戻る
          </Link>
          <span className="text-xs text-slate-500">
            無料体験（残り {remaining} / {TRIAL_LIMITS.maxAttempts} 回）
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              今、心の中にあることは？
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              AIはあなたを否定も説教もしません。決めつけずに、ひとつの問いを返します。
            </p>
          </div>

          {remaining > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={TRIAL_LIMITS.maxChars}
                  placeholder="きれいな言葉にする必要はありません。今の気持ちをそのまま書いてください。"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/40 p-4 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 resize-y leading-relaxed"
                />
                <div className="mt-1 flex justify-end text-xs text-slate-400">
                  {content.length} / {TRIAL_LIMITS.maxChars}
                </div>
              </div>

              {/* AI送信の事前明示（スマホで確実にタップ可能） */}
              <div
                onClick={() => {
                  setAgreed((prev) => !prev);
                  if (error) setError(null);
                }}
                role="checkbox"
                aria-checked={agreed}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setAgreed((prev) => !prev);
                  }
                }}
                className={`rounded-xl border p-4 space-y-2.5 cursor-pointer select-none transition-colors ${
                  agreed
                    ? "bg-slate-100/80 border-slate-900/40"
                    : error && !agreed
                    ? "bg-rose-50/60 border-rose-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    入力内容はAIの応答を生成するため外部のAIサービス（OpenAI
                    API）に送信されます。無料体験では記録はサーバーに永続保存されず、他の利用者に公開されることもありません。
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    checked={agreed}
                    readOnly
                    className="w-5 h-5 rounded border-slate-300 accent-slate-900 shrink-0 pointer-events-none"
                  />
                  <span className="text-xs sm:text-sm font-medium text-slate-900">
                    上記を確認し、AIへ送信することに同意する
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 py-3.5 rounded-xl text-sm font-medium transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? "AIが問いかけを考えています..."
                  : "AIに問いかけをもらう"}
              </button>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-50 border border-rose-300 px-4 py-3 text-xs font-medium text-rose-800"
                >
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center space-y-3">
              <p className="text-sm font-medium text-slate-900">
                無料体験の回数（{TRIAL_LIMITS.maxAttempts}回）を使い切りました。
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                無料アカウントを作成すると、本音の暗号化保存・過去記録の振り返り・継続的なAIコーチングや感情分析をご利用いただけます。
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl text-xs font-medium"
              >
                無料でアカウントを作成する
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* AIからの返答エリア（送信ボタンのすぐ下に表示してスマホで見逃さない） */}
          {exchanges.length > 0 && (
            <div
              ref={replySectionRef}
              className="space-y-4 pt-4 border-t border-slate-200"
            >
              <p className="text-xs font-semibold text-slate-500">
                AIとのやりとり（この画面を閉じると消去されます）
              </p>
              {exchanges.map((ex, idx) => (
                <div key={idx} className="space-y-2.5">
                  <div className="bg-slate-100 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap ml-6">
                    {ex.userText}
                  </div>
                  <div
                    className={`rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm whitespace-pre-wrap mr-6 leading-relaxed border ${
                      ex.isSafetyResponse
                        ? "bg-amber-50 border-amber-300 text-amber-950"
                        : "bg-indigo-50/40 border-indigo-200/80 text-slate-900"
                    }`}
                  >
                    {ex.isSafetyResponse ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>大切なご案内</span>
                      </div>
                    ) : (
                      <p className="text-[11px] font-medium text-indigo-900/70 mb-1.5">
                        ほんね。AI からの問いかけ
                      </p>
                    )}
                    {ex.aiReply}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 体験後の会員登録誘導 */}
        {exchanges.length > 0 && remaining > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                この気づきを残して、さらに向き合ってみませんか？
              </p>
              <p className="text-xs text-slate-600">
                無料体験の内容は保存されません。会員登録すると、あなた専用の安全な場所に記録と対話を残せます。
              </p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-medium"
            >
              無料登録へ進む
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
