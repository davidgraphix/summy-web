import type { ProductQuery } from "@/features/products/products-api";
import type { AdminListQuery } from "@/features/admin/admin-api";

/** Query-key builders don't care about the exact query shape — just that it's part of the key. */
type AnyQuery = object;

/** Central registry of TanStack Query keys for consistent invalidation. */
export const qk = {
  products: {
    all: ["products"] as const,
    list: (q: ProductQuery) => ["products", "list", q] as const,
    /** Storefront infinite scroll. `q` carries the filters only — the page
     *  number is the pageParam, so it must stay out of the key. */
    infinite: (q: ProductQuery) => ["products", "infinite", q] as const,
    featured: ["products", "featured"] as const,
    bySlug: (slug: string) => ["products", "slug", slug] as const,
  },
  categories: { all: ["categories"] as const, tree: ["categories", "tree"] as const },
  brands: { all: ["brands"] as const },
  settings: ["storefront", "settings"] as const,
  cart: { root: ["cart"] as const, summary: ["cart", "summary"] as const },
  wishlist: ["wishlist"] as const,
  orders: {
    all: ["orders"] as const,
    list: (page: number) => ["orders", "list", page] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    timeline: (id: string) => ["orders", "timeline", id] as const,
  },
  payments: { all: ["payments"] as const, byOrder: (id: string) => ["payments", "order", id] as const },
  customer: {
    me: ["customer", "me"] as const,
    dashboard: ["customer", "dashboard"] as const,
    activity: ["customer", "activity"] as const,
    addresses: ["customer", "addresses"] as const,
    referrals: ["customer", "referrals"] as const,
    referralSummary: ["customer", "referrals", "summary"] as const,
  },
  notifications: {
    list: ["notifications", "list"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  account: { sessions: ["account", "sessions"] as const, loginHistory: ["account", "login-history"] as const },

  /**
   * Admin namespace. Kept under a single "admin" root so the whole admin cache
   * can be invalidated at once, while each module still invalidates narrowly.
   * Storefront keys are deliberately separate — see invalidateStorefront().
   */
  admin: {
    root: ["admin"] as const,
    dashboard: ["admin", "dashboard"] as const,
    analytics: (kind: string, q: AnyQuery) => ["admin", "analytics", kind, q] as const,
    orders: {
      all: ["admin", "orders"] as const,
      list: (q: AnyQuery) => ["admin", "orders", "list", q] as const,
      detail: (id: string) => ["admin", "orders", "detail", id] as const,
      timeline: (id: string) => ["admin", "orders", "timeline", id] as const,
    },
    payments: {
      all: ["admin", "payments"] as const,
      list: (q: AnyQuery) => ["admin", "payments", "list", q] as const,
      detail: (id: string) => ["admin", "payments", "detail", id] as const,
      refunds: (q: AnyQuery) => ["admin", "payments", "refunds", q] as const,
    },
    customers: {
      all: ["admin", "customers"] as const,
      list: (q: AdminListQuery) => ["admin", "customers", "list", q] as const,
      profile: (id: string) => ["admin", "customers", "profile", id] as const,
      addresses: (id: string) => ["admin", "customers", "addresses", id] as const,
      activity: (id: string) => ["admin", "customers", "activity", id] as const,
      dashboard: (id: string) => ["admin", "customers", "dashboard", id] as const,
    },
    users: {
      all: ["admin", "users"] as const,
      list: (q: AdminListQuery) => ["admin", "users", "list", q] as const,
      detail: (id: string) => ["admin", "users", "detail", id] as const,
    },
    roles: {
      all: ["admin", "roles"] as const,
      detail: (id: string) => ["admin", "roles", "detail", id] as const,
      matrix: ["admin", "roles", "matrix"] as const,
      permissions: ["admin", "roles", "permissions"] as const,
    },
    settings: ["admin", "settings"] as const,
    emails: {
      all: ["admin", "emails"] as const,
      list: (q: AnyQuery) => ["admin", "emails", "list", q] as const,
      detail: (id: string) => ["admin", "emails", "detail", id] as const,
    },
    audit: {
      all: ["admin", "audit"] as const,
      list: (q: AnyQuery) => ["admin", "audit", "list", q] as const,
      byActor: (actorId: string, q: AnyQuery) => ["admin", "audit", "actor", actorId, q] as const,
    },
    catalog: {
      deletedProducts: (q: AnyQuery) => ["admin", "catalog", "deleted-products", q] as const,
      deletedCategories: (q: AnyQuery) => ["admin", "catalog", "deleted-categories", q] as const,
    },
    products: {
      all: ["admin", "products"] as const,
      list: (q: AnyQuery) => ["admin", "products", "list", q] as const,
      detail: (id: string) => ["admin", "products", "detail", id] as const,
    },
    inventory: {
      all: ["admin", "inventory"] as const,
      lowStock: (q: AnyQuery) => ["admin", "inventory", "low-stock", q] as const,
      product: (id: string) => ["admin", "inventory", "product", id] as const,
      history: (id: string) => ["admin", "inventory", "history", id] as const,
    },
    media: { images: (productId: string) => ["admin", "media", productId] as const },
  },
};
