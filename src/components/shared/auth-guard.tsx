"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth-store";
import { LoadingState } from "@/components/shared/states";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuth) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isAuth, pathname, router]);

  if (!isAuth) return <LoadingState label="Checking your session…" />;
  return <>{children}</>;
}