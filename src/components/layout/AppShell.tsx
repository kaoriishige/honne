"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PenLine,
  BookOpen,
  MessageCircle,
  BarChart3,
  CalendarDays,
  Settings,
  MailCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV_ITEMS = [
  { href: "/app", label: "書く", icon: PenLine, exact: true },
  { href: "/app/entries", label: "記録", icon: BookOpen, exact: false },
  { href: "/app/coaching", label: "AI対話", icon: MessageCircle, exact: false },
  { href: "/app/analysis", label: "分析", icon: BarChart3, exact: false },
  { href: "/app/reports", label: "月間", icon: CalendarDays, exact: false },
  { href: "/app/settings", label: "設定", icon: Settings, exact: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, firebaseReady, resendVerificationEmail } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!loading && firebaseReady && !user) {
      router.replace("/login");
    }
  }, [loading, firebaseReady, user, router]);

  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Firebase の設定が必要です
          </h1>
          <p className="text-sm text-slate-600">
            認証機能とデータ保存を利用するには、<code className="bg-slate-100 px-1.5 py-0.5 rounded">.env.local</code> に Firebase の環境変数を設定してください。
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-slate-700 underline underline-offset-4"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">読み込み中...</p>
      </div>
    );
  }

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      await resendVerificationEmail();
      setResendMessage("確認メールを再送信しました。メールボックスをご確認ください。");
    } catch {
      setResendMessage("送信に失敗しました。しばらく経ってから再度お試しください。");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* PC・タブレット共通ヘッダー */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/app"
            className="text-base font-semibold tracking-tight text-slate-900"
          >
            本当の自分
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/app/settings"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="設定"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* メールアドレス未確認の案内バナー */}
      {!user.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <MailCheck className="w-4 h-4 shrink-0" />
              <span>
                メールアドレスの確認が完了していません。登録時のメール内のリンクを開いてください。
              </span>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="self-start sm:self-auto shrink-0 font-medium underline underline-offset-2 hover:text-amber-950 disabled:opacity-50"
            >
              {resending ? "送信中..." : "確認メールを再送する"}
            </button>
          </div>
          {resendMessage && (
            <p className="max-w-4xl mx-auto mt-1 text-xs text-amber-800">
              {resendMessage}
            </p>
          )}
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* モバイル用ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
