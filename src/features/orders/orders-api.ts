import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Order, OrderTimelineEntry, CreateOrderRequest } from "@/types/models";

export const ordersApi = {
  create: (body: CreateOrderRequest) => api.post<Order>("/orders", body),
  list: (pageNumber = 1, pageSize = 10) =>
    api.get<PagedResult<Order>>("/orders", { params: { pageNumber, pageSize } }),
  byId: (id: string) => api.get<Order>(`/orders/${id}`),
  byNumber: (orderNumber: string) => api.get<Order>(`/orders/number/${encodeURIComponent(orderNumber)}`),
  timeline: (id: string) => api.get<OrderTimelineEntry[]>(`/orders/${id}/timeline`),
  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`),
  reorder: (id: string) => api.post<Order>(`/orders/${id}/reorder`),
  invoice: (id: string) => api.get<unknown>(`/orders/${id}/invoice`),
  receipts: (id: string) => api.get<unknown>(`/orders/${id}/receipts`),
  // PDF endpoint returns a file; build a link instead of fetching JSON.
  invoicePdfPath: (id: string) => `/orders/${id}/invoice/pdf`,
};
