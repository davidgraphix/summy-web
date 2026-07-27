"use client";

import { useAuthStore } from "@/features/auth/auth-store";
import { useProfile } from "@/features/customer/customer-hooks";

/**
 * Permission keys used by the UI to show/hide actions. These mirror the
 * conventional `resource.action` shape returned by GET /admin/roles/permissions.
 * TODO: reconcile these strings with the backend's actual permission keys —
 * they're referenced from one place (this file) so renaming is cheap.
 */
export const PERMISSIONS = {
  dashboardView: "dashboard.view",
  ordersView: "orders.view",
  ordersManage: "orders.manage",
  paymentsView: "payments.view",
  paymentsManage: "payments.manage",
  refundsManage: "refunds.manage",
  productsView: "products.view",
  productsManage: "products.manage",
  inventoryManage: "inventory.manage",
  categoriesManage: "categories.manage",
  brandsManage: "brands.manage",
  mediaManage: "media.manage",
  customersView: "customers.view",
  customersManage: "customers.manage",
  usersView: "users.view",
  usersManage: "users.manage",
  rolesManage: "roles.manage",
  settingsManage: "settings.manage",
  emailsView: "emails.view",
  auditView: "audit.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Role names treated as unrestricted. TODO: confirm against backend seed data. */
const SUPER_ROLES = ["admin", "administrator", "superadmin", "super admin", "owner"];

interface PrincipalLike {
  roles?: unknown;
  roleNames?: unknown;
  permissions?: unknown;
  [key: string]: unknown;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

/**
 * Reads roles/permissions off whichever principal object the backend returns.
 * The auth user and the /customers/me profile are both checked because the
 * contract doesn't specify which one carries role data.
 */
export function useAdminPrincipal() {
  const user = useAuthStore((s) => s.user) as PrincipalLike | null;
  const { data: profile, isLoading } = useProfile();
  const p = (profile ?? null) as PrincipalLike | null;

  const roles = [
    ...toStringArray(user?.roles), ...toStringArray(user?.roleNames),
    ...toStringArray(p?.roles), ...toStringArray(p?.roleNames),
  ].map((r) => r.toLowerCase());

  const permissions = [...toStringArray(user?.permissions), ...toStringArray(p?.permissions)];

  const isSuperAdmin = roles.some((r) => SUPER_ROLES.includes(r));
  // Any role at all beyond a plain customer implies staff access.
  const isStaff = isSuperAdmin || permissions.length > 0 || roles.some((r) => r !== "customer" && r !== "user");

  return { roles, permissions, isSuperAdmin, isStaff, isLoading, hasPrincipal: !!(user || profile) };
}

/**
 * Gate for a single permission. Super admins pass everything. If the backend
 * supplies no permission list at all, staff are allowed through rather than
 * locked out of their own dashboard — the API still enforces the real rules on
 * every request, so a false positive here shows a button that fails server-side
 * rather than granting actual access.
 */



export function useHasPermission(permission?: PermissionKey): boolean {
  const { isSuperAdmin, isStaff, permissions } = useAdminPrincipal();
  if (!permission) return isStaff;
  if (isSuperAdmin) return true;
  if (permissions.length === 0) return isStaff;
  return permissions.includes(permission);
}
