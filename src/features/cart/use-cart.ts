"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth-store";
import { useServerCart, useCartMutations } from "./cart-hooks";
import { cartApi } from "./cart-api";
import { getGuestCartKey, clearGuestCartKey } from "./cart-key";
import { qk } from "@/lib/query-keys";

/**
 * The cart is always server-backed — guests are identified by the X-Cart-Key
 * header (see cart-api.ts), signed-in customers by their access token. There
 * is no local cart state to reconcile.
 */
export function useCart() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const serverCart = useServerCart();
  const m = useCartMutations();

  const lines = serverCart.data?.items ?? [];
  const count = serverCart.data?.totalQuantity ?? 0;

  const add = useCallback(
    (item: { productId: string; quantity: number }) => m.addItem.mutate(item),
    [m.addItem]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => m.updateItem.mutate({ productId, quantity }),
    [m.updateItem]
  );

  const remove = useCallback((productId: string) => m.removeItem.mutate(productId), [m.removeItem]);
  const clear = useCallback(() => m.clear.mutate(), [m.clear]);

  return {
    isAuth,
    isLoading: serverCart.isLoading,
    lines,
    count,
    cart: serverCart.data,
    add, setQuantity, remove, clear,
    pending: m.addItem.isPending || m.updateItem.isPending || m.removeItem.isPending || m.clear.isPending,
  };
}

/**
 * Call once after a successful login/register: merges the guest cart (keyed by
 * the browser's X-Cart-Key) into the customer's cart via POST /cart/merge,
 * then rotates to a fresh guest key for any future signed-out session.
 */
export function useMergeGuestCartOnLogin() {
  const qc = useQueryClient();
  return useCallback(async () => {
    const anonymousId = getGuestCartKey();
    if (!anonymousId) return;
    try {
      await cartApi.merge({ anonymousId });
    } catch {
      // Non-fatal: the customer's own cart is still usable even if nothing merged.
    } finally {
      clearGuestCartKey();
      qc.invalidateQueries({ queryKey: qk.cart.root });
    }
  }, [qc]);
}
