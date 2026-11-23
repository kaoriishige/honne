"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Plus, AlertTriangle, ShieldCheck, MessageCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPlanConfig } from "@/config/plans";
import { apiFetch } from "@/lib/api-client";
import type { ChatMessage, ConversationSummary, EntryItem } from "@/types";

function CoachingWorkspace() {
  const searchParams = useSearchParams();
  const entryIdParam = searchParams.get("entryId");

  const { profile, usage, refreshProfile } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);
  const maxChars = planConfig.limits.maxEntryChars;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingConsent, setAcceptingConsent] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ conversations: ConversationSummary[] }>(
          "/api/coaching"
        );
        if (active) {
          setConversations(data.conversations);
        }
      } catch {
        // ignore initial load error
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 記録詳細・メイン画面から「AIと深掘りする」で遷移した場合に記録本文を初期セット
  useEffect(() => {
    if (!entryIdParam) return;
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<{ entry: EntryItem }>(
          `/api/entries/${encodeURIComponent(entryIdParam)}`
        );
        if (active && data.entry?.content) {
          setActiveConversationId(null);
          setMessages([]);
          setInput(data.entry.content);
        }
      } catch {
        // ignore if entry not found
      }
    })();
    return () => {
      active = false;
    };
  }, [entryIdParam]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = async (id: string) => {
    setError(null);
    setActiveConversationId(id);
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>(
        `/api/coaching?conversationId=${encodeURIComponent(id)}`
      );
      setMessages(data.messages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "対話の読み込みに失敗しました。"
      );
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleAcceptConsent = async () => {
    setAcceptingConsent(true);
    setError(null);
    try {
      await apiFetch("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ acceptAiConsent: true }),
      });
      await refreshProfile();
    } catch {
      setError("同意の保存に失敗しました。");
    } finally {
      setAcceptingConsent(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await apiFetch<{
        conversationId: string;
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>("/api/coaching", {
        method: "POST",
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          entryId: !activeConversationId && entryIdParam ? entryIdParam : undefined,
          message: trimmed,
        }),
      });

      setInput("");
      setActiveConversationId(res.conversationId);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);

      // 一覧と利用枠を更新
      const listData = await apiFetch<{ conversations: ConversationSummary[] }>(
        "/api/coaching"
      );
      setConversations(listData.conversations);
      await refreshProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "メッセージの送信に失敗しました。"
      );
    } finally {
      setSending(false);
    }
  };

  const aiConsentAccepted = Boolean(profile?.aiConsentAcceptedAt);
  const usedCount = usage?.aiChatCount ?? 0;
  const limitCount = planConfig.limits.monthlyAiChatLimit;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AIコーチング</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            否定も説教もせず、ひとつの問いかけで自分の本音を整理します。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            今月の対話：{usedCount} / {limitCount} 回
          </span>
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            新しい対話
          </button>
        </div>
      </div>

      {/* 初回AI送信同意 */}
      {profile && !aiConsentAccepted && (
        <div className="bg-white border border-slate-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                AI機能のご利用前の確認
              </p>
              <p>
                AIコーチング・感情分析・月間レポートでは、応答生成に必要な範囲の文章のみを暗号化通信で OpenAI API へ送信します。送信された文章を広告や公開、AIモデルの再学習に利用することはありません。また、AIの応答は医療診断や治療ではありません。
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={acceptingConsent}
            onClick={handleAcceptConsent}
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-medium"
          >
            {acceptingConsent ? "保存中..." : "内容を理解してAI対話を始める"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 過去の対話スレッド一覧 */}
        <aside className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-3 space-y-2 max-h-[220px] md:max-h-[560px] overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-500 px-2 py-1">
            過去の対話
          </p>
          {loadingList ? (
            <p className="text-xs text-slate-400 px-2 py-3">読み込み中...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-3">
              まだ対話履歴はありません
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <p className="truncate font-medium">{conv.title}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    activeConversationId === conv.id
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {new Date(conv.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              </button>
            ))
          )}
        </aside>

        {/* チャットエリア */}
        <section className="md:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-[460px] max-h-[620px]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3 text-slate-500">
                <MessageCircle className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  今、モヤモヤしていることや本音を書いてみてください
                </p>
                <p className="text-xs max-w-sm leading-relaxed">
                  「本当はあの人の成功が面白くない」「理由は分からないけれど焦っている」など、そのままの言葉で大丈夫です。
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-sm"
                        : msg.role === "safety"
                        ? "bg-amber-50 border border-amber-300 text-amber-950 rounded-tl-sm"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "safety" && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>専門窓口のご案内</span>
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="border-t border-slate-200 p-3 sm:p-4 space-y-2"
          >
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={maxChars}
              disabled={sending || (Boolean(profile) && !aiConsentAccepted)}
              placeholder="今の気持ちや、問いかけへの返答をそのまま書いてください..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 resize-none disabled:bg-slate-100"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {input.length} / {maxChars}
              </span>
              <button
                type="submit"
                disabled={
                  sending ||
                  !input.trim() ||
                  (Boolean(profile) && !aiConsentAccepted)
                }
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "送信中..." : "送信する"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function CoachingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      }
    >
      <CoachingWorkspace />
    </Suspense>
  );
}
