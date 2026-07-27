import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Category, Brand, Order, OrderTimelineEntry } from "@/types/models";
import type * as T from "./admin-types";

/** Shared list-query shape for admin tables (server pagination + filtering). */
export interface AdminListQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: string;
  from?: string;   // ISO date — TODO: confirm the backend's date filter param names
  to?: string;
  [key: string]: string | number | boolean | undefined;
}

/* ------------------------------- Dashboard ------------------------------ */
export const adminDashboardApi = {
  overview: () => api.get<T.AdminDashboard>("/admin/dashboard"),
  sales: (q: AdminListQuery = {}) => api.get<T.SalesAnalytics>("/admin/dashboard/analytics/sales", { params: q }),
  customers: (q: AdminListQuery = {}) => api.get<T.CustomerAnalytics>("/admin/dashboard/analytics/customers", { params: q }),
  products: (q: AdminListQuery = {}) => api.get<T.ProductAnalytics>("/admin/dashboard/analytics/products", { params: q }),
  payments: (q: AdminListQuery = {}) => api.get<T.PaymentAnalytics>("/admin/dashboard/analytics/payments", { params: q }),
};

/* --------------------------------- Orders ------------------------------- */
export const adminOrdersApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AdminOrder>>("/admin/orders", { params: q }),
  byId: (id: string) => api.get<T.AdminOrder>(`/admin/orders/${id}`),
  timeline: (id: string) => api.get<OrderTimelineEntry[]>(`/admin/orders/${id}/timeline`),
  updateStatus: (id: string, body: T.UpdateOrderStatusRequest) => api.put<Order>(`/admin/orders/${id}/status`, body),
  assign: (id: string, body: T.AssignOrderRequest) => api.patch<Order>(`/admin/orders/${id}/assign`, body),
  addNote: (id: string, body: T.AddOrderNoteRequest) => api.post<T.AdminOrderNote>(`/admin/orders/${id}/notes`, body),
  recordPayment: (id: string, body: T.RecordPaymentRequest) => api.post<unknown>(`/admin/orders/${id}/payments`, body),
  cancel: (id: string) => api.post<Order>(`/admin/orders/${id}/cancel`),
  invoice: (id: string) => api.get<unknown>(`/admin/orders/${id}/invoice`),
  receipts: (id: string) => api.get<unknown>(`/admin/orders/${id}/receipts`),
};

/* -------------------------------- Payments ------------------------------ */
export const adminPaymentsApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AdminPayment>>("/admin/payments", { params: q }),
  byId: (id: string) => api.get<T.AdminPayment>(`/admin/payments/${id}`),
  reverify: (id: string) => api.post<T.AdminPayment>(`/admin/payments/${id}/reverify`),
  refunds: (q: AdminListQuery = {}) => api.get<PagedResult<T.Refund>>("/admin/payments/refunds", { params: q }),
  createRefund: (body: T.CreateRefundRequest) => api.post<T.Refund>("/admin/payments/refunds", body),
  approveRefund: (id: string) => api.post<T.Refund>(`/admin/payments/refunds/${id}/approve`),
  rejectRefund: (id: string) => api.post<T.Refund>(`/admin/payments/refunds/${id}/reject`),
};

/* ------------------------------- Customers ------------------------------ */
export const adminCustomersApi = {
  profile: (id: string) => api.get<T.AdminCustomerSummary>(`/admin/customers/${id}/profile`),
  addresses: (id: string) => api.get<T.Address[]>(`/admin/customers/${id}/addresses`),
  activity: (id: string) => api.get<T.AdminCustomerActivity[]>(`/admin/customers/${id}/activity`),
  dashboard: (id: string) => api.get<T.AdminCustomerDashboard>(`/admin/customers/${id}/dashboard`),
  setStatus: (id: string, body: T.UpdateStatusRequest) =>
    api.patch<T.AdminCustomerSummary>(`/admin/customers/${id}/status`, body),
};

/* --------------------------------- Users -------------------------------- */
export const adminUsersApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AdminUser>>("/admin/users", { params: q }),
  byId: (id: string) => api.get<T.AdminUser>(`/admin/users/${id}`),
  create: (body: T.CreateUserRequest) => api.post<T.AdminUser>("/admin/users", body),
  update: (id: string, body: T.UpdateUserRequest) => api.put<T.AdminUser>(`/admin/users/${id}`, body),
  setRoles: (id: string, body: T.UpdateUserRolesRequest) => api.put<T.AdminUser>(`/admin/users/${id}/roles`, body),
  setStatus: (id: string, body: T.UpdateStatusRequest) => api.patch<T.AdminUser>(`/admin/users/${id}/status`, body),
  resetPassword: (id: string) => api.post<unknown>(`/admin/users/${id}/reset-password`),
};

/* --------------------------------- Roles -------------------------------- */
export const adminRolesApi = {
  list: () => api.get<T.Role[]>("/admin/roles"),
  byId: (id: string) => api.get<T.Role>(`/admin/roles/${id}`),
  matrix: () => api.get<T.PermissionMatrix>("/admin/roles/permission-matrix"),
  permissions: () => api.get<T.Permission[]>("/admin/roles/permissions"),
  create: (body: T.RoleRequest) => api.post<T.Role>("/admin/roles", body),
  update: (id: string, body: T.RoleRequest) => api.put<T.Role>(`/admin/roles/${id}`, body),
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
  logs: (q: AdminListQuery = {}) => api.get<PagedResult<T.EmailLog>>("/admin/emails/logs", { params: q }),
  log: (id: string) => api.get<T.EmailLog>(`/admin/emails/logs/${id}`),
  retry: (body: T.RetryEmailRequest) => api.post<unknown>("/admin/emails/retry", body),
  test: (body: T.TestEmailRequest) => api.post<unknown>("/admin/emails/test", body),
};

/* ------------------------------- Audit logs ----------------------------- */
export const adminAuditApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AuditLogEntry>>("/admin/audit-logs", { params: q }),
  byActor: (actorId: string, q: AdminListQuery = {}) =>
    api.get<PagedResult<T.AuditLogEntry>>(`/admin/audit-logs/actors/${actorId}`, { params: q }),
};

/* ----------------------------- Bulk catalog ----------------------------- */
export const adminCatalogApi = {
  importProducts: (file: File) => {
    const fd = new FormData();
    fd.append("file", file); // TODO: confirm multipart field name
    return api.postForm<unknown>("/admin/catalog/products/import", fd);
  },
  /** Export returns a file, not an envelope — path is used to build a link. */
  exportProductsPath: "/admin/catalog/products/export",
  deletedProducts: (q: AdminListQuery = {}) =>
    api.get<PagedResult<T.AdminProduct>>("/admin/catalog/products/deleted", { params: q }),
  restoreProduct: (id: string) => api.post<unknown>(`/admin/catalog/products/${id}/restore`),
  deletedCategories: (q: AdminListQuery = {}) =>
    api.get<PagedResult<Category>>("/admin/catalog/categories/deleted", { params: q }),
  restoreCategory: (id: string) => api.post<unknown>(`/admin/catalog/categories/${id}/restore`),
};

/* -------------------------- Products (write side) ----------------------- */
export const adminProductsApi = {
  list: (q: AdminListQuery = {}) => api.get<PagedResult<T.AdminProduct>>("/products", { params: q }),
  byId: (id: string) => api.get<T.AdminProduct>(`/products/${id}`),
  bySlug: (slug: string) => api.get<T.AdminProduct>(`/products/slug/${encodeURIComponent(slug)}`),
  create: (body: T.ProductRequest) => api.post<T.AdminProduct>("/products", body),
  update: (id: string, body: T.ProductRequest) => api.put<T.AdminProduct>(`/products/${id}`, body),
  remove: (id: string) => api.delete<void>(`/products/${id}`),
  publish: (id: string) => api.post<T.AdminProduct>(`/products/${id}/publish`),
  unpublish: (id: string) => api.post<T.AdminProduct>(`/products/${id}/unpublish`),
  setFeatured: (id: string, isFeatured: boolean) =>
    api.patch<T.AdminProduct>(`/products/${id}/featured`, { isFeatured }), // TODO confirm body
};

/* -------------------------------- Inventory ----------------------------- */
export const adminInventoryApi = {
  forProduct: (id: string) => api.get<T.InventoryRecord>(`/inventory/products/${id}`),
  setStock: (id: string, body: T.SetStockRequest) => api.put<T.InventoryRecord>(`/inventory/products/${id}/stock`, body),
  adjust: (id: string, body: T.AdjustStockRequest) => api.post<T.InventoryRecord>(`/inventory/products/${id}/adjust`, body),
  thresholds: (id: string, body: T.ThresholdsRequest) => api.put<T.InventoryRecord>(`/inventory/products/${id}/thresholds`, body),
  reserve: (id: string, quantity: number) => api.post<T.InventoryRecord>(`/inventory/products/${id}/reserve`, { quantity }),
  release: (id: string, quantity: number) => api.post<T.InventoryRecord>(`/inventory/products/${id}/release`, { quantity }),
  lowStock: (q: AdminListQuery = {}) => api.get<PagedResult<T.InventoryRecord>>("/inventory/low-stock", { params: q }),
  history: (id: string) => api.get<T.StockMovement[]>(`/inventory/products/${id}/history`),
};

/* ------------------------- Categories (write side) ---------------------- */
export const adminCategoriesApi = {
  list: () => api.get<Category[]>("/categories"),
  byId: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (body: T.CategoryRequest) => api.post<Category>("/categories", body),
  update: (id: string, body: T.CategoryRequest) => api.put<Category>(`/categories/${id}`, body),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
  setStatus: (id: string, body: T.UpdateStatusRequest) => api.patch<Category>(`/categories/${id}/status`, body),
};

/* --------------------------- Brands (write side) ------------------------ */
export const adminBrandsApi = {
  list: () => api.get<Brand[]>("/brands"),
  byId: (id: string) => api.get<Brand>(`/brands/${id}`),
  create: (body: T.BrandRequest) => api.post<Brand>("/brands", body),
  update: (id: string, body: T.BrandRequest) => api.put<Brand>(`/brands/${id}`, body),
  remove: (id: string) => api.delete<void>(`/brands/${id}`),
  setStatus: (id: string, body: T.UpdateStatusRequest) => api.patch<Brand>(`/brands/${id}/status`, body),
};

/* ---------------------------------- Media -------------------------------- */
export const adminMediaApi = {
  images: (productId: string) => api.get<T.ProductImage[]>(`/media/products/${productId}/images`),
  upload: (productId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file); // TODO: confirm multipart field name
    return api.postForm<T.ProductImage>(`/media/products/${productId}/images`, fd);
  },
  uploadBulk: (productId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f)); // TODO: confirm field name
    return api.postForm<T.ProductImage[]>(`/media/products/${productId}/images/bulk`, fd);
  },
  update: (productId: string, imageId: string, body: Partial<T.ProductImage>) =>
    api.put<T.ProductImage>(`/media/products/${productId}/images/${imageId}`, body),
  setDescription: (productId: string, imageId: string, description: string) =>
    api.patch<T.ProductImage>(`/media/products/${productId}/images/${imageId}/description`, { description }),
  setFeatured: (productId: string, imageId: string) =>
    api.patch<T.ProductImage>(`/media/products/${productId}/images/${imageId}/featured`),
  reorder: (productId: string, body: T.ReorderImagesRequest) =>
    api.put<T.ProductImage[]>(`/media/products/${productId}/images/order`, body),
  remove: (productId: string, imageId: string) =>
    api.delete<void>(`/media/products/${productId}/images/${imageId}`),
  removeAll: (productId: string) => api.delete<void>(`/media/products/${productId}/images`),
};
