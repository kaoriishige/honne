"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

interface GoogleAuthButtonProps {
  mode: "signup" | "login";
  disabled?: boolean;
  onBeforeAuth?: () => string | null;
  onError: (message: string | null) => void;
}

function mapGoogleAuthError(code: string): string | null {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "ブラウザでポップアップがブロックされました。ポップアップを許可して再度お試しください。";
    case "auth/operation-not-allowed":
      return "Firebase コンソールで Google ログインが有効化されていません。";
    case "auth/unauthorized-domain":
      return "このドメインは Firebase の承認済みドメインに登録されていません。";
    default:
      return "Google 認証に失敗しました。時間をおいて再度お試しください。";
  }
}

export function GoogleAuthButton({
  mode,
  disabled = false,
  onBeforeAuth,
  onError,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    onError(null);

    if (!isFirebaseClientConfigured()) {
      onError("Firebase の環境変数が未設定のため利用できません。");
      return;
    }

    if (onBeforeAuth) {
      const validationError = onBeforeAuth();
      if (validationError) {
        onError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.replace("/app");
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      const message = mapGoogleAuthError(code);
      if (message) onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
        />
      </svg>
      <span>
        {loading
          ? "認証中..."
          : mode === "signup"
          ? "Google で登録する"
          : "Google でログインする"}
      </span>
    </button>
  );
}
