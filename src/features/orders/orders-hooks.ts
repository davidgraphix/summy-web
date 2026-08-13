"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { ordersApi, type OrderListQuery } from "./orders-api";
import type { CheckoutQuoteRequest, CreateOrderRequest } from "@/types/models";

/**
 * Live costing for the checkout page.
 *
 * Keyed on the delivery choice and destination, so switching between pickup and
 * delivery, or changing state, re-quotes automatically and the displayed total
 * is never a stale one. `enabled` keeps it quiet until there is actually
 * something to price.
 */
export function useCheckoutQuote(request: CheckoutQuoteRequest | null) {
  return useQuery({
    queryKey: qk.orders.quote(request),
    queryFn: () => ordersApi.quote(request!),
    enabled: !!request && request.items.length > 0,

    // A quote is a price the customer is about to act on. Refetch it rather
    // than serving one that may predate a rate change.
    staleTime: 0,
  });
}

export function useDeliveryRates() {
  return useQuery({
    queryKey: qk.orders.deliveryRates,
    queryFn: () => ordersApi.deliveryRates(),

    // Staff change these rarely; an hour of caching avoids refetching a
    // 37-row table on every checkout visit.
    staleTime: 60 * 60_000,
  });
}

export function useOrders(query: OrderListQuery = {}) {
  return useQuery({ queryKey: qk.orders.list(query.pageNumber ?? 1), queryFn: () => ordersApi.list(query) });
}
export function useOrder(id: string) {
  return useQuery({ queryKey: qk.orders.detail(id), queryFn: () => ordersApi.byId(id), enabled: !!id });
}
export function useOrderTimeline(id: string) {
  return useQuery({ queryKey: qk.orders.timeline(id), queryFn: () => ordersApi.timeline(id), enabled: !!id });
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderRequest) => ordersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart.root }),
    onError: (e: Error) => toast.error(e.message || "Could not create order"),
  });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ordersApi.cancel(id, reason),
    onSuccess: (_o, { id }) => {
      qc.invalidateQueries({ queryKey: qk.orders.detail(id) });
      qc.invalidateQueries({ queryKey: qk.orders.all });
      toast.success("Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.reorder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.cart.root }); toast.success("Items added to cart"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
