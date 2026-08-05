/**
 * Admin-side DTOs. As with the customer models, the API map gives endpoints but
 * not field-level shapes, so known/necessary fields are typed and uncertain ones
 * are optional + marked TODO. This file is the single place to reconcile with
 * the real Swagger.
 */
import type { Address, Order, Payment, Product } from "@/types/models";

/* ------------------------------ Dashboard ------------------------------ */
export interface AdminDashboard {
  // TODO: confirm aggregate field names on GET /admin/dashboard.
  totalRevenue?: number;
  todayRevenue?: number;
  revenueGrowth?: number;          // percentage, e.g. 12.4
  totalOrders?: number;
  pendingOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  totalProducts?: number;
  totalCustomers?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  averageOrderValue?: number;
  recentOrders?: Order[];
  recentPayments?: Payment[];
  recentCustomers?: AdminCustomerSummary[];
  recentActivity?: AuditLogEntry[];
  [key: string]: unknown;
}

/** Analytics endpoints return series data; point shape is intentionally loose. */
export interface SeriesPoint {
  // TODO: confirm x-axis key (date/label/period) and value keys per endpoint.
  date?: string;
  label?: string;
  period?: string;
  value?: number;
  revenue?: number;
  orders?: number;
  count?: number;
  amount?: number;
  name?: string;
  [key: string]: unknown;
}

export interface SalesAnalytics { series?: SeriesPoint[]; topProducts?: SeriesPoint[]; byCategory?: SeriesPoint[]; [k: string]: unknown }
export interface CustomerAnalytics { series?: SeriesPoint[]; growth?: SeriesPoint[]; [k: string]: unknown }
export interface ProductAnalytics { topSelling?: SeriesPoint[]; byCategory?: SeriesPoint[]; [k: string]: unknown }
export interface PaymentAnalytics { byProvider?: SeriesPoint[]; byStatus?: SeriesPoint[]; series?: SeriesPoint[]; [k: string]: unknown }

/* -------------------------------- Orders ------------------------------- */
export interface AdminOrder extends Order {
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  assignedToId?: string;
  assignedToName?: string;
  notes?: AdminOrderNote[];
}
export interface AdminOrderNote {
  id?: string; note?: string; authorName?: string; createdAt?: string; // TODO confirm
}
export interface UpdateOrderStatusRequest { status: string; note?: string } // TODO confirm
export interface AssignOrderRequest { userId: string }                     // TODO confirm
export interface AddOrderNoteRequest { note: string }                      // TODO confirm
export interface RecordPaymentRequest {
  // POST /admin/orders/{id}/payments — manual/offline payment capture.
  amount: number; reference?: string; method?: string; note?: string;       // TODO confirm
}

/* ------------------------------- Payments ------------------------------ */
export interface AdminPayment extends Payment {
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string;
  method?: string;
}
export interface Refund {
  id: string;
  paymentId?: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  reason?: string;
  status?: string;              // Pending | Approved | Rejected — TODO confirm
  requestedBy?: string;
  createdAt?: string;
}
export interface CreateRefundRequest { paymentId: string; amount: number; reason?: string } // TODO confirm

/* ------------------------------ Customers ------------------------------ */
export interface AdminCustomerSummary {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;              // Active | Suspended — TODO confirm
  isActive?: boolean;
  createdAt?: string;
  orderCount?: number;
  totalSpent?: number;
}
export interface AdminCustomerDashboard {
  orderCount?: number; totalSpent?: number; wishlistCount?: number;
  recentOrders?: Order[]; [k: string]: unknown;
}
export interface AdminCustomerActivity {
  id?: string; type?: string; description?: string; occurredAt?: string;
}
export type { Address };

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
export interface EmailLog {
  id: string;
  to?: string;
  recipient?: string;
  subject?: string;
  template?: string;
  status?: string;              // Sent | Failed | Queued — TODO confirm
  error?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt?: string;
  body?: string;
  attempts?: number;
}
export interface RetryEmailRequest { emailIds: string[] }                  // TODO confirm
export interface TestEmailRequest { to: string; subject?: string; template?: string } // TODO confirm

/* ------------------------------ Audit logs ----------------------------- */
export interface AuditLogEntry {
  id: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  occurredAt?: string;
  createdAt?: string;
  description?: string;
  changes?: unknown;
}

/* ------------------------------ Inventory ------------------------------ */
export interface InventoryRecord {
  productId: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  stockQuantity?: number;
  reserved?: number;
  available?: number;
  lowStockThreshold?: number;
  reorderPoint?: number;
  updatedAt?: string;
}
export interface StockMovement {
  id?: string;
  productId?: string;
  change?: number;
  quantity?: number;
  reason?: string;
  type?: string;
  performedBy?: string;
  occurredAt?: string;
  createdAt?: string;
}
export interface SetStockRequest { quantity: number; reason?: string }      // TODO confirm
export interface AdjustStockRequest { adjustment: number; reason?: string } // TODO confirm
export interface ThresholdsRequest { lowStockThreshold?: number; reorderPoint?: number }

/* ------------------------- Products (admin view) ----------------------- */
export interface AdminProduct extends Product {
  sku?: string;
  status?: string;              // Draft | Published — TODO confirm
  isPublished?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants?: ProductVariant[];
  costPrice?: number;
  updatedAt?: string;
  createdAt?: string;
}
export interface ProductVariant {
  id?: string; name?: string; sku?: string; price?: number; stockQuantity?: number;
  attributes?: Record<string, string>;                                     // TODO confirm
}
export interface ProductRequest {
  name: string;
  slug?: string;
  sku?: string;

  categoryId?: string;
  brandId?: string;

  priceInKobo: number;
  discountPriceInKobo?: number;
  costPriceInKobo?: number;

  shortDescription?: string;
  fullDescription?: string;

  stockQuantity?: number;
  isFeatured?: boolean;

  tags?: string[];
  specifications?: Array<{
    name: string;
    value: string;
  }>;
}

/* ------------------------- Categories & Brands ------------------------- */
export interface CategoryRequest {
  name: string; slug?: string; description?: string; parentId?: string | null; imageUrl?: string;
}
export interface BrandRequest {
  name: string; slug?: string; description?: string; logoUrl?: string;
}

/* --------------------------------- Media -------------------------------- */
export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  altText?: string;
  isFeatured?: boolean;
  isPrimary?: boolean;
  sortOrder?: number;
}
export interface ReorderImagesRequest { imageIds: string[] }               // TODO confirm
