"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api-client";
import type { UsageSummary, UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  usage: UsageSummary | null;
  loading: boolean;
  firebaseReady: boolean;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  usage: null,
  loading: true,
  firebaseReady: false,
  refreshProfile: async () => {},
  resendVerificationEmail: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseReady = isFirebaseClientConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(firebaseReady);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch<{
        profile: UserProfile;
        usage: UsageSummary;
      }>("/api/account/profile");
      setProfile(data.profile);
      setUsage(data.usage);
    } catch {
      // サーバー側環境変数未設定時などでも認証画面自体は壊れないようにする
    }
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile();
      } else {
        setProfile(null);
        setUsage(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseReady, fetchProfile]);

  const resendVerificationEmail = useCallback(async () => {
    if (!user) return;
    await sendEmailVerification(user);
  }, [user]);

  const logout = useCallback(async () => {
    if (!firebaseReady) return;
    await signOut(getFirebaseAuth());
    setProfile(null);
    setUsage(null);
  }, [firebaseReady]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        usage,
        loading,
        firebaseReady,
        refreshProfile: fetchProfile,
        resendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
