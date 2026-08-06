import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type {
  Brand, Category, Invoice, Order, OrderPaymentMethod, OrderPaymentStatus, OrderStatus,
  OrderSummary, OrderTimelineEntry, Payment, PaymentTransactionStatus, Receipt, RefundStatus,
} from "@/types/models";
import type * as T from "./admin-types";
import type { ProductSortBy } from "@/features/products/products-api";

/** Shared list-query shape for simple admin tables (server pagination + search). */
export interface AdminListQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

export interface AdminOrderQuery {
  search?: string;
  customerId?: string;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  paymentMethod?: OrderPaymentMethod;
  placedFrom?: string;
  placedTo?: string;
  /** Kobo. */
  minTotal?: number;
  /** Kobo. */
  maxTotal?: number;
  assignedStaffId?: string;
  oldestFirst?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminPaymentQuery {
  search?: string;
  customerId?: string;
  status?: PaymentTransactionStatus;
  provider?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface RefundQuery {
  status?: RefundStatus;
  pageNumber?: number;
  pageSize?: number;
}

export interface ProductSearchQuery {
  search?: string;
  categoryId?: string;
  includeSubcategories?: boolean;
  brandId?: string;
  /** Kobo. */
  minPrice?: number;
  /** Kobo. */
  maxPrice?: number;
  inStockOnly?: boolean;
  featured?: boolean;
  tags?: string[];
  sortBy?: ProductSortBy;
  pageNumber?: number;
  pageSize?: number;
}

/* ------------------------------- Dashboard ------------------------------ */
export const adminDashboardApi = {
  overview: () => api.get<T.AdminDashboard>("/admin/dashboard"),
  sales: (q: T.DateRangeQuery = {}) => api.get<T.SalesAnalytics>("/admin/dashboard/analytics/sales", { params: q }),
  customers: (q: T.DateRangeQuery = {}) => api.get<T.CustomerAnalytics>("/admin/dashboard/analytics/customers", { params: q }),
  products: (q: T.DateRangeQuery = {}) => api.get<T.ProductAnalytics>("/admin/dashboard/analytics/products", { params: q }),
  payments: (q: T.DateRangeQuery = {}) => api.get<T.PaymentAnalytics>("/admin/dashboard/analytics/payments", { params: q }),
};

/* --------------------------------- Orders ------------------------------- */
export const adminOrdersApi = {
  list: (q: AdminOrderQuery = {}) => api.get<PagedResult<OrderSummary>>("/admin/orders", { params: q }),
  byId: (id: string) => api.get<Order>(`/admin/orders/${id}`),
  timeline: (id: string) => api.get<OrderTimelineEntry[]>(`/admin/orders/${id}/timeline`),
  updateStatus: (id: string, body: T.UpdateOrderStatusRequest) => api.put<Order>(`/admin/orders/${id}/status`, body),
  assign: (id: string, body: T.AssignOrderRequest) => api.patch<void>(`/admin/orders/${id}/assign`, body),
  addNote: (id: string, body: T.AddOrderNoteRequest) => api.post<import("@/types/models").OrderNote>(`/admin/orders/${id}/notes`, body),
  recordPayment: (id: string, body: T.RecordPaymentRequest) => api.post<Order>(`/admin/orders/${id}/payments`, body),
  cancel: (id: string, body: T.CancelOrderRequest) => api.post<void>(`/admin/orders/${id}/cancel`, body),
  invoice: (id: string) => api.get<Invoice>(`/admin/orders/${id}/invoice`),
  receipts: (id: string) => api.get<Receipt[]>(`/admin/orders/${id}/receipts`),
};

/* -------------------------------- Payments ------------------------------ */
export const adminPaymentsApi = {
  list: (q: AdminPaymentQuery = {}) => api.get<PagedResult<Payment>>("/admin/payments", { params: q }),
  byId: (id: string) => api.get<Payment>(`/admin/payments/${id}`),
  reverify: (id: string) => api.post<Payment>(`/admin/payments/${id}/reverify`),
  refunds: (q: RefundQuery = {}) => api.get<PagedResult<T.Refund>>("/admin/payments/refunds", { params: q }),
  createRefund: (body: T.CreateRefundRequest) => api.post<T.Refund>("/admin/payments/refunds", body),
  approveRefund: (id: string, body: T.ApproveRefundRequest) => api.post<T.Refund>(`/admin/payments/refunds/${id}/approve`, body),
  rejectRefund: (id: string, body: T.RejectRefundRequest) => api.post<T.Refund>(`/admin/payments/refunds/${id}/reject`, body),
};

/* ------------------------------- Customers ------------------------------ */
export const adminCustomersApi = {
  profile: (id: string) => api.get<import("@/types/models").CustomerProfile>(`/admin/customers/${id}/profile`),
  addresses: (id: string) => api.get<T.Address[]>(`/admin/customers/${id}/addresses`),
  activity: (id: string, pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<import("@/types/models").ActivityEntry>>(`/admin/customers/${id}/activity`, { params: { pageNumber, pageSize } }),
  dashboard: (id: string) => api.get<import("@/types/models").DashboardOverview>(`/admin/customers/${id}/dashboard`),
  // isActive/reason are query params — SetStatus takes no request body.
  setStatus: (id: string, isActive: boolean, reason?: string) =>
    api.patch<void>(`/admin/customers/${id}/status`, undefined, { params: { isActive, reason } }),
};

/* --------------------------------- Users -------------------------------- */
export const adminUsersApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AdminUser>>("/admin/users", { params: q }),
  byId: (id: string) => api.get<T.AdminUser>(`/admin/users/${id}`),
  create: (body: T.CreateUserRequest) => api.post<T.AdminUser>("/admin/users", body),
  update: (id: string, body: T.UpdateUserRequest) => api.put<T.AdminUser>(`/admin/users/${id}`, body),
  setRoles: (id: string, body: T.AssignRolesRequest) => api.put<T.AdminUser>(`/admin/users/${id}/roles`, body),
  // isActive is a query param — SetStatus takes no request body.
  setStatus: (id: string, isActive: boolean) =>
    api.patch<void>(`/admin/users/${id}/status`, undefined, { params: { isActive } }),
  resetPassword: (id: string, body: T.ResetAdminPasswordRequest) =>
    api.post<void>(`/admin/users/${id}/reset-password`, body),
};

/* --------------------------------- Roles -------------------------------- */
export const adminRolesApi = {
  list: () => api.get<T.Role[]>("/admin/roles"),
  byId: (id: string) => api.get<T.Role>(`/admin/roles/${id}`),
  matrix: () => api.get<T.PermissionMatrix>("/admin/roles/permission-matrix"),
  permissions: () => api.get<T.Permission[]>("/admin/roles/permissions"),
  create: (body: T.CreateRoleRequest) => api.post<T.Role>("/admin/roles", body),
  update: (id: string, body: T.UpdateRoleRequest) => api.put<T.Role>(`/admin/roles/${id}`, body),
  remove: (id: string) => api.delete<void>(`/admin/roles/${id}`),
};

/* -------------------------------- Settings ------------------------------ */
export const adminSettingsApi = {
  get: () => api.get<T.AdminSettings>("/admin/settings"),
  company: (body: T.CompanySettings) => api.put<T.AdminSettings>("/admin/settings/company", body),
  contact: (body: T.ContactSettings) => api.put<T.AdminSettings>("/admin/settings/contact", body),
  social: (body: T.SocialSettings) => api.put<T.AdminSettings>("/admin/settings/social", body),
  seo: (body: T.SeoSettings) => api.put<T.AdminSettings>("/admin/settings/seo", body),
  maintenance: (body: T.MaintenanceSettings) => api.put<T.AdminSettings>("/admin/settings/maintenance", body),
};

/* ------------------------------- Email logs ----------------------------- */
export const adminEmailsApi = {
  logs: (q: T.EmailLogQuery = {}) => api.get<PagedResult<T.EmailLog>>("/admin/emails/logs", { params: q }),
  log: (id: string) => api.get<T.EmailLog>(`/admin/emails/logs/${id}`),
  /** Processes every email currently due for retry; returns the count retried. No targeted retry-by-id exists. */
  retry: () => api.post<number>("/admin/emails/retry"),
  test: (body: T.TestEmailRequest) => api.post<void>("/admin/emails/test", body),
};

/* ------------------------------- Audit logs ----------------------------- */
export const adminAuditApi = {
  list: (q: T.AuditLogQuery = {}) => api.get<PagedResult<T.AuditLogEntry>>("/admin/audit-logs", { params: q }),
  byActor: (actorId: string, q: AdminListQuery = {}) =>
    api.get<PagedResult<T.AuditLogEntry>>(`/admin/audit-logs/actors/${actorId}`, { params: q }),
};

/* ----------------------------- Bulk catalog ----------------------------- */
export const adminCatalogApi = {
  /** JSON row-based import (not a file upload) — see ProductImportRequest. */
  importProducts: (body: T.ProductImportRequest) =>
    api.post<T.ProductImportResult>("/admin/catalog/products/import", body),
  /** Export returns a CSV file, not an envelope — path is used to build a link. */
  exportProductsPath: "/admin/catalog/products/export",
  deletedProducts: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<import("@/types/models").ProductSummary>>("/admin/catalog/products/deleted", { params: { pageNumber, pageSize } }),
  restoreProduct: (id: string) => api.post<void>(`/admin/catalog/products/${id}/restore`),
  deletedCategories: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<Category>>("/admin/catalog/categories/deleted", { params: { pageNumber, pageSize } }),
  restoreCategory: (id: string) => api.post<void>(`/admin/catalog/categories/${id}/restore`),
};

/* -------------------------- Products (write side) ----------------------- */
export const adminProductsApi = {
  // This admin search endpoint is unexpectedly hard-scoped to Published products
  // server-side (see ProductsController.Search) despite the permission gate and
  // XML doc implying full-status access — drafts/archived won't appear here.
  list: (q: ProductSearchQuery = {}) => api.get<PagedResult<import("@/types/models").ProductSummary>>("/products", { params: q }),
  byId: (id: string) => api.get<import("@/types/models").Product>(`/products/${id}`),
  bySlug: (slug: string) => api.get<import("@/types/models").Product>(`/products/slug/${encodeURIComponent(slug)}`),
  create: (body: T.ProductRequest) => api.post<import("@/types/models").Product>("/products", body),
  update: (id: string, body: T.ProductRequest) => api.put<import("@/types/models").Product>(`/products/${id}`, body),
  remove: (id: string) => api.delete<void>(`/products/${id}`),
  publish: (id: string) => api.post<void>(`/products/${id}/publish`),
  unpublish: (id: string) => api.post<void>(`/products/${id}/unpublish`),
  setFeatured: (id: string, isFeatured: boolean) =>
    api.patch<void>(`/products/${id}/featured`, undefined, { params: { isFeatured } }),
};

/* -------------------------------- Inventory ----------------------------- */
export const adminInventoryApi = {
  forProduct: (id: string) => api.get<T.InventoryRecord>(`/inventory/products/${id}`),
  setStock: (id: string, body: T.SetStockRequest) => api.put<T.InventoryRecord>(`/inventory/products/${id}/stock`, body),
  adjust: (id: string, body: T.AdjustStockRequest) => api.post<T.InventoryRecord>(`/inventory/products/${id}/adjust`, body),
  thresholds: (id: string, body: T.ThresholdsRequest) => api.put<T.InventoryRecord>(`/inventory/products/${id}/thresholds`, body),
  reserve: (id: string, quantity: number, referenceId?: string) =>
    api.post<T.InventoryRecord>(`/inventory/products/${id}/reserve`, undefined, { params: { quantity, referenceId } }),
  release: (id: string, quantity: number, referenceId?: string) =>
    api.post<T.InventoryRecord>(`/inventory/products/${id}/release`, undefined, { params: { quantity, referenceId } }),
  lowStock: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<import("@/types/models").ProductSummary>>("/inventory/low-stock", { params: { pageNumber, pageSize } }),
  history: (id: string, pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<T.StockMovement>>(`/inventory/products/${id}/history`, { params: { pageNumber, pageSize } }),
};

/* ------------------------- Categories (write side) ---------------------- */
export const adminCategoriesApi = {
  list: (includeInactive = false) => api.get<Category[]>("/categories", { params: { includeInactive } }),
  byId: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (body: T.CategoryRequest) => api.post<Category>("/categories", body),
  update: (id: string, body: T.CategoryRequest) => api.put<Category>(`/categories/${id}`, body),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
  // isActive is a query param — SetStatus takes no request body.
  setStatus: (id: string, isActive: boolean) =>
    api.patch<void>(`/categories/${id}/status`, undefined, { params: { isActive } }),
};

/* --------------------------- Brands (write side) ------------------------ */
export const adminBrandsApi = {
  list: () => api.get<Brand[]>("/brands"),
  byId: (id: string) => api.get<Brand>(`/brands/${id}`),
  create: (body: T.BrandRequest) => api.post<Brand>("/brands", body),
  update: (id: string, body: T.BrandRequest) => api.put<Brand>(`/brands/${id}`, body),
  remove: (id: string) => api.delete<void>(`/brands/${id}`),
  // isActive is a query param — SetStatus takes no request body.
  setStatus: (id: string, isActive: boolean) =>
    api.patch<void>(`/brands/${id}/status`, undefined, { params: { isActive } }),
};

/* ---------------------------------- Media -------------------------------- */
export const adminMediaApi = {
  images: (productId: string) => api.get<T.ProductImage[]>(`/media/products/${productId}/images`),
  upload: (productId: string, file: File, altText?: string, caption?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (altText) fd.append("altText", altText);
    if (caption) fd.append("caption", caption);
    return api.postForm<T.ProductImage>(`/media/products/${productId}/images`, fd);
  },
  uploadBulk: (productId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return api.postForm<T.ProductImage[]>(`/media/products/${productId}/images/bulk`, fd);
  },
  /** Replaces the binary behind an existing slot, preserving order/featured state. */
  replace: (productId: string, imageId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.postForm<T.ProductImage>(`/media/products/${productId}/images/${imageId}`, fd);
  },
  setDescription: (productId: string, imageId: string, body: T.UpdateImageDescriptionRequest) =>
    api.patch<T.ProductImage>(`/media/products/${productId}/images/${imageId}/description`, body),
  setFeatured: (productId: string, imageId: string) =>
    api.patch<void>(`/media/products/${productId}/images/${imageId}/featured`),
  reorder: (productId: string, body: T.ReorderImagesRequest) =>
    api.put<void>(`/media/products/${productId}/images/order`, body),
  remove: (productId: string, imageId: string) =>
    api.delete<void>(`/media/products/${productId}/images/${imageId}`),
  /** Bulk-deletes specific images — there is no "delete all" endpoint. */
  removeMany: (productId: string, body: T.DeleteImagesRequest) =>
    api.delete<void>(`/media/products/${productId}/images`, { body }),
};
