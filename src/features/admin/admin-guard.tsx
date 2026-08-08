"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/states";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAdminPrincipal, useHasPermission, type PermissionKey } from "./permissions";

/**
 * Route-level protection for /admin. Requires an authenticated session plus a
 * staff role. This is a UX gate — the API independently authorizes every call.
 */
export function AdminGuard({ children, permission }: { children: React.ReactNode; permission?: PermissionKey }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const { isLoading, hasPrincipal, isStaff } = useAdminPrincipal();
  const allowed = useHasPermission(permission);
  const router = useRouter();
  const pathname = usePathname();

  // Same hydration race as AuthGuard: a typed/bookmarked navigation to /admin
  // is a full page load, so the store starts cold and only becomes
  // authenticated once persist finishes reading localStorage. Redirecting
  // before that finishes is what forces a second login.
  useEffect(() => {
    if (hasHydrated && !isAuth) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [hasHydrated, isAuth, pathname, router]);

  if (!hasHydrated || !isAuth) return <LoadingState label="Checking your session…" />;
  if (isLoading || !hasPrincipal) return <LoadingState label="Verifying access…" />;

  if (!isStaff || !allowed) return <AccessDenied />;
  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">You don&apos;t have access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn&apos;t have permission to view this area. If you think that&apos;s a
          mistake, ask an administrator to review your role.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>Go to your account</Link>
          <Link href="/" className={buttonVariants()}>Back to shop</Link>
        </div>
      </div>
    </div>
  );
}

/** Inline permission gate for individual actions/buttons. */
export function Can({ permission, children, fallback = null }: {
  permission: PermissionKey; children: React.ReactNode; fallback?: React.ReactNode;
}) {
  return useHasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
