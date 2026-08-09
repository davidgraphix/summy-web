/**
 * Admin-side DTOs. Every interface mirrors a specific backend DTO — see the
 * comment above each one.
 */
import type { Address, Media, ProductSpecification, Refund, Seo, Dimensions } from "@/types/models";

/* ------------------------------ Dashboard ------------------------------ */
/** Mirrors RevenueSummaryDto. */
export interface RevenueSummary {
  totalRevenueInKobo: number;
  revenueTodayInKobo: number;
  revenueThisWeekInKobo: number;
  revenueThisMonthInKobo: number;
  totalRevenueFormatted: string;
  revenueTodayFormatted: string;
  revenueThisWeekFormatted: string;
  revenueThisMonthFormatted: string;
}
/** Mirrors OrderStatsDto. */
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageOrderValueInKobo: number;
  averageOrderValueFormatted: string;
}
/** Mirrors CustomerStatsDto. */
export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
}
/** Mirrors CatalogStatsDto. */
export interface CatalogStats {
  totalProducts: number;
  publishedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalBrands: number;
}
/** Mirrors PaymentStatsDto. */
export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalRefundedInKobo: number;
  totalRefundedFormatted: string;
}
/** Mirrors RecentOrderDto. */
export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalInKobo: number;
  totalFormatted: string;
  customerName: string | null;
  placedAtUtc: string;
}
/** Mirrors RecentCustomerDto. */
export interface RecentCustomer {
  id: string;
  fullName: string;
  email: string;
  status: string;
  registeredAtUtc: string;
}
/** Mirrors RecentPaymentDto. */
export interface RecentPayment {
  id: string;
  orderId: string;
  reference: string | null;
  status: string;
  amountInKobo: number;
  amountFormatted: string;
  provider: string | null;
  createdAtUtc: string;
}
/** Mirrors RecentActivityDto. */
export interface RecentActivity {
  action: string;
  entityType: string | null;
  actorEmail: string | null;
  occurredAtUtc: string;
}
/** Mirrors AdminDashboardDto. */
export interface AdminDashboard {
  revenue: RevenueSummary;
  orders: OrderStats;
  customers: CustomerStats;
  catalog: CatalogStats;
  payments: PaymentStats;
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
  recentPayments: RecentPayment[];
  recentActivities: RecentActivity[];
  generatedAtUtc: string;
}

/** Mirrors TimeSeriesPointDto. */
export interface SeriesPoint {
  /** Bucket start, yyyy-MM-dd. */
  period: string;
  valueInKobo: number;
  count: number;
}
/** Mirrors SalesAnalyticsDto. */
export interface SalesAnalytics {
  fromUtc: string;
  toUtc: string;
  totalRevenueInKobo: number;
  totalRevenueFormatted: string;
  totalOrders: number;
  averageOrderValueInKobo: number;
  series: SeriesPoint[];
  growthPercentage: number | null;
}
/** Mirrors TopProductDto. */
export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenueInKobo: number;
  revenueFormatted: string;
}
/** Mirrors TopCategoryDto. */
export interface TopCategory {
  categoryId: string;
  categoryName: string;
  unitsSold: number;
  revenueInKobo: number;
  revenueFormatted: string;
}
/** Mirrors TopCustomerDto. */
export interface TopCustomer {
  userId: string;
  fullName: string;
  email: string;
  orderCount: number;
  totalSpentInKobo: number;
  totalSpentFormatted: string;
}
/** Mirrors CustomerAnalyticsDto. */
export interface CustomerAnalytics {
  fromUtc: string;
  toUtc: string;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRate: number;
  registrationSeries: SeriesPoint[];
  topCustomers: TopCustomer[];
}
/** Mirrors PaymentAnalyticsDto. */
export interface PaymentAnalytics {
  fromUtc: string;
  toUtc: string;
  totalAttempts: number;
  successful: number;
  failed: number;
  successRate: number;
  totalCollectedInKobo: number;
  totalCollectedFormatted: string;
  byProvider: Record<string, number>;
}
/** Mirrors ProductAnalyticsDto. */
export interface ProductAnalytics {
  fromUtc: string;
  toUtc: string;
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  lowStockCount: number;
  outOfStockCount: number;
  productsWithNoSales: number;
}

/** Date-range query shared by every analytics endpoint. */
export interface DateRangeQuery { from?: string; to?: string }

/* -------------------------------- Orders ------------------------------- */
/** Mirrors UpdateOrderStatusRequest. */
export interface UpdateOrderStatusRequest { status: string; notes?: string; trackingNumber?: string }
/** Mirrors AssignStaffRequest — omit staffId (or send null) to unassign. */
export interface AssignOrderRequest { staffId?: string | null }
/** Mirrors AddOrderNoteRequest. */
export interface AddOrderNoteRequest { content: string; isInternal?: boolean }
/** Mirrors RecordPaymentRequest — manual/offline payment capture. */
export interface RecordPaymentRequest { amountInKobo: number; paymentReference?: string; paymentMethod?: string }
/** Mirrors CancelOrderRequest. */
export interface CancelOrderRequest { reason: string }

/* ------------------------------- Payments ------------------------------ */
/** Mirrors ApproveRefundRequest. */
export interface ApproveRefundRequest { notes?: string }
/** Mirrors RejectRefundRequest. */
export interface RejectRefundRequest { reason: string }
/** Mirrors CreateRefundRequest. */
export interface CreateRefundRequest { paymentId: string; amountInKobo: number; reason: string; notes?: string }
export type { Refund };

/* ------------------------------ Customers ------------------------------ */
export type { Address };

/* ------------------------------ Customers -------------------------------- */
/** Mirrors CustomerListItemDto — the admin Customers directory row shape. */
export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  accountStatus: string;
  createdAtUtc: string;
}

/* -------------------------------- Users -------------------------------- */
/** Mirrors AdminUserDto. Note: only a combined fullName is returned, never firstName/lastName. */
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  userType: string;
  status: string;
  emailConfirmed: boolean;
  roles: string[];
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}
/** Mirrors CreateAdminUserRequest. Roles are role *names*, not ids; at least one is required. */
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  roles: string[];
}
/** Mirrors UpdateAdminUserRequest. */
export interface UpdateUserRequest { firstName: string; lastName: string; phoneNumber?: string }
/** Mirrors AssignRolesRequest — the complete desired role-name set; replaces, not merges. */
export interface AssignRolesRequest { roles: string[] }
/** Mirrors ResetAdminPasswordRequest. */
export interface ResetAdminPasswordRequest { newPassword: string }

/* -------------------------------- Roles -------------------------------- */
/** Mirrors RoleDto. */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: string[];
  userCount: number;
}
/** Mirrors PermissionDto. */
export interface Permission {
  id: string;
  name: string;
  group: string;
  description: string | null;
}
/** Mirrors PermissionMatrixDto. */
export interface PermissionMatrix {
  /** Grouped permission catalogue, keyed by group name. */
  permissionGroups: Record<string, Permission[]>;
  /** Role name -> the permission names it grants. */
  rolePermissions: Record<string, string[]>;
}
/** Mirrors CreateRoleRequest. */
export interface CreateRoleRequest { name: string; description?: string; permissions?: string[] }
/** Mirrors UpdateRoleRequest — the complete desired permission set; replaces, not merges. */
export interface UpdateRoleRequest { description?: string; permissions: string[] }

/* ------------------------------- Settings ------------------------------ */
/** Mirrors SystemSettingsDto — a single flat object, not grouped sub-objects. */
export interface AdminSettings {
  companyName: string;
  legalName: string | null;
  registrationNumber: string | null;
  taxIdentificationNumber: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
  salesEmail: string | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
  whatsAppNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedInUrl: string | null;
  tikTokUrl: string | null;
  youTubeUrl: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  defaultMetaKeywords: string | null;
  defaultOgImageUrl: string | null;
  currencyCode: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  extraSettingsJson: string | null;
}
/** Mirrors UpdateCompanySettingsRequest. */
export interface CompanySettings {
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  taxIdentificationNumber?: string;
  logoUrl?: string;
}
/** Mirrors UpdateContactSettingsRequest. */
export interface ContactSettings {
  supportEmail?: string;
  salesEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsAppNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}
/** Mirrors UpdateSocialSettingsRequest. */
export interface SocialSettings {
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
  tikTokUrl?: string;
  youTubeUrl?: string;
}
/** Mirrors UpdateSeoSettingsRequest. */
export interface SeoSettings {
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  defaultMetaKeywords?: string;
  defaultOgImageUrl?: string;
}
/** Mirrors UpdateMaintenanceRequest. */
export interface MaintenanceSettings { enabled: boolean; message?: string }

/* ------------------------------ Email logs ----------------------------- */
export type EmailStatus = "Pending" | "Queued" | "Sending" | "Sent" | "Failed" | "Cancelled";
export type EmailTemplateName =
  | "Welcome" | "EmailVerification" | "PasswordReset" | "PasswordChanged" | "NewDeviceLogin"
  | "OrderCreated" | "PaymentSuccessful" | "OrderProcessing" | "OrderShipped" | "OrderDelivered"
  | "OrderCancelled" | "Custom";
export type EmailCategoryName = "Transactional" | "Security" | "Marketing" | "Newsletter" | "ProductUpdate";

/** Mirrors EmailLogDto. */
export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  userId: string | null;
  template: EmailTemplateName;
  category: EmailCategoryName;
  subject: string;
  provider: string;
  status: EmailStatus;
  providerMessageId: string | null;
  failureReason: string | null;
  attemptCount: number;
  referenceId: string | null;
  createdAtUtc: string;
  sentAtUtc: string | null;
  lastAttemptedAtUtc: string | null;
  nextRetryAtUtc: string | null;
}
/** Query params for GET /admin/emails/logs. */
export interface EmailLogQuery {
  search?: string;
  status?: EmailStatus;
  template?: EmailTemplateName;
  category?: EmailCategoryName;
  userId?: string;
  referenceId?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}
/** Mirrors SendTestEmailRequest. */
export interface TestEmailRequest { recipientEmail: string; recipientName?: string; subject?: string }

/* ------------------------------ Audit logs ----------------------------- */
/** Mirrors AuditLogDto. */
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAtUtc: string;
}
/** Query params for GET /admin/audit-logs. */
export interface AuditLogQuery {
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

/* ------------------------------ Inventory ------------------------------ */
/** Mirrors InventoryStatusDto. */
export interface InventoryRecord {
  productId: string;
  sku: string;
  productName: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  inventoryStatus: "OutOfStock" | "LowStock" | "InStock";
}
/** Mirrors InventoryMovementDto. */
export interface StockMovement {
  id: string;
  reason: string;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  notes: string | null;
  referenceId: string | null;
  performedBy: string | null;
  occurredAtUtc: string;
}
/** Mirrors SetStockRequest — sets stock to an absolute figure. */
export interface SetStockRequest { quantity: number; notes?: string }
/** Mirrors AdjustStockRequest — a signed change with a reason. */
export interface AdjustStockRequest { delta: number; reason: string; notes?: string; referenceId?: string }
/** Mirrors StockThresholdsRequest. */
export interface ThresholdsRequest { lowStockThreshold: number; maximumStockLevel?: number }

/* ------------------------- Products (admin view) ----------------------- */
/** Mirrors CreateProductRequest / UpdateProductRequest (identical shape; create allows initial stockQuantity). */
export interface ProductRequest {
  name: string;
  slug?: string;
  sku: string;
  categoryId: string;
  brandId?: string;
  shortDescription?: string;
  fullDescription?: string;
  priceInKobo: number;
  discountPriceInKobo?: number;
  costPriceInKobo?: number;
  /** Only meaningful on create — UpdateProductRequest has no stockQuantity field. */
  stockQuantity?: number;
  lowStockThreshold?: number;
  maximumStockLevel?: number;
  weightGrams?: number;
  dimensions?: Dimensions;
  barcode?: string;
  warrantyInformation?: string;
  isFeatured?: boolean;
  seo?: Seo;
  metaJson?: string;
  specifications?: ProductSpecification[];
  tags?: string[];
}

/* ------------------------- Categories & Brands ------------------------- */
/** Mirrors CreateCategoryRequest / UpdateCategoryRequest (identical shape). */
export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
  seo?: Seo;
}
/** Mirrors CreateBrandRequest / UpdateBrandRequest (identical shape). */
export interface BrandRequest {
  name: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  seo?: Seo;
}

/* --------------------------------- Media -------------------------------- */
export type { Media as ProductImage };
/** Mirrors ImageDescriptionRequest. */
export interface UpdateImageDescriptionRequest { altText?: string; caption?: string }
/** Mirrors ReorderImagesRequest — field is OrderedImageIds, not ImageIds. */
export interface ReorderImagesRequest { orderedImageIds: string[] }
/** Mirrors DeleteImagesRequest — bulk delete targets specific ids; there is no "delete all". */
export interface DeleteImagesRequest { imageIds: string[] }

/* ----------------------------- Catalog bulk ----------------------------- */
/** Mirrors ProductImportRow. */
export interface ProductImportRow {
  sku: string;
  name: string;
  categoryName: string;
  brandName?: string;
  priceInKobo: number;
  discountPriceInKobo?: number;
  stockQuantity?: number;
  shortDescription?: string;
  barcode?: string;
  weightGrams?: number;
  isPublished?: boolean;
}
/** Mirrors ProductImportRequest. */
export interface ProductImportRequest {
  rows: ProductImportRow[];
  validateOnly?: boolean;
  updateExisting?: boolean;
}
/** Mirrors ProductImportRowResult. */
export interface ProductImportRowResult {
  rowNumber: number;
  sku: string;
  outcome: string;
  error: string | null;
}
/** Mirrors ProductImportResult. */
export interface ProductImportResult {
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  wasValidationOnly: boolean;
  rows: ProductImportRowResult[];
}
