import {
  BarChart3, Boxes, Building2, FileClock, Gauge, Image, Layers, Mail, Package,
  Receipt, Settings, ShieldCheck, ShoppingCart, Tag, Trash2, Users, Wallet,
} from "lucide-react";
import { PERMISSIONS, type PermissionKey } from "./permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Gauge;
  permission?: PermissionKey;
  /** Match nested routes (e.g. /admin/orders/123). */
  exact?: boolean;
}
export interface NavSection { title: string; items: NavItem[] }

/** Single source of truth for sidebar, mobile nav, breadcrumbs and command search. */
export const ADMIN_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: Gauge, permission: PERMISSIONS.reportsView, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: PERMISSIONS.reportsView },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: PERMISSIONS.ordersView },
      { href: "/admin/payments", label: "Payments", icon: Wallet, permission: PERMISSIONS.paymentsView },
      { href: "/admin/refunds", label: "Refunds", icon: Receipt, permission: PERMISSIONS.paymentsRefund },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: PERMISSIONS.customersView },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, permission: PERMISSIONS.productsView },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: PERMISSIONS.productsManageInventory },
      { href: "/admin/categories", label: "Categories", icon: Layers, permission: PERMISSIONS.categoriesUpdate },
      { href: "/admin/brands", label: "Brands", icon: Tag, permission: PERMISSIONS.brandsUpdate },
      { href: "/admin/media", label: "Media", icon: Image, permission: PERMISSIONS.mediaView },
      { href: "/admin/trash", label: "Restore", icon: Trash2, permission: PERMISSIONS.productsView },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/users", label: "Team", icon: Users, permission: PERMISSIONS.usersView },
      { href: "/admin/roles", label: "Roles", icon: ShieldCheck, permission: PERMISSIONS.rolesView },
      { href: "/admin/emails", label: "Email logs", icon: Mail, permission: PERMISSIONS.settingsView },
      { href: "/admin/audit-logs", label: "Audit logs", icon: FileClock, permission: PERMISSIONS.auditLogsView },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: PERMISSIONS.settingsView },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = ADMIN_NAV.flatMap((s) => s.items);

/** Human-readable label for a path segment, used for breadcrumbs. */
export function labelForPath(path: string): string {
  const item = ALL_NAV_ITEMS.find((i) => i.href === path);
  if (item) return item.label;
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export { Building2 };
