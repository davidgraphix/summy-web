"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth-store";
import { LoadingState } from "@/components/shared/states";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  // Wait for the persisted session to finish loading from localStorage before
  // deciding the user is logged out — otherwise a hard refresh always sees one
  // frame of the store's default (logged-out) state and bounces an
  // actually-authenticated user to /login.
  useEffect(() => {
    if (hasHydrated && !isAuth) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [hasHydrated, isAuth, pathname, router]);

  if (!hasHydrated || !isAuth) return <LoadingState label="Checking your session…" />;
  return <>{children}</>;
}