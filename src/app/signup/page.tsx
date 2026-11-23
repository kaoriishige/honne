"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています。";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません。";
    case "auth/weak-password":
      return "パスワードは8文字以上で設定してください。";
    default:
      return "登録に失敗しました。入力内容を確認して再度お試しください。";
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFirebaseClientConfigured()) {
      setError("Firebaseの環境変数が未設定のため登録できません。");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    if (!agreed) {
      setError("利用規約とプライバシーポリシーへの同意が必要です。");
      return;
    }

    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      // メールアドレス確認メールを送信
      await sendEmailVerification(credential.user);
      router.replace("/app");
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      setError(mapFirebaseAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            本当の自分
          </Link>
          <p className="text-sm text-slate-600 mt-2">
            あなただけの非公開スペースを作成します
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="text-lg font-semibold text-slate-900 mb-6">
            新規会員登録
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
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                パスワード（8文字以上）
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                パスワード（確認用）
              </label>
              <input
                id="passwordConfirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                <Link
                  href="/terms"
                  className="text-slate-900 underline underline-offset-2"
                >
                  利用規約
                </Link>
                および
                <Link
                  href="/privacy"
                  className="text-slate-900 underline underline-offset-2"
                >
                  プライバシーポリシー
                </Link>
                （AIサービスへのデータ送信に関する説明を含む）に同意します。
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? "作成中..." : "アカウントを作成する"}
            </button>
          </form>

          {/* 将来Googleログインを追加する場合はここにプロバイダボタンを配置 */}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/login"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
