"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { Download, LogOut, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPlanConfig } from "@/config/plans";
import { apiFetch } from "@/lib/api-client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { StripeSubscriptionPanel } from "@/components/billing/StripeSubscriptionPanel";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, usage, logout } = useAuth();
  const planConfig = getPlanConfig(profile?.plan);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailErr(null);
    if (!user || !user.email) return;

    try {
      const cred = EmailAuthProvider.credential(user.email, emailPassword);
      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setEmailMsg(
        "新しいメールアドレス宛に確認メールを送信しました。リンクを開くと変更が完了します。"
      );
      setNewEmail("");
      setEmailPassword("");
    } catch {
      setEmailErr(
        "変更に失敗しました。現在のパスワードや入力メールアドレスをご確認ください。"
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (!user || !user.email) return;

    if (newPw.length < 8) {
      setPwErr("新しいパスワードは8文字以上で入力してください。");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg("パスワードを変更しました。");
      setCurrentPw("");
      setNewPw("");
    } catch {
      setPwErr("パスワードの変更に失敗しました。現在のパスワードをご確認ください。");
    }
  };

  const handleExport = async () => {
    setActionErr(null);
    setActionMsg(null);
    setBusy(true);
    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) throw new Error("ログインが必要です。");
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("エクスポートに失敗しました。");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hontouno-jibun-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActionMsg("記録データをエクスポートしました。");
    } catch (err) {
      setActionErr(
        err instanceof Error ? err.message : "エクスポートに失敗しました。"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDataOnly = async () => {
    if (
      !window.confirm(
        "保存されている本音の記録・AI対話・分析・月間レポートをすべて削除します。元に戻せません。よろしいですか？"
      )
    ) {
      return;
    }
    setBusy(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      await apiFetch("/api/account/delete", {
        method: "POST",
        body: JSON.stringify({ mode: "data_only" }),
      });
      setActionMsg("保存データをすべて削除しました。");
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "アカウントおよびすべての保存データを完全に削除します。この操作は取り消せません。本当に削除しますか？"
      )
    ) {
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      await apiFetch("/api/account/delete", {
        method: "POST",
        body: JSON.stringify({ mode: "account" }),
      });
      await logout();
      router.replace("/");
    } catch (err) {
      setActionErr(
        err instanceof Error ? err.message : "アカウント削除に失敗しました。"
      );
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          マイページ・設定
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ログイン中：{user?.email}
        </p>
      </div>

      {/* 契約プラン・サブスクリプション管理（Stripe） */}
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-500">
            契約情報を読み込み中...
          </div>
        }
      >
        <StripeSubscriptionPanel />
      </Suspense>

      {/* 今月のAI利用状況 */}
      {usage && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            今月（{usage.period}）のAI利用状況
          </h2>
          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3.5 space-y-1">
            <p>
              AIコーチング対話：{usage.aiChatCount} /{" "}
              {planConfig.limits.monthlyAiChatLimit} 回
            </p>
            <p>
              AI感情分析：{usage.aiAnalysisCount} /{" "}
              {planConfig.limits.monthlyAnalysisLimit} 回
            </p>
          </div>
        </section>
      )}

      {/* メールアドレス変更 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          メールアドレス変更
        </h2>
        {emailMsg && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {emailMsg}
          </p>
        )}
        {emailErr && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {emailErr}
          </p>
        )}
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="新しいメールアドレス"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <input
            type="password"
            required
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="確認のため現在のパスワードを入力"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium"
          >
            変更確認メールを送信
          </button>
        </form>
      </section>

      {/* パスワード変更 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          パスワード変更
        </h2>
        {pwMsg && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {pwMsg}
          </p>
        )}
        {pwErr && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {pwErr}
          </p>
        )}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            required
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="現在のパスワード"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="新しいパスワード（8文字以上）"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium"
          >
            パスワードを変更する
          </button>
        </form>
      </section>

      {/* データ管理 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">データ管理</h2>
        {actionMsg && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {actionMsg}
          </p>
        )}
        {actionErr && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {actionErr}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            記録をエクスポート（JSON）
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleDeleteDataOnly}
            className="inline-flex items-center gap-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            保存データをすべて削除
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            アカウントを完全に削除する
          </button>
        </div>
      </section>

      {/* 規約・ログアウト */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-5 text-xs text-slate-600">
          <Link href="/privacy" className="hover:text-slate-900 underline underline-offset-4">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="hover:text-slate-900 underline underline-offset-4">
            利用規約
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
      </section>
    </div>
  );
}
