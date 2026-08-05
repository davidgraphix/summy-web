/**
 * Domain models. The API contract lists endpoints but not full DTOs, so each
 * interface types the fields we can rely on and marks the rest with TODO.
 * Adjust field names here once the real Swagger/DTOs are available — every
 * feature imports from this single file.
 */

/* ------------------------------- Media -------------------------------- */
export interface Media {
  id?: string;
  url: string;
  // TODO: confirm — thumbnailUrl / altText / isPrimary / sortOrder.
  thumbnailUrl?: string;
  altText?: string;
  isPrimary?: boolean;
}

/* ------------------------------ Catalog ------------------------------- */
export interface Brand {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string; // TODO confirm
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  imageUrl?: string;
  productCount?: number;
}

export interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  /** Original/compare-at price for discount display. TODO confirm field name. */
  compareAtPrice?: number | null;
  currency?: string;
  inStock?: boolean;
  stockQuantity?: number;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  brand?: Brand | null;
  brandName?: string;
  category?: Category | null;
  categoryName?: string;
  images?: Media[];
  primaryImageUrl?: string;
  // TODO: confirm specifications shape (array of {name,value} vs record).
  specifications?: Array<{ name: string; value: string }> | Record<string, string>;
  /** Set from the admin dashboard; surfaced on the storefront product page. */
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants?: ProductVariantOption[];
}

/** Selectable option on a product (size, colour, capacity…). */
export interface ProductVariantOption {
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  // TODO: confirm the variant DTO returned by the storefront endpoints.
  attributes?: Record<string, string>;
}

export interface StorefrontSettings {
  // TODO: confirm settings DTO (vatRate, currency, freeShippingThreshold, supportEmail…).
  currency?: string;
  vatRate?: number;
  freeShippingThreshold?: number;
  [key: string]: unknown;
}

/* ------------------------------- Cart --------------------------------- */
export interface CartItem {
  productId: string;
  // TODO: confirm cart item DTO (id, name, unitPrice/price, quantity, lineTotal, imageUrl, slug).
  id?: string;
  name?: string;
  slug?: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  lineTotal?: number;
  imageUrl?: string;
  inStock?: boolean;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  // TODO: confirm totals fields (subtotal, vat/tax, shipping, total, itemCount).
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  itemCount?: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal?: number;
  total?: number;
  // TODO confirm
}

/* ------------------------------ Orders -------------------------------- */
export type OrderStatus =
  | "Pending" | "Processing" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Refunded"
  | string; // TODO: confirm the real status enum values.

export interface OrderItem {
  productId: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  createdAt?: string;
  shippingAddress?: Address;
  paymentStatus?: string;
  // TODO: confirm remaining order fields.
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  // TODO confirm: title / description / occurredAt / timestamp.
  title?: string;
  description?: string;
  occurredAt?: string;
  timestamp?: string;
}

/* --------------------------- Create Order ----------------------------- */
export interface CreateOrderRequest {
  // TODO: confirm — many backends derive items from the server cart and only
  // need an addressId or an inline shipping address. Supporting both here.
  shippingAddressId?: string;
  shippingAddress?: AddressInput;
  billingAddressId?: string;
  notes?: string;
}

/* ------------------------------ Payments ------------------------------ */
export interface Payment {
  id: string;
  orderId?: string;
  reference?: string;
  status?: string;
  amount?: number;
  provider?: string; // "Flutterwave"
  createdAt?: string;
}

export interface InitializePaymentRequest {
  orderId: string;
  // TODO: confirm — redirectUrl / callbackUrl / channel.
  redirectUrl?: string;
}

export interface InitializePaymentResult {
  // Flutterwave hosted-checkout redirect.
  // TODO: confirm field names (paymentLink / authorizationUrl / link, reference).
  paymentLink?: string;
  authorizationUrl?: string;
  link?: string;
  reference?: string;
}

/* ------------------------------ Customer ------------------------------ */
export interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  referralCode?: string;
  // TODO: confirm remaining profile fields.
}

export interface Address {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  // TODO: confirm address DTO field names (street vs line1, zip vs postalCode).
}
export type AddressInput = Omit<Address, "id" | "isDefault">;

export interface WishlistItem {
  productId: string;
  product?: Product;
  // TODO confirm
}

export interface Notification {
  id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  type?: string;
  // TODO confirm
}

export interface ReferralSummary {
  referralCode?: string;
  totalReferrals?: number;
  totalRewards?: number;
  // TODO confirm
}
export interface Referral {
  id: string;
  refereeName?: string;
  status?: string;
  reward?: number;
  createdAt?: string;
  // TODO confirm
}

export interface DashboardOverview {
  // TODO: confirm dashboard aggregate DTO (orderCount, wishlistCount, totalSpent, recentOrders…).
  orderCount?: number;
  wishlistCount?: number;
  totalSpent?: number;
  unreadNotifications?: number;
  recentOrders?: Order[];
  [key: string]: unknown;
}

export interface ActivityEntry {
  id?: string;
  type?: string;
  description?: string;
  occurredAt?: string;
  // TODO confirm
}

/* ---------------------------- Sessions -------------------------------- */
/** Mirrors SessionDto. */
export interface UserSession {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  location: string | null;
  createdAtUtc: string;
  lastUsedAtUtc: string;
  isCurrent: boolean;
}

export type LoginOutcome = "Success" | "InvalidCredentials" | "LockedOut" | "NotAllowed" | "EmailNotVerified";

/** Mirrors LoginHistoryEntryDto. No stable id — key lists by index. */
export interface LoginHistoryEntry {
  outcome: LoginOutcome;
  ipAddress: string | null;
  deviceDescription: string | null;
  location: string | null;
  createdAtUtc: string;
  failureReason: string | null;
}
