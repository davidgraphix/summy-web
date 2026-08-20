/**
 * Domain models. Every interface here mirrors a specific backend DTO exactly —
 * see the comment above each one. Field names, nullability and required-ness
 * are copied from the C# record, not guessed.
 */

/** Mirrors MoneyDto. Render `.formatted` for display; use `.kobo` for math. */
export interface Money {
  kobo: number;
  formatted: string;
  currency: string;
}

/* ------------------------------- Media -------------------------------- */
/** Mirrors ProductImageDto. */
export interface Media {
  id: string;
  publicId: string;
  secureUrl: string;
  optimizedUrl: string | null;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  isFeatured: boolean;
  displayOrder: number;
}

/* ------------------------------ Catalog ------------------------------- */
/** Mirrors SeoDto. */
export interface Seo {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
}

/** Mirrors DimensionsDto. */
export interface Dimensions {
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
}

export type CatalogEntryStatus = "Active" | "Inactive";

/** Mirrors BrandDto. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: CatalogEntryStatus;
  seo: Seo;
  createdAtUtc: string;
}

/** Mirrors CategoryDto. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  status: CatalogEntryStatus;
  displayOrder: number;
  seo: Seo;
  createdAtUtc: string;
}

/** Mirrors CategoryTreeDto — a distinct, smaller shape from CategoryDto. */
export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  displayOrder: number;
  children: CategoryNode[];
}

export type ProductStatus = "Draft" | "Published" | "OutOfStock" | "Hidden" | "Archived" | "Discontinued";
export type InventoryStatusValue = "OutOfStock" | "LowStock" | "InStock";

/** Mirrors ProductSpecificationDto. */
export interface ProductSpecification {
  name: string;
  value: string;
  group: string | null;
  displayOrder: number;
}

/** Mirrors ProductVariantDto. */
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: Money | null;
  availableQuantity: number;
  isActive: boolean;
}

/** Mirrors ProductSummaryDto — the compact projection used by list/search endpoints. */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: Money;
  discountPrice: Money | null;
  effectivePrice: Money;
  discountPercentage: number;
  isOnSale: boolean;
  inventoryStatus: InventoryStatusValue;
  availableQuantity: number;
  isFeatured: boolean;
  status: ProductStatus;
  isPublished: boolean;
  categoryId: string;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  primaryImageUrl: string | null;
  thumbnailUrl: string | null;
  createdAtUtc: string;
}

/** Mirrors ProductDetailDto — full product detail for the product page and admin editor. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: Money;
  discountPrice: Money | null;
  effectivePrice: Money;
  discountPercentage: number;
  isOnSale: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  maximumStockLevel: number | null;
  inventoryStatus: InventoryStatusValue;
  isPurchasable: boolean;
  weightGrams: number | null;
  dimensions: Dimensions | null;
  barcode: string | null;
  warrantyInformation: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAtUtc: string | null;
  seo: Seo;
  metaJson: string | null;
  category: Category | null;
  brand: Brand | null;
  specifications: ProductSpecification[];
  tags: string[];
  images: Media[];
  variants: ProductVariant[];
  createdAtUtc: string;
  lastModifiedAtUtc: string | null;
}

/** Mirrors PublicSettingsDto. */
export interface StorefrontSettings {
  companyName: string;
  logoUrl: string | null;
  supportEmail: string | null;
  primaryPhone: string | null;
  whatsAppNumber: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedInUrl: string | null;
  tikTokUrl: string | null;
  youTubeUrl: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  currencyCode: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

/* ------------------------------- Cart --------------------------------- */
/** Mirrors CartItemDto. */
export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  productSlug: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceAtAddInKobo: number;
  currentUnitPriceInKobo: number;
  currentUnitPriceFormatted: string;
  lineTotalInKobo: number;
  lineTotalFormatted: string;
  priceChanged: boolean;
  /** Signed: negative when the price fell since the item was added. */
  priceDifferenceInKobo: number;
  availableQuantity: number;
  isAvailable: boolean;
  unavailableReason: string | null;
  addedAtUtc: string;
}

/** Mirrors CartDto. */
export interface Cart {
  id: string;
  isAnonymous: boolean;
  items: CartItem[];
  distinctItemCount: number;
  totalQuantity: number;
  subtotalInKobo: number;
  /** Always 0 in the cart — delivery is priced at checkout. See `deliveryPending`. */
  deliveryFeeInKobo: number;
  vatInKobo: number;
  totalInKobo: number;
  /** True while delivery is unpriced, so the UI says "calculated at checkout". */
  deliveryPending: boolean;
  subtotalFormatted: string;
  deliveryFeeFormatted: string;
  vatFormatted: string;
  totalFormatted: string;
  currency: string;
  isCheckoutReady: boolean;
  warnings: string[];
  expiresAtUtc: string;
}

/** Mirrors CartSummaryDto. */
export interface CartSummary {
  distinctItemCount: number;
  totalQuantity: number;
  subtotalInKobo: number;
  subtotalFormatted: string;
}

/* ------------------------------ Orders -------------------------------- */
export type OrderStatus =
  | "Pending" | "AwaitingPayment" | "Paid" | "Processing" | "Packed" | "Shipped"
  | "Delivered" | "Completed" | "Cancelled" | "RefundPending" | "Refunded" | "Failed";

export type OrderPaymentStatus =
  | "Unpaid" | "Pending" | "Authorized" | "Paid" | "PartiallyPaid" | "Failed"
  | "PartiallyRefunded" | "Refunded";

export type OrderPaymentMethod =
  | "Unspecified" | "Flutterwave" | "BankTransfer" | "CashOnDelivery" | "StoreCredit" | "GiftCard";

/** Shared shape of an order address, mirrors OrderAddressDto minus the formatted line. */
export interface OrderAddressInput {
  recipientName: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  localGovernment?: string;
  streetAddress: string;
  apartmentSuite?: string;
  postalCode?: string;
  landmark?: string;
  deliveryInstructions?: string;
}

/** Mirrors OrderAddressDto. */
export interface OrderAddress extends OrderAddressInput {
  formattedAddress: string;
}

/** Mirrors OrderItemDto. */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  variantName: string | null;
  quantity: number;
  unitPriceInKobo: number;
  unitPriceFormatted: string;
  discountInKobo: number;
  totalInKobo: number;
  totalFormatted: string;
  refundedQuantity: number;
}

/** Mirrors OrderTimelineEventDto. */
export interface OrderTimelineEntry {
  id: string;
  eventType: string;
  actorType: "Customer" | "Staff" | "System";
  actorName: string | null;
  description: string;
  notes: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  occurredAtUtc: string;
}

/** Mirrors OrderNoteDto. */
export interface OrderNote {
  id: string;
  content: string;
  isInternal: boolean;
  authorName: string | null;
  createdAtUtc: string;
}

/** Mirrors OrderSummaryDto — compact projection for order lists. */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  totalInKobo: number;
  totalFormatted: string;
  itemCount: number;
  previewImageUrl: string | null;
  placedAtUtc: string;
  trackingNumber: string | null;
}

/** Mirrors OrderDetailDto — full order detail for the customer page and admin editor. */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string | null;
  customerEmail: string | null;
  /** The account holder's phone, which may differ from the shipping recipient's. */
  customerPhone: string | null;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: DeliveryMethod;
  paymentReference: string | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  subtotalInKobo: number;
  discountInKobo: number;
  deliveryFeeInKobo: number;
  vatInKobo: number;
  totalInKobo: number;
  amountPaidInKobo: number;
  amountRefundedInKobo: number;
  outstandingBalanceInKobo: number;
  totalFormatted: string;
  currency: string;
  customerNote: string | null;
  cancellationReason: string | null;
  trackingNumber: string | null;
  assignedStaffId: string | null;
  isCancellable: boolean;
  placedAtUtc: string;
  paidAtUtc: string | null;
  shippedAtUtc: string | null;
  deliveredAtUtc: string | null;
  completedAtUtc: string | null;
  cancelledAtUtc: string | null;
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  notes: OrderNote[];
}

/* --------------------------- Create Order ----------------------------- */
/** Mirrors CheckoutItemRequest. */
export interface CheckoutItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

/** How the customer receives the order. Mirrors the backend DeliveryMethod enum. */
export type DeliveryMethod = "StorePickup" | "HomeDelivery";

/** Mirrors CreateOrderRequest. */
export interface CreateOrderRequest {
  items: CheckoutItem[];
  shippingAddressId?: string;
  shippingAddress?: OrderAddressInput;
  billingAddressId?: string;
  billingAddress?: OrderAddressInput;
  paymentMethod?: string;
  /** Required — the backend rejects a checkout that has not chosen one. */
  deliveryMethod: DeliveryMethod;
  customerNote?: string;
}

/** Mirrors CheckoutQuoteRequest. */
export interface CheckoutQuoteRequest {
  items: CheckoutItem[];
  deliveryMethod: DeliveryMethod;
  state?: string;
  shippingAddressId?: string;
}

/**
 * Mirrors CheckoutQuoteDto — the server's own costing of the basket.
 *
 * Every figure shown at checkout comes from here rather than being added up in
 * the browser, so the amount on the pay button is by construction the amount
 * that will be charged.
 */
export interface CheckoutQuote {
  deliveryMethod: DeliveryMethod;
  subtotalInKobo: number;
  deliveryFeeInKobo: number;
  vatInKobo: number;
  totalInKobo: number;
  subtotalFormatted: string;
  deliveryFeeFormatted: string;
  vatFormatted: string;
  totalFormatted: string;
  currency: string;
  freeDeliveryApplied: boolean;
  usedDefaultRate: boolean;
}

/** Mirrors DeliveryRateDto. */
export interface DeliveryRate {
  id: string;
  state: string;
  feeInKobo: number;
  feeFormatted: string;
  isActive: boolean;
  notes: string | null;
}

/* -------------------------- Invoices & receipts ------------------------ */
/** Mirrors InvoiceDto. */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  issuedAtUtc: string;
  dueAtUtc: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  billingAddressLine: string;
  items: OrderItem[];
  subtotalInKobo: number;
  discountInKobo: number;
  deliveryFeeInKobo: number;
  vatInKobo: number;
  totalInKobo: number;
  /** Basis points, e.g. 750 = 7.5%. */
  vatRateBasisPoints: number;
  currency: string;
  totalFormatted: string;
  paymentStatus: OrderPaymentStatus;
  amountPaidInKobo: number;
  outstandingBalanceInKobo: number;
  documentUrl: string | null;
}

/** Mirrors ReceiptDto. */
export interface Receipt {
  id: string;
  receiptNumber: string;
  orderNumber: string;
  issuedAtUtc: string;
  amountPaidInKobo: number;
  amountPaidFormatted: string;
  orderTotalInKobo: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string | null;
  paymentDateUtc: string | null;
  customerName: string;
  customerEmail: string;
  documentUrl: string | null;
}

/* ------------------------------ Payments ------------------------------ */
export type PaymentTransactionStatus =
  | "Pending" | "Initialized" | "Processing" | "Successful" | "Failed" | "Cancelled"
  | "Expired" | "RefundPending" | "Refunded" | "Chargeback";

export type RefundStatus = "Requested" | "Approved" | "Processing" | "Completed" | "Rejected" | "Failed";

export type RefundReason =
  | "CustomerRequest" | "OrderCancelled" | "ItemOutOfStock" | "DamagedOnArrival"
  | "WrongItemSent" | "DeliveryFailed" | "Duplicate" | "Fraudulent" | "Other";

/** Mirrors PaymentInitializationDto. */
export interface PaymentInitialization {
  paymentId: string;
  reference: string;
  /** The hosted gateway page the customer must be sent to. */
  authorizationUrl: string;
  amountInKobo: number;
  amountFormatted: string;
  currency: string;
  provider: string;
  attemptNumber: number;
  expiresAtUtc: string;
}

/** Mirrors PaymentAttemptDto. */
export interface PaymentAttempt {
  id: string;
  attemptNumber: number;
  provider: string;
  reference: string;
  status: PaymentTransactionStatus;
  failureReason: string | null;
  amountPaidInKobo: number | null;
  startedAtUtc: string;
  completedAtUtc: string | null;
}

/** Mirrors PaymentTimelineEventDto. */
export interface PaymentTimelineEntry {
  id: string;
  eventType: string;
  actorType: "Customer" | "Staff" | "System" | "Provider";
  actorName: string | null;
  description: string;
  occurredAtUtc: string;
}

/** Mirrors RefundDto. */
export interface Refund {
  id: string;
  paymentId: string;
  amountInKobo: number;
  amountFormatted: string;
  status: RefundStatus;
  reason: RefundReason;
  notes: string | null;
  rejectionReason: string | null;
  failureReason: string | null;
  requestedAtUtc: string;
  approvedAtUtc: string | null;
  processedAtUtc: string | null;
}

/** Mirrors PaymentDto. */
export interface Payment {
  id: string;
  orderId: string;
  amountInKobo: number;
  amountPaidInKobo: number;
  amountRefundedInKobo: number;
  refundableAmountInKobo: number;
  amountFormatted: string;
  currency: string;
  status: PaymentTransactionStatus;
  provider: string | null;
  reference: string | null;
  paymentChannel: string | null;
  failureReason: string | null;
  isRetryable: boolean;
  verifiedAtUtc: string | null;
  createdAtUtc: string;
  attempts: PaymentAttempt[];
  timeline: PaymentTimelineEntry[];
  refunds: Refund[];
  /** Staff-only: null on customer-facing responses. */
  feesInKobo: number | null;
  providerTransactionId: string | null;
}

/** Mirrors InitializePaymentRequest. */
export interface InitializePaymentRequest {
  orderId: string;
  provider?: string;
  redirectUrl?: string;
}

/* ------------------------------ Customer ------------------------------ */
export type Gender = "Unspecified" | "Male" | "Female" | "Other" | "PreferNotToSay";

/** Mirrors NotificationPreferencesDto / UpdateNotificationPreferencesRequest. */
export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  marketingEmails: boolean;
  orderNotifications: boolean;
  securityNotifications: boolean;
}

/** Mirrors CustomerProfileDto. */
export interface CustomerProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  secondaryPhoneNumber: string | null;
  /** ISO date (yyyy-MM-dd), no time component. */
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender;
  profilePictureUrl: string | null;
  profilePictureThumbnailUrl: string | null;
  profileCompletionPercentage: number;
  emailConfirmed: boolean;
  accountStatus: string;
  referralCode: string;
  referredByCode: string | null;
  referralCount: number;
  notificationPreferences: NotificationPreferences;
  preferencesJson: string | null;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}

/** Shared shape of a customer address, mirrors what Create/Update accept. */
export interface AddressInput {
  recipientName: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  localGovernment?: string;
  streetAddress: string;
  apartmentSuite?: string;
  postalCode?: string;
  landmark?: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
}

/** Mirrors CreateAddressRequest. */
export interface CreateAddressRequest extends AddressInput {
  setAsDefault?: boolean;
}

/** Mirrors UpdateAddressRequest. */
export interface UpdateAddressRequest extends AddressInput {
  isActive?: boolean;
}

/** Mirrors CustomerAddressDto. */
export interface Address {
  id: string;
  recipientName: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  localGovernment: string | null;
  streetAddress: string;
  apartmentSuite: string | null;
  postalCode: string | null;
  landmark: string | null;
  deliveryInstructions: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  isActive: boolean;
  formattedAddress: string;
  createdAtUtc: string;
}

/** Mirrors WishlistItemDto. */
export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  currentPriceInKobo: number;
  currentPriceFormatted: string;
  priceAtAddInKobo: number | null;
  /** Negative when the price has fallen since saving. */
  priceChangeInKobo: number | null;
  hasPriceDropped: boolean;
  inventoryStatus: InventoryStatusValue;
  isPurchasable: boolean;
  note: string | null;
  addedAtUtc: string;
}

export type NotificationType =
  | "OrderUpdate" | "Promotion" | "System" | "SecurityAlert" | "WishlistPriceChange"
  | "BackInStock" | "ReferralReward";

/** Mirrors NotificationDto. */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  referenceId: string | null;
  metadataJson: string | null;
  isRead: boolean;
  readAtUtc: string | null;
  createdAtUtc: string;
}

export type ReferralStatus = "Pending" | "Qualified" | "Completed" | "Void";
export type ReferralRewardStatus = "NotApplicable" | "Pending" | "Issued" | "Revoked";

/** Mirrors ReferralSummaryDto. */
export interface ReferralSummary {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  completedReferrals: number;
}

/** Mirrors ReferralDto. */
export interface Referral {
  id: string;
  referralCode: string;
  referredCustomerName: string;
  status: ReferralStatus;
  rewardStatus: ReferralRewardStatus;
  rewardAmountInKobo: number | null;
  rewardAmountFormatted: string | null;
  referredAtUtc: string;
  qualifiedAtUtc: string | null;
}

/** Mirrors CustomerDashboardDto. */
export interface DashboardOverview {
  customerName: string;
  profilePictureThumbnailUrl: string | null;
  profileCompletionPercentage: number;
  wishlistCount: number;
  addressCount: number;
  unreadNotificationCount: number;
  orderCount: number;
  referralCount: number;
  referralCode: string;
  recentActivity: ActivityEntry[];
}

/** Mirrors CustomerActivityDto. */
export interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  referenceId: string | null;
  occurredAtUtc: string;
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
