"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/auth-store";
import { claimAsStringArray, decodeJwtPayload } from "@/lib/jwt";

/**
 * The canonical permission catalogue. Mirrors Summy.Shared.Constants.Permissions
 * exactly (resource.action, lower-case, dot-separated) — that class is the
 * single source of truth the backend seeds from and enforces against.
 */
export const PERMISSIONS = {
  usersView: "users.view",
  usersCreate: "users.create",
  usersUpdate: "users.update",
  usersDelete: "users.delete",
  usersManageStatus: "users.manage_status",

  rolesView: "roles.view",
  rolesCreate: "roles.create",
  rolesUpdate: "roles.update",
  rolesDelete: "roles.delete",
  rolesAssign: "roles.assign",

  permissionsView: "permissions.view",
  permissionsAssign: "permissions.assign",

  productsView: "products.view",
  productsCreate: "products.create",
  productsUpdate: "products.update",
  productsDelete: "products.delete",
  productsManageInventory: "products.manage_inventory",

  categoriesView: "categories.view",
  categoriesCreate: "categories.create",
  categoriesUpdate: "categories.update",
  categoriesDelete: "categories.delete",

  brandsView: "brands.view",
  brandsCreate: "brands.create",
  brandsUpdate: "brands.update",
  brandsDelete: "brands.delete",

  ordersView: "orders.view",
  ordersUpdate: "orders.update",
  ordersCancel: "orders.cancel",
  ordersRefund: "orders.refund",

  paymentsView: "payments.view",
  paymentsRefund: "payments.refund",

  customersView: "customers.view",
  customersUpdate: "customers.update",

  mediaView: "media.view",
  mediaUpload: "media.upload",
  mediaDelete: "media.delete",

  reportsView: "reports.view",
  reportsExport: "reports.export",

  analyticsView: "analytics.view",
  analyticsExport: "analytics.export",

  auditLogsView: "audit_logs.view",

  settingsView: "settings.view",
  settingsManage: "settings.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Reads the caller's granted permissions and roles. Roles come straight off
 * UserDto (present on every login/refresh response); permissions are not part
 * of that DTO — the backend only bakes them into the access token's
 * `permission` claims (see AppClaimTypes.Permission / JwtTokenService), so
 * they're read from there. This is a UX gate only: every endpoint is
 * independently authorized server-side via the same claim.
 */
export function useAdminPrincipal() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const permissions = useMemo(() => {
    if (!accessToken) return [];
    return claimAsStringArray(decodeJwtPayload(accessToken), "permission");
  }, [accessToken]);

  const roles = useMemo(() => (user?.roles ?? []).map((r) => r.toLowerCase()), [user]);
  const isStaff = !!user && user.userType !== "Customer";

  return { roles, permissions, isStaff, isLoading: false, hasPrincipal: !!user };
}

/**
 * Gate for a single permission — a plain claim lookup, matching
 * PermissionAuthorizationHandler server-side exactly (no role-name bypass:
 * the backend has none either).
 */
export function useHasPermission(permission?: PermissionKey): boolean {
  const { isStaff, permissions } = useAdminPrincipal();
  if (!permission) return isStaff;
  return permissions.includes(permission);
}
