"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseClientConfigured()) {
      setError("Firebaseの環境変数が未設定のためログインできません。");
      return;
    }

    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/app");
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません。");
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
              width={52}
              height={52}
              className="rounded-2xl shadow-xs"
            />
            <span>ほんね。</span>
          </Link>
          <p className="text-sm text-slate-600 mt-2">
            ここでは、本当のことを書いていい。
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="text-lg font-semibold text-slate-900 mb-6">
            ログイン
          </h1>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
              {error}
            </div>
          )}

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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700"
                >
                  パスワード
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  パスワードを忘れた方
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? "ログイン中..." : "ログインする"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600 space-y-2">
            <p>
              初めてご利用の方は{" "}
              <Link
                href="/signup"
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                新規会員登録
              </Link>
            </p>
            <p>
              <Link
                href="/try"
                className="text-slate-500 hover:text-slate-800 underline underline-offset-4"
              >
                登録不要で無料体験してみる
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
