"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { paymentsApi } from "./payments-api";
import type { InitializePaymentRequest, PaymentInitialization } from "@/types/models";

export function useInitializePayment() {
  return useMutation({ mutationFn: (body: InitializePaymentRequest) => paymentsApi.initialize(body) });
}
export function useVerifyPayment(reference: string) {
  // Flutterwave redirect returns here with a reference; verify once on mount.
  return useQuery({
    queryKey: ["payments", "verify", reference],
    queryFn: () => paymentsApi.verify(reference),
    enabled: !!reference,
    retry: 3,
    retryDelay: 1500,
  });
}
export function usePaymentsByOrder(orderId: string) {
  return useQuery({ queryKey: qk.payments.byOrder(orderId), queryFn: () => paymentsApi.byOrder(orderId), enabled: !!orderId });
}

/** The hosted Flutterwave checkout page the customer must be redirected to. */
export function resolvePaymentLink(r: Pick<PaymentInitialization, "authorizationUrl"> | null | undefined) {
  return r?.authorizationUrl ?? null;
}
