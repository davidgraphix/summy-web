"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticationResponse, AuthUser } from "./auth-types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (session: AuthenticationResponse) => void;
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
      setSession: (session) => {
        setAuthCookie(true);
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          isAuthenticated: true,
        });
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
