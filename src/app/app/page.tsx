"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Save, ArrowRight } from "lucide-react";
import { EMOTIONS, getEmotionMeta, type EmotionKey } from "@/config/emotions";
import { getPlanConfig } from "@/config/plans";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api-client";
import type { EntryItem } from "@/types";

export default function MainHomePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);
  const maxChars = planConfig.limits.maxEntryChars;

  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState<EmotionKey>("anxiety");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<EntryItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ entries: EntryItem[] }>("/api/entries");
        if (active) {
          setRecentEntries(data.entries.slice(0, 3));
        }
      } catch {
        // ignore initial load error if backend env is not ready yet
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (goToCoaching: boolean) => {
    setError(null);
    setMessage(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setError("今、心の中にあることを少しでも書いてみてください。");
      return;
    }
    if (trimmed.length > maxChars) {
      setError(`1回の記録は${maxChars}文字以内で入力してください。`);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ entry: EntryItem }>("/api/entries", {
        method: "POST",
        body: JSON.stringify({ content: trimmed, emotion }),
      });

      setContent("");
      setRecentEntries((prev) => [res.entry, ...prev].slice(0, 3));

      if (goToCoaching) {
        router.push(`/app/coaching?entryId=${encodeURIComponent(res.entry.id)}`);
      } else {
        setMessage("本音を保存しました。");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ヘッダーメッセージ */}
      <section className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-slate-900">今日の本音</h1>
        <p className="text-sm text-slate-600">
          誰にも見せない場所だから、正直に書いてください。
        </p>
      </section>

      {/* 本音入力カード */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div>
          <label
            htmlFor="honne-input"
            className="block text-sm font-medium text-slate-800 mb-2"
          >
            今、心の中にあることは？
          </label>
          <textarea
            id="honne-input"
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxChars}
            placeholder="きれいな言葉にする必要はありません。今の気持ちをそのまま書いてください。"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/40 p-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 resize-y leading-relaxed"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>記録は暗号化され、あなた以外には公開されません。</span>
            <span>
              {content.length} / {maxChars}
            </span>
          </div>
        </div>

        {/* 感情カテゴリ */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-slate-700">
            いま近い感情（ひとつ選択）
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((item) => {
              const selected = emotion === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEmotion(item.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selected
                      ? item.activeClass
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-3 px-5 rounded-xl text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "本音を保存する"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 py-3 px-5 rounded-xl text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            保存してAIと深掘りする
          </button>
        </div>
      </section>

      {/* 最近の記録 */}
      {recentEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">最近の記録</h2>
            <Link
              href="/app/entries"
              className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              すべて見る
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentEntries.map((entry) => {
              const meta = getEmotionMeta(entry.emotion);
              return (
                <Link
                  key={entry.id}
                  href={`/app/entries/${entry.id}`}
                  className="block bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <time className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
