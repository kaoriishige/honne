"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseClientConfigured()) {
      setError("Firebaseの環境変数が未設定のため送信できません。");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setSent(true);
    } catch {
      // アカウント存在有無の推測を避けるため一般的な案内を返す
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex flex-col items-center gap-2.5 text-xl font-semibold text-slate-900"
          >
            <Image
              src="/images/app-icon.jpg"
              alt="ほんね。"
              width={48}
              height={48}
              className="rounded-2xl shadow-xs"
            />
            <span>ほんね。</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="text-lg font-semibold text-slate-900 mb-3">
            パスワードの再設定
          </h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          {sent ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-3">
              <p>
                入力されたメールアドレス宛に再設定用の案内を送信しました。メールが届かない場合は、迷惑メールフォルダや入力アドレスをご確認ください。
              </p>
              <Link
                href="/login"
                className="inline-block text-xs font-medium text-slate-900 underline underline-offset-4"
              >
                ログイン画面へ戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {submitting ? "送信中..." : "再設定メールを送信する"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 underline underline-offset-4"
            >
              ログイン画面へ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
