"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { ordersApi, type OrderListQuery } from "./orders-api";
import type { CreateOrderRequest } from "@/types/models";

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
