"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { paymentsApi } from "./payments-api";
import type { InitializePaymentRequest } from "@/types/models";

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

/** Resolve the hosted-checkout redirect URL across possible field names. */
export function resolvePaymentLink(r: { paymentLink?: string; authorizationUrl?: string; link?: string } | null | undefined) {
  return r?.paymentLink ?? r?.authorizationUrl ?? r?.link ?? null;
}
