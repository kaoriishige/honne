"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, PenLine } from "lucide-react";
import { EMOTIONS, getEmotionMeta } from "@/config/emotions";
import { apiFetch } from "@/lib/api-client";
import type { EntryItem } from "@/types";

export default function EntriesListPage() {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emotionFilter, setEmotionFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (emotionFilter !== "all") params.set("emotion", emotionFilter);
      if (monthFilter) params.set("month", monthFilter);
      if (keyword.trim()) params.set("q", keyword.trim());

      const query = params.toString();
      const data = await apiFetch<{ entries: EntryItem[] }>(
        `/api/entries${query ? `?${query}` : ""}`
      );
      setEntries(data.entries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "記録の読み込みに失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  }, [emotionFilter, monthFilter, keyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  // 日付別グルーピング
  const grouped = entries.reduce<Record<string, EntryItem[]>>((acc, item) => {
    const dateKey = new Date(item.createdAt).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">本音の記録</h1>
          <p className="text-xs text-slate-500 mt-1">
            あなただけが閲覧できる過去の記録です。
          </p>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
        >
          <PenLine className="w-3.5 h-3.5" />
          新しく書く
        </Link>
      </div>

      {/* 検索・フィルタ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワードで検索..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900"
            />
          </div>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="年月で絞り込み"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setEmotionFilter("all")}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              emotionFilter === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            すべて
          </button>
          {EMOTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setEmotionFilter(item.key)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                emotionFilter === item.key
                  ? item.activeClass
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">
            該当する記録はまだありません。
          </p>
          <Link
            href="/app"
            className="inline-block text-xs font-medium text-slate-900 underline underline-offset-4"
          >
            今の気持ちを書いてみる
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2.5">
              <h2 className="text-xs font-semibold text-slate-500 px-1">
                {dateLabel}
              </h2>
              <div className="space-y-2.5">
                {items.map((entry) => {
                  const meta = getEmotionMeta(entry.emotion);
                  return (
                    <Link
                      key={entry.id}
                      href={`/app/entries/${entry.id}`}
                      className="block bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 sm:p-5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <time className="text-xs text-slate-400">
                          {new Date(entry.createdAt).toLocaleTimeString(
                            "ja-JP",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </time>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                        {entry.content}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
