"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticationResponse, AuthUser } from "./auth-types";

const STORAGE_KEY = "summy.auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * True once zustand has finished reading the persisted session from
   * localStorage. Consumers (AuthGuard/AdminGuard) MUST wait for this before
   * treating `isAuthenticated: false` as "not logged in" — otherwise a hard
   * refresh always renders one frame of the store's default (logged-out)
   * state and can redirect an actually-authenticated user to /login.
   */
  hasHydrated: boolean;
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
      hasHydrated: false,
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
    {
      name: STORAGE_KEY,
      // zustand's automatic hydrate-on-store-creation call is unreliable in
      // this app: `persist.hasHydrated()` (zustand's own internal flag, not
      // just ours) was confirmed via direct testing to stay false forever on
      // a real proportion of loads, while a manually-triggered
      // `persist.rehydrate()` call completes correctly within milliseconds
      // every time. This is a known zustand + Next.js "use client" module
      // gotcha (the store module can be evaluated once during the
      // server-render pass, where there is no localStorage, before the real
      // client instance ever gets a chance to run its own hydrate() call).
      // skipHydration + an explicit rehydrate() from a client-only mount
      // effect (see app/providers.tsx) is zustand's own documented fix for
      // this — not a timeout or a workaround.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    }
  )
);

// Keep every open tab in sync with whichever tab last wrote a session. Without
// this, a tab that refreshes its access token can have its brand-new refresh
// token invalidated moments later by a sibling tab that still holds the
// now-stale token in memory and tries to use it (the backend revokes ALL
// active refresh tokens on reuse detection — correct anti-theft behaviour,
// but it means stale in-memory tokens in other tabs must never be replayed).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<AuthState> };
      if (!parsed.state) return;
      useAuthStore.setState({
        accessToken: parsed.state.accessToken ?? null,
        refreshToken: parsed.state.refreshToken ?? null,
        user: parsed.state.user ?? null,
        isAuthenticated: parsed.state.isAuthenticated ?? false,
      });
    } catch {
      // Malformed storage payload — ignore, keep this tab's current state.
    }
  });
}

function setAuthCookie(present: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = present
    ? `summy_auth=1; path=/; max-age=2592000; samesite=lax`
    : `summy_auth=; path=/; max-age=0; samesite=lax`;
}
