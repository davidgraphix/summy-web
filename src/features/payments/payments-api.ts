import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Payment, InitializePaymentRequest, InitializePaymentResult } from "@/types/models";

export const paymentsApi = {
  initialize: (body: InitializePaymentRequest) =>
    api.post<InitializePaymentResult>("/payments/initialize", body),
  verify: (reference: string) => api.post<Payment>(`/payments/verify/${encodeURIComponent(reference)}`),
  retry: (paymentId: string) => api.post<InitializePaymentResult>(`/payments/${paymentId}/retry`),
  list: (pageNumber = 1, pageSize = 10) =>
    api.get<PagedResult<Payment>>("/payments", { params: { pageNumber, pageSize } }),
  byId: (id: string) => api.get<Payment>(`/payments/${id}`),
  byOrder: (orderId: string) => api.get<Payment[]>(`/payments/order/${orderId}`),
};
