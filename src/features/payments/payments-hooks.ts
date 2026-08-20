"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { ApiRequestError } from "@/lib/api-client";
import { paymentsApi } from "./payments-api";
import type { InitializePaymentRequest, PaymentInitialization } from "@/types/models";

export function useInitializePayment() {
  return useMutation({ mutationFn: (body: InitializePaymentRequest) => paymentsApi.initialize(body) });
}

/**
 * Error codes the callback screen has to tell apart. A payment the gateway has
 * not finished processing is not a failed payment, and must never be presented
 * as one to someone whose account has already been debited.
 */
export const PAYMENT_UNDER_REVIEW = "payment.amount_mismatch";
export const PAYMENT_NOT_FOUND = "payment.transaction_not_found";

/**
 * Verifies a payment server-side after the gateway redirect.
 *
 * <p>
 * Bank transfers are the reason for the backoff. Card payments verify instantly,
 * but a transfer can take several seconds to reach Flutterwave and longer for the
 * webhook to arrive, so the first verify frequently reports "still pending". The
 * retry schedule below covers roughly 45 seconds — long enough for the common
 * case, short enough that nobody watches a spinner forever — and backs off rather
 * than hammering the API, which also protects the endpoint's rate limit.
 * </p>
 */
export function useVerifyPayment(reference: string) {
  return useQuery({
    queryKey: ["payments", "verify", reference],
    queryFn: () => paymentsApi.verify(reference),
    enabled: !!reference,

    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError) {
        // A flagged amount is a settled decision needing a human, and a 4xx
        // other than "not found yet" will not change on retry. Retrying either
        // just delays telling the customer something true.
        if (error.error?.code === PAYMENT_UNDER_REVIEW) return false;
        if (error.status === 401 || error.status === 403) return false;
      }
      return failureCount < 5;
    },

    // 1.5s, 3s, 6s, 12s, 20s — exponential, capped.
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 20_000),
  });
}

export function usePaymentsByOrder(orderId: string) {
  return useQuery({ queryKey: qk.payments.byOrder(orderId), queryFn: () => paymentsApi.byOrder(orderId), enabled: !!orderId });
}

/** The hosted Flutterwave checkout page the customer must be redirected to. */
export function resolvePaymentLink(r: Pick<PaymentInitialization, "authorizationUrl"> | null | undefined) {
  return r?.authorizationUrl ?? null;
}
