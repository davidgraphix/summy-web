"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { cartApi, type AddItemRequest } from "./cart-api";
import type { Cart } from "@/types/models";

/**
 * The cart lives server-side for both guests (keyed by X-Cart-Key) and
 * signed-in customers (keyed by the access token) — see CartController — so
 * this is always enabled, no auth gate needed.
 */
export function useServerCart() {
  return useQuery({
    queryKey: qk.cart.root,
    queryFn: () => cartApi.get(),
  });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const invalidate = (cart?: Cart) => {
    if (cart) qc.setQueryData(qk.cart.root, cart);
    qc.invalidateQueries({ queryKey: qk.cart.root });
    qc.invalidateQueries({ queryKey: qk.cart.summary });
  };

  const addItem = useMutation({
    mutationFn: (body: AddItemRequest) => cartApi.addItem(body),
    onSuccess: (cart) => { invalidate(cart); toast.success("Added to cart"); },
    onError: (e: Error) => toast.error(e.message || "Could not add to cart"),
  });

  const updateItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.updateItem(productId, { quantity }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => cartApi.removeItem(productId),
    onSuccess: (cart) => { invalidate(cart); toast.success("Removed from cart"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const addFromWishlist = useMutation({
    mutationFn: (productId: string) => cartApi.addFromWishlist(productId),
    onSuccess: (cart) => { invalidate(cart); toast.success("Moved to cart"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { addItem, updateItem, removeItem, clear, addFromWishlist };
}
