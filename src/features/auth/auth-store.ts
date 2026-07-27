"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens, AuthUser } from "./auth-types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (tokens: AuthTokens, user?: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
}

/**
 * Tokens live in a persisted store so the SPA can attach the bearer and
 * silently refresh. A non-httpOnly cookie mirror (see setAuthCookie) lets the
 * Next middleware gate protected routes. For maximum hardening you can move to
 * httpOnly cookies via Route Handlers later — the api-client is the only place
 * that reads tokens, so that change stays localised.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: (tokens, user) => {
        setAuthCookie(true);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user ?? null,
          isAuthenticated: true,
        });
      },
      setTokens: (tokens) => {
        setAuthCookie(true);
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        setAuthCookie(false);
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      },
    }),
    { name: "summy.auth" }
  )
);

function setAuthCookie(present: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = present
    ? `summy_auth=1; path=/; max-age=2592000; samesite=lax`
    : `summy_auth=; path=/; max-age=0; samesite=lax`;
}
