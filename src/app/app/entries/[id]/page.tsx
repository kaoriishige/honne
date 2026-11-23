"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Sparkles, Check, X } from "lucide-react";
import { EMOTIONS, getEmotionMeta, type EmotionKey } from "@/config/emotions";
import { apiFetch } from "@/lib/api-client";
import type { EntryItem } from "@/types";

export default function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [entry, setEntry] = useState<EntryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editEmotion, setEditEmotion] = useState<EmotionKey>("other");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ entry: EntryItem }>(`/api/entries/${id}`);
        if (!active) return;
        setEntry(data.entry);
        setEditContent(data.entry.content);
        setEditEmotion(data.entry.emotion);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "記録の読み込みに失敗しました。"
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleUpdate = async () => {
    setError(null);
    if (!editContent.trim()) {
      setError("内容を入力してください。");
      return;
    }
    setSaving(true);
    try {
      const data = await apiFetch<{ entry: EntryItem }>(`/api/entries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          content: editContent.trim(),
          emotion: editEmotion,
        }),
      });
      setEntry(data.entry);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("この記録を完全に削除します。よろしいですか？")) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/api/entries/${id}`, { method: "DELETE" });
      router.replace("/app/entries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm text-rose-700">
          {error ?? "記録が見つかりませんでした。"}
        </p>
        <Link
          href="/app/entries"
          className="inline-block text-xs font-medium text-slate-900 underline underline-offset-4"
        >
          記録一覧へ戻る
        </Link>
      </div>
    );
  }

  const meta = getEmotionMeta(entry.emotion);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/app/entries"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          記録一覧へ戻る
        </Link>

        {!editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
        {editing ? (
          <>
            <textarea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 leading-relaxed"
            />
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEditEmotion(item.key)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    editEmotion === item.key
                      ? item.activeClass
                      : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleUpdate}
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "保存中..." : "変更を保存"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditContent(entry.content);
                  setEditEmotion(entry.emotion);
                }}
                className="inline-flex items-center gap-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-medium"
              >
                <X className="w-3.5 h-3.5" />
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span
                className={`inline-block text-xs font-medium px-3 py-0.5 rounded-full border ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
              <time className="text-xs text-slate-400">
                {new Date(entry.createdAt).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>

            <div className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href={`/app/coaching?entryId=${encodeURIComponent(entry.id)}`}
                className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                この記録をAIと深掘りする
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
