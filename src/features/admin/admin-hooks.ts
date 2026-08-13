"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import {
  adminAuditApi, adminBrandsApi, adminCatalogApi, adminCategoriesApi, adminCustomersApi,
  adminDashboardApi, adminEmailsApi, adminInventoryApi, adminMediaApi, adminOrdersApi,
  adminPaymentsApi, adminProductsApi, adminRolesApi, adminSettingsApi, adminUsersApi,
  type AdminListQuery, type AdminOrderQuery, type AdminPaymentQuery, type ProductSearchQuery,
  type RefundQuery,
} from "./admin-api";
import { invalidateStorefront, invalidateProduct, revalidateProduct } from "./invalidate-storefront";
import type * as T from "./admin-types";

const onError = (e: Error) => toast.error(e.message || "Something went wrong");

/* ------------------------------- Dashboard ------------------------------ */
export function useAdminDashboard() {
  return useQuery({ queryKey: qk.admin.dashboard, queryFn: () => adminDashboardApi.overview() });
}
export function useSalesAnalytics(q: T.DateRangeQuery = {}) {
  return useQuery({ queryKey: qk.admin.analytics("sales", q), queryFn: () => adminDashboardApi.sales(q), placeholderData: keepPreviousData });
}
export function useCustomerAnalytics(q: T.DateRangeQuery = {}) {
  return useQuery({ queryKey: qk.admin.analytics("customers", q), queryFn: () => adminDashboardApi.customers(q), placeholderData: keepPreviousData });
}
export function useProductAnalytics(q: T.DateRangeQuery = {}) {
  return useQuery({ queryKey: qk.admin.analytics("products", q), queryFn: () => adminDashboardApi.products(q), placeholderData: keepPreviousData });
}
export function usePaymentAnalytics(q: T.DateRangeQuery = {}) {
  return useQuery({ queryKey: qk.admin.analytics("payments", q), queryFn: () => adminDashboardApi.payments(q), placeholderData: keepPreviousData });
}

/* --------------------------------- Orders ------------------------------- */
export function useAdminOrders(q: AdminOrderQuery) {
  return useQuery({ queryKey: qk.admin.orders.list(q), queryFn: () => adminOrdersApi.list(q), placeholderData: keepPreviousData });
}
export function useAdminOrder(id: string) {
  return useQuery({ queryKey: qk.admin.orders.detail(id), queryFn: () => adminOrdersApi.byId(id), enabled: !!id });
}
export function useAdminOrderTimeline(id: string) {
  return useQuery({ queryKey: qk.admin.orders.timeline(id), queryFn: () => adminOrdersApi.timeline(id), enabled: !!id });
}
export function useAdminOrderMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.orders.all });
    qc.invalidateQueries({ queryKey: qk.admin.dashboard });
    // The customer's own order views must reflect admin changes too.
    qc.invalidateQueries({ queryKey: qk.orders.all });
  };
  return {
    updateStatus: useMutation({
      mutationFn: (body: T.UpdateOrderStatusRequest) => adminOrdersApi.updateStatus(id, body),
      onSuccess: () => { refresh(); toast.success("Order status updated"); }, onError,
    }),
    assign: useMutation({
      mutationFn: (body: T.AssignOrderRequest) => adminOrdersApi.assign(id, body),
      onSuccess: () => { refresh(); toast.success("Order assigned"); }, onError,
    }),
    addNote: useMutation({
      mutationFn: (body: T.AddOrderNoteRequest) => adminOrdersApi.addNote(id, body),
      onSuccess: () => { refresh(); toast.success("Note added"); }, onError,
    }),
    recordPayment: useMutation({
      mutationFn: (body: T.RecordPaymentRequest) => adminOrdersApi.recordPayment(id, body),
      onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: qk.admin.payments.all }); toast.success("Payment recorded"); }, onError,
    }),
    cancel: useMutation({
      mutationFn: (body: T.CancelOrderRequest) => adminOrdersApi.cancel(id, body),
      onSuccess: () => { refresh(); toast.success("Order cancelled"); }, onError,
    }),
  };
}

/* -------------------------------- Payments ------------------------------ */
export function useAdminPayments(q: AdminPaymentQuery) {
  return useQuery({ queryKey: qk.admin.payments.list(q), queryFn: () => adminPaymentsApi.list(q), placeholderData: keepPreviousData });
}
export function useAdminPayment(id: string) {
  return useQuery({ queryKey: qk.admin.payments.detail(id), queryFn: () => adminPaymentsApi.byId(id), enabled: !!id });
}
export function useRefunds(q: RefundQuery) {
  return useQuery({ queryKey: qk.admin.payments.refunds(q), queryFn: () => adminPaymentsApi.refunds(q), placeholderData: keepPreviousData });
}
export function usePaymentMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.admin.payments.all });
  return {
    reverify: useMutation({
      mutationFn: (id: string) => adminPaymentsApi.reverify(id),
      onSuccess: () => { refresh(); toast.success("Payment re-verified"); }, onError,
    }),
    createRefund: useMutation({
      mutationFn: (body: T.CreateRefundRequest) => adminPaymentsApi.createRefund(body),
      onSuccess: () => { refresh(); toast.success("Refund requested"); }, onError,
    }),
    approveRefund: useMutation({
      mutationFn: (p: { id: string; body: T.ApproveRefundRequest }) => adminPaymentsApi.approveRefund(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("Refund approved"); }, onError,
    }),
    rejectRefund: useMutation({
      mutationFn: (p: { id: string; body: T.RejectRefundRequest }) => adminPaymentsApi.rejectRefund(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("Refund rejected"); }, onError,
    }),
  };
}

/* ------------------------------- Customers ------------------------------ */
export function useAdminCustomers(q: AdminListQuery) {
  return useQuery({ queryKey: qk.admin.customers.list(q), queryFn: () => adminCustomersApi.list(q), placeholderData: keepPreviousData });
}
export function useAdminCustomer(id: string) {
  return useQuery({ queryKey: qk.admin.customers.profile(id), queryFn: () => adminCustomersApi.profile(id), enabled: !!id });
}
export function useAdminCustomerAddresses(id: string) {
  return useQuery({ queryKey: qk.admin.customers.addresses(id), queryFn: () => adminCustomersApi.addresses(id), enabled: !!id });
}
export function useAdminCustomerActivity(id: string) {
  return useQuery({ queryKey: qk.admin.customers.activity(id), queryFn: () => adminCustomersApi.activity(id), enabled: !!id });
}
export function useAdminCustomerDashboard(id: string) {
  return useQuery({ queryKey: qk.admin.customers.dashboard(id), queryFn: () => adminCustomersApi.dashboard(id), enabled: !!id });
}
export function useCustomerStatusMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { isActive: boolean; reason?: string }) => adminCustomersApi.setStatus(id, p.isActive, p.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.customers.all });
      toast.success("Customer status updated");
    }, onError,
  });
}

/* --------------------------------- Users -------------------------------- */
export function useAdminUsers(q: AdminListQuery) {
  return useQuery({ queryKey: qk.admin.users.list(q), queryFn: () => adminUsersApi.list(q), placeholderData: keepPreviousData });
}
export function useAdminUser(id: string) {
  return useQuery({ queryKey: qk.admin.users.detail(id), queryFn: () => adminUsersApi.byId(id), enabled: !!id });
}
export function useUserMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.admin.users.all });
  return {
    create: useMutation({
      mutationFn: (body: T.CreateUserRequest) => adminUsersApi.create(body),
      onSuccess: () => { refresh(); toast.success("User created"); }, onError,
    }),
    update: useMutation({
      mutationFn: (p: { id: string; body: T.UpdateUserRequest }) => adminUsersApi.update(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("User updated"); }, onError,
    }),
    setRoles: useMutation({
      mutationFn: (p: { id: string; roles: string[] }) => adminUsersApi.setRoles(p.id, { roles: p.roles }),
      onSuccess: () => { refresh(); toast.success("Roles updated"); }, onError,
    }),
    setStatus: useMutation({
      mutationFn: (p: { id: string; isActive: boolean }) => adminUsersApi.setStatus(p.id, p.isActive),
      onSuccess: () => { refresh(); toast.success("Status updated"); }, onError,
    }),
    resetPassword: useMutation({
      // Sets the password directly and terminates every existing session for that user.
      mutationFn: (p: { id: string; newPassword: string }) =>
        adminUsersApi.resetPassword(p.id, { newPassword: p.newPassword }),
      onSuccess: () => toast.success("Password reset — the user's sessions have been signed out"), onError,
    }),
  };
}

/* --------------------------------- Roles -------------------------------- */
export function useRoles() {
  return useQuery({ queryKey: qk.admin.roles.all, queryFn: () => adminRolesApi.list() });
}
export function usePermissionMatrix() {
  return useQuery({ queryKey: qk.admin.roles.matrix, queryFn: () => adminRolesApi.matrix() });
}
export function usePermissionList() {
  return useQuery({ queryKey: qk.admin.roles.permissions, queryFn: () => adminRolesApi.permissions(), staleTime: 30 * 60_000 });
}
export function useRoleMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.roles.all });
    qc.invalidateQueries({ queryKey: qk.admin.roles.matrix });
  };
  return {
    create: useMutation({ mutationFn: (b: T.CreateRoleRequest) => adminRolesApi.create(b),
      onSuccess: () => { refresh(); toast.success("Role created"); }, onError }),
    update: useMutation({ mutationFn: (p: { id: string; body: T.UpdateRoleRequest }) => adminRolesApi.update(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("Role updated"); }, onError }),
    remove: useMutation({ mutationFn: (id: string) => adminRolesApi.remove(id),
      onSuccess: () => { refresh(); toast.success("Role deleted"); }, onError }),
  };
}

/* -------------------------------- Settings ------------------------------ */
export function useAdminSettings() {
  return useQuery({ queryKey: qk.admin.settings, queryFn: () => adminSettingsApi.get() });
}
export function useSettingsMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.settings });
    // Storefront settings (VAT, currency, maintenance) come from the same source.
    qc.invalidateQueries({ queryKey: qk.settings });
  };
  // Each mutation is declared directly (not via a factory) so hook order stays
  // static and the rules-of-hooks contract holds.
  const company = useMutation({
    mutationFn: adminSettingsApi.company,
    onSuccess: () => { refresh(); toast.success("Company details saved"); }, onError,
  });
  const contact = useMutation({
    mutationFn: adminSettingsApi.contact,
    onSuccess: () => { refresh(); toast.success("Contact details saved"); }, onError,
  });
  const social = useMutation({
    mutationFn: adminSettingsApi.social,
    onSuccess: () => { refresh(); toast.success("Social links saved"); }, onError,
  });
  const seo = useMutation({
    mutationFn: adminSettingsApi.seo,
    onSuccess: () => { refresh(); toast.success("SEO settings saved"); }, onError,
  });
  const maintenance = useMutation({
    mutationFn: adminSettingsApi.maintenance,
    onSuccess: () => { refresh(); toast.success("Maintenance settings saved"); }, onError,
  });

  return { company, contact, social, seo, maintenance };
}

/* ------------------------------- Email logs ----------------------------- */
export function useEmailLogs(q: T.EmailLogQuery) {
  return useQuery({ queryKey: qk.admin.emails.list(q), queryFn: () => adminEmailsApi.logs(q), placeholderData: keepPreviousData });
}
export function useEmailLog(id: string) {
  return useQuery({ queryKey: qk.admin.emails.detail(id), queryFn: () => adminEmailsApi.log(id), enabled: !!id });
}
export function useEmailMutations() {
  const qc = useQueryClient();
  return {
    // Processes every email currently due for retry (no id list — see adminEmailsApi.retry).
    retry: useMutation({
      mutationFn: () => adminEmailsApi.retry(),
      onSuccess: (count) => { qc.invalidateQueries({ queryKey: qk.admin.emails.all }); toast.success(`${count} email(s) queued for retry`); }, onError,
    }),
    test: useMutation({
      mutationFn: (body: T.TestEmailRequest) => adminEmailsApi.test(body),
      onSuccess: () => { qc.invalidateQueries({ queryKey: qk.admin.emails.all }); toast.success("Test email sent"); }, onError,
    }),
  };
}

/* ------------------------------- Audit logs ----------------------------- */
export function useAuditLogs(q: T.AuditLogQuery) {
  return useQuery({ queryKey: qk.admin.audit.list(q), queryFn: () => adminAuditApi.list(q), placeholderData: keepPreviousData });
}
export function useActorAuditLogs(actorId: string, q: AdminListQuery) {
  return useQuery({
    queryKey: qk.admin.audit.byActor(actorId, q),
    queryFn: () => adminAuditApi.byActor(actorId, q),
    enabled: !!actorId, placeholderData: keepPreviousData,
  });
}

/* -------------------------------- Products ------------------------------ */
export function useAdminProducts(q: ProductSearchQuery) {
  return useQuery({ queryKey: qk.admin.products.list(q), queryFn: () => adminProductsApi.list(q), placeholderData: keepPreviousData });
}
export function useAdminProduct(id: string) {
  return useQuery({ queryKey: qk.admin.products.detail(id), queryFn: () => adminProductsApi.byId(id), enabled: !!id });
}
export function useProductMutations() {
  const qc = useQueryClient();
  /** Every product write refreshes both the admin list and the public storefront. */
  const refresh = (slug?: string) => {
    qc.invalidateQueries({ queryKey: qk.admin.products.all });
    qc.invalidateQueries({ queryKey: qk.admin.dashboard });
    invalidateProduct(qc, slug);
    invalidateStorefront(qc);
    void revalidateProduct(slug);
  };

  return {
    create: useMutation({
      mutationFn: (body: T.ProductRequest) => adminProductsApi.create(body),
      onSuccess: (p) => { refresh(p?.slug); toast.success("Product created"); }, onError,
    }),
    update: useMutation({
      mutationFn: (p: { id: string; body: T.ProductRequest }) => adminProductsApi.update(p.id, p.body),
      onSuccess: (p) => { refresh(p?.slug); toast.success("Product saved"); }, onError,
    }),
    remove: useMutation({
      mutationFn: (p: { id: string; slug?: string }) => adminProductsApi.remove(p.id),
      onSuccess: (_r, p) => { refresh(p.slug); toast.success("Product deleted"); }, onError,
    }),
    publish: useMutation({
      mutationFn: (p: { id: string; slug?: string }) => adminProductsApi.publish(p.id),
      onSuccess: (_r, p) => { refresh(p.slug); toast.success("Product published — now live on the storefront"); }, onError,
    }),
    unpublish: useMutation({
      mutationFn: (p: { id: string; slug?: string }) => adminProductsApi.unpublish(p.id),
      onSuccess: (_r, p) => { refresh(p.slug); toast.success("Product unpublished — hidden from the storefront"); }, onError,
    }),
    setFeatured: useMutation({
      mutationFn: (p: { id: string; isFeatured: boolean; slug?: string }) =>
        adminProductsApi.setFeatured(p.id, p.isFeatured),
      onSuccess: (_r, p) => { refresh(p.slug); toast.success(p.isFeatured ? "Added to Featured" : "Removed from Featured"); }, onError,
    }),
  };
}

/* ------------------------------- Inventory ------------------------------ */
export function useLowStock(pageNumber = 1, pageSize = 20) {
  return useQuery({ queryKey: qk.admin.inventory.lowStock({ pageNumber, pageSize }), queryFn: () => adminInventoryApi.lowStock(pageNumber, pageSize), placeholderData: keepPreviousData });
}
export function useProductInventory(id: string) {
  return useQuery({ queryKey: qk.admin.inventory.product(id), queryFn: () => adminInventoryApi.forProduct(id), enabled: !!id });
}
export function useInventoryHistory(id: string) {
  return useQuery({ queryKey: qk.admin.inventory.history(id), queryFn: () => adminInventoryApi.history(id), enabled: !!id });
}
export function useInventoryMutations(productId: string, slug?: string) {
  const qc = useQueryClient();
  /** Stock changes drive storefront stock badges and checkout availability. */
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.inventory.all });
    qc.invalidateQueries({ queryKey: qk.admin.products.all });
    invalidateProduct(qc, slug);
    void revalidateProduct(slug);
  };
  return {
    setStock: useMutation({ mutationFn: (b: T.SetStockRequest) => adminInventoryApi.setStock(productId, b),
      onSuccess: () => { refresh(); toast.success("Stock updated"); }, onError }),
    adjust: useMutation({ mutationFn: (b: T.AdjustStockRequest) => adminInventoryApi.adjust(productId, b),
      onSuccess: () => { refresh(); toast.success("Stock adjusted"); }, onError }),
    thresholds: useMutation({ mutationFn: (b: T.ThresholdsRequest) => adminInventoryApi.thresholds(productId, b),
      onSuccess: () => { refresh(); toast.success("Thresholds saved"); }, onError }),
  };
}

/* --------------------------- Categories & Brands ------------------------ */
export function useCategoryMutations() {
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: qk.categories.all }); qc.invalidateQueries({ queryKey: qk.categories.tree }); invalidateStorefront(qc); };
  return {
    create: useMutation({ mutationFn: (b: T.CategoryRequest) => adminCategoriesApi.create(b),
      onSuccess: () => { refresh(); toast.success("Category created"); }, onError }),
    update: useMutation({ mutationFn: (p: { id: string; body: T.CategoryRequest }) => adminCategoriesApi.update(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("Category updated"); }, onError }),
    remove: useMutation({ mutationFn: (id: string) => adminCategoriesApi.remove(id),
      onSuccess: () => { refresh(); toast.success("Category deleted"); }, onError }),
    setStatus: useMutation({ mutationFn: (p: { id: string; isActive: boolean }) => adminCategoriesApi.setStatus(p.id, p.isActive),
      onSuccess: () => { refresh(); toast.success("Category status updated"); }, onError }),
  };
}
export function useBrandMutations() {
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: qk.brands.all }); invalidateStorefront(qc); };
  return {
    create: useMutation({ mutationFn: (b: T.BrandRequest) => adminBrandsApi.create(b),
      onSuccess: () => { refresh(); toast.success("Brand created"); }, onError }),
    update: useMutation({ mutationFn: (p: { id: string; body: T.BrandRequest }) => adminBrandsApi.update(p.id, p.body),
      onSuccess: () => { refresh(); toast.success("Brand updated"); }, onError }),
    remove: useMutation({ mutationFn: (id: string) => adminBrandsApi.remove(id),
      onSuccess: () => { refresh(); toast.success("Brand deleted"); }, onError }),
    setStatus: useMutation({
      mutationFn: (p: { id: string; isActive: boolean }) => adminBrandsApi.setStatus(p.id, p.isActive),
      onSuccess: (_r, p) => {
        refresh();
        toast.success(p.isActive ? "Brand published" : "Brand unpublished");
      },
      // Deliberately not the generic handler. The backend refuses to unpublish
      // a brand that still has live products and says how many; that message is
      // the entire point of the rule, so it is shown in full and for longer than
      // a default toast — an admin needs time to read a number and a next step.
      onError: (e: Error) => toast.error(e.message, { duration: 8000 }),
    }),
    uploadLogo: useMutation({
      mutationFn: (p: { id: string; file: File }) => adminBrandsApi.uploadLogo(p.id, p.file),
      onSuccess: () => { refresh(); toast.success("Logo updated"); },
      onError,
    }),
    removeLogo: useMutation({
      mutationFn: (id: string) => adminBrandsApi.removeLogo(id),
      onSuccess: () => { refresh(); toast.success("Logo removed"); },
      onError,
    }),
  };
}

/* ---------------------------------- Media -------------------------------- */
export function useProductImages(productId: string) {
  return useQuery({ queryKey: qk.admin.media.images(productId), queryFn: () => adminMediaApi.images(productId), enabled: !!productId });
}
export function useMediaMutations(productId: string, slug?: string) {
  const qc = useQueryClient();
  /** Image changes must show on the customer product page immediately. */
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.media.images(productId) });
    qc.invalidateQueries({ queryKey: qk.admin.products.detail(productId) });
    invalidateProduct(qc, slug);
    void revalidateProduct(slug);
  };
  return {
    upload: useMutation({ mutationFn: (files: File[]) =>
        files.length === 1 && files[0] ? adminMediaApi.upload(productId, files[0]).then((r) => [r])
                                       : adminMediaApi.uploadBulk(productId, files),
      onSuccess: () => { refresh(); toast.success("Images uploaded"); }, onError }),
    setFeatured: useMutation({ mutationFn: (imageId: string) => adminMediaApi.setFeatured(productId, imageId),
      onSuccess: () => { refresh(); toast.success("Featured image updated"); }, onError }),
    setDescription: useMutation({ mutationFn: (p: { imageId: string; altText?: string; caption?: string }) =>
        adminMediaApi.setDescription(productId, p.imageId, { altText: p.altText, caption: p.caption }),
      onSuccess: () => { refresh(); toast.success("Description saved"); }, onError }),
    reorder: useMutation({ mutationFn: (orderedImageIds: string[]) => adminMediaApi.reorder(productId, { orderedImageIds }),
      onSuccess: () => refresh(), onError }),
    remove: useMutation({ mutationFn: (imageId: string) => adminMediaApi.remove(productId, imageId),
      onSuccess: () => { refresh(); toast.success("Image removed"); }, onError }),
    removeMany: useMutation({ mutationFn: (imageIds: string[]) => adminMediaApi.removeMany(productId, { imageIds }),
      onSuccess: () => { refresh(); toast.success("Images removed"); }, onError }),
  };
}

/* ------------------------------ Bulk catalog ---------------------------- */
export function useDeletedProducts(pageNumber = 1, pageSize = 20) {
  return useQuery({ queryKey: qk.admin.catalog.deletedProducts({ pageNumber, pageSize }), queryFn: () => adminCatalogApi.deletedProducts(pageNumber, pageSize), placeholderData: keepPreviousData });
}
export function useDeletedCategories(pageNumber = 1, pageSize = 20) {
  return useQuery({ queryKey: qk.admin.catalog.deletedCategories({ pageNumber, pageSize }), queryFn: () => adminCatalogApi.deletedCategories(pageNumber, pageSize), placeholderData: keepPreviousData });
}
export function useCatalogMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.products.all });
    qc.invalidateQueries({ queryKey: ["admin", "catalog"] });
    invalidateStorefront(qc);
  };
  return {
    importProducts: useMutation({ mutationFn: (body: T.ProductImportRequest) => adminCatalogApi.importProducts(body),
      onSuccess: (result) => {
        refresh();
        if (result.wasValidationOnly) toast.success(`Validated ${result.totalRows} row(s) — ${result.failed} would fail`);
        else toast.success(`Imported: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
      }, onError }),
    restoreProduct: useMutation({ mutationFn: (id: string) => adminCatalogApi.restoreProduct(id),
      onSuccess: () => { refresh(); toast.success("Product restored"); }, onError }),
    restoreCategory: useMutation({ mutationFn: (id: string) => adminCatalogApi.restoreCategory(id),
      onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: qk.categories.all }); toast.success("Category restored"); }, onError }),
  };
}
