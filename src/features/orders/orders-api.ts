import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type {
  CheckoutQuote, CheckoutQuoteRequest, CreateOrderRequest, DeliveryRate, Invoice, Order,
  OrderPaymentStatus, OrderStatus, OrderSummary, OrderTimelineEntry, Receipt,
} from "@/types/models";

export interface OrderListQuery {
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  pageNumber?: number;
  pageSize?: number;
}

export const ordersApi = {
  create: (body: CreateOrderRequest) => api.post<Order>("/orders", body),
  /** Server-side costing for a delivery choice. Creates nothing. */
  quote: (body: CheckoutQuoteRequest) => api.post<CheckoutQuote>("/orders/quote", body),
  /** Published per-state delivery prices. Anonymous endpoint. */
  deliveryRates: () => api.get<DeliveryRate[]>("/delivery-rates", { auth: false }),
  list: (query: OrderListQuery = {}) =>
    api.get<PagedResult<OrderSummary>>("/orders", { params: { pageNumber: 1, pageSize: 10, ...query } }),
  byId: (id: string) => api.get<Order>(`/orders/${id}`),
  byNumber: (orderNumber: string) => api.get<Order>(`/orders/number/${encodeURIComponent(orderNumber)}`),
  timeline: (id: string) => api.get<OrderTimelineEntry[]>(`/orders/${id}/timeline`),
  cancel: (id: string, reason: string) => api.post<void>(`/orders/${id}/cancel`, { reason }),
  reorder: (id: string) => api.post<Order>(`/orders/${id}/reorder`),
  invoice: (id: string) => api.get<Invoice>(`/orders/${id}/invoice`),
  receipts: (id: string) => api.get<Receipt[]>(`/orders/${id}/receipts`),
  // PDF endpoints return a file; build a link instead of fetching JSON.
  invoicePdfPath: (id: string) => `/orders/${id}/invoice/pdf`,
  receiptPdfPath: (id: string, receiptNumber: string) =>
    `/orders/${id}/receipts/${encodeURIComponent(receiptNumber)}/pdf`,
};
