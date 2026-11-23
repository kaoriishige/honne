"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Check, PencilLine, Info } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPlanConfig } from "@/config/plans";
import { apiFetch } from "@/lib/api-client";
import type { AnalysisItem } from "@/types";

export default function AnalysisPage() {
  const { profile, usage, refreshProfile } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 訂正フォーム状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ analyses: AnalysisItem[] }>("/api/analysis");
        if (active) setAnalyses(data.analyses);
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

  const handleRunAnalysis = async () => {
    setError(null);
    setRunning(true);
    try {
      const data = await apiFetch<{ analysis: AnalysisItem }>("/api/analysis", {
        method: "POST",
      });
      setAnalyses((prev) => [data.analysis, ...prev]);
      await refreshProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "感情分析の実行に失敗しました。"
      );
    } finally {
      setRunning(false);
    }
  };

  const handleSaveCorrection = async (id: string) => {
    setSavingCorrection(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string; userCorrection: string | null }>(
        `/api/analysis/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ correction: correctionDraft }),
        }
      );
      setAnalyses((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, userCorrection: data.userCorrection }
            : item
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "訂正の保存に失敗しました。"
      );
    } finally {
      setSavingCorrection(false);
    }
  };

  const used = usage?.aiAnalysisCount ?? 0;
  const limit = planConfig.limits.monthlyAnalysisLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AI感情分析</h1>
          <p className="text-xs text-slate-500 mt-1">
            過去の記録から、感情や思考の傾向を静かに整理します（
            {planConfig.limits.deepAnalysisEnabled ? "詳細分析" : "簡易分析"}）。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            今月：{used} / {limit} 回
          </span>
          <button
            type="button"
            disabled={running}
            onClick={handleRunAnalysis}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-medium"
          >
            <Sparkles className="w-4 h-4" />
            {running ? "分析中..." : "いまの記録を分析する"}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-100/80 border border-slate-200 px-4 py-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
        <p>
          AIは心理疾患の診断や性格の断定を行いません。「記録から読み取れる傾向」と「AIの推測」を分けて表示します。違うと感じた点は、あなた自身の言葉で訂正できます。
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      ) : analyses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm text-slate-700">
            まだ分析結果がありません。
          </p>
          <p className="text-xs text-slate-500">
            本音の記録が2件以上たまると、傾向を整理できます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {analyses.map((item) => {
            const obs = item.result.observations;
            const isEditing = editingId === item.id;
            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.type === "deep" ? "詳細分析" : "簡易分析"}
                    </span>
                    <span className="text-xs text-slate-500">
                      対象記録：{item.entryCount}件
                    </span>
                  </div>
                  <time className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </time>
                </div>

                {/* 全体サマリー */}
                <p className="text-sm text-slate-800 leading-relaxed">
                  {item.result.summary}
                </p>

                {/* 記録から読み取れる傾向（観察事実） */}
                <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
                  <h2 className="text-xs font-semibold text-slate-900 tracking-wide">
                    1. 記録から読み取れる傾向
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        よく現れる感情
                      </p>
                      <p>{obs?.frequentEmotions?.join("、") || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        感情の変化
                      </p>
                      <p>{obs?.emotionChanges || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        繰り返し出てくる悩み
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {(obs?.recurringWorries ?? []).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        よく登場する人間関係のテーマ
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {(obs?.relationshipThemes ?? []).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        自分を否定する言葉の傾向
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {(obs?.selfCriticalPatterns ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        不安や怒りが強くなる状況
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {(obs?.triggerSituations ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-700">
                    <p className="font-semibold text-slate-800 mb-1">
                      過去と現在の変化
                    </p>
                    <p>{obs?.pastVsPresent || "—"}</p>
                  </div>
                </div>

                {/* AIの推測（仮説） */}
                <div className="space-y-2.5 bg-indigo-50/40 border border-indigo-200/70 rounded-xl p-4 sm:p-5">
                  <h2 className="text-xs font-semibold text-indigo-950 tracking-wide">
                    2. AIによる推測・仮説（断定ではありません）
                  </h2>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {(item.result.hypotheses ?? []).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  {item.result.checkQuestion && (
                    <p className="text-xs text-indigo-950 font-medium pt-2 border-t border-indigo-200/60">
                      確認の問いかけ：{item.result.checkQuestion}
                    </p>
                  )}
                </div>

                {/* 本人による訂正エリア */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800">
                      あなた自身の訂正・気づきメモ
                    </p>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setCorrectionDraft(item.userCorrection ?? "");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                      >
                        <PencilLine className="w-3.5 h-3.5" />
                        {item.userCorrection ? "訂正を編集" : "違うと感じた点を訂正する"}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={correctionDraft}
                        onChange={(e) => setCorrectionDraft(e.target.value)}
                        placeholder="例：怒りというより、本当は寂しさの方が近かった気がする。"
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={savingCorrection}
                          onClick={() => handleSaveCorrection(item.id)}
                          className="inline-flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-3.5 py-1.5 rounded-lg text-xs font-medium"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {savingCorrection ? "保存中..." : "訂正を保存"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : item.userCorrection ? (
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap">
                      {item.userCorrection}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      違和感があれば、自分の言葉で書き直して残せます。
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
