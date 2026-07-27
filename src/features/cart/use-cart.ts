"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth-store";
import { useGuestCart } from "./guest-cart-store";
import { useServerCart, useCartMutations } from "./cart-hooks";
import { cartApi } from "./cart-api";
import { qk } from "@/lib/query-keys";
import type { CartItem } from "@/types/models";

/** A normalised view over either the server cart (auth) or guest cart (local). */
export interface UnifiedLine {
  productId: string;
  name: string;
  slug?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
}

export function useCart() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const guest = useGuestCart();
  const serverCart = useServerCart();
  const m = useCartMutations();

  const lines: UnifiedLine[] = useMemo(() => {
    if (isAuth) {
      const items = serverCart.data?.items ?? [];
      return items.map((it: CartItem) => {
        const unit = it.unitPrice ?? it.price ?? 0;
        return {
          productId: it.productId,
          name: it.name ?? "Product",
          slug: it.slug,
          unitPrice: unit,
          quantity: it.quantity,
          lineTotal: it.lineTotal ?? unit * it.quantity,
          imageUrl: it.imageUrl,
        };
      });
    }
    return guest.lines.map((l) => ({
      productId: l.productId,
      name: l.name ?? "Product",
      slug: l.slug,
      unitPrice: l.price ?? 0,
      quantity: l.quantity,
      lineTotal: (l.price ?? 0) * l.quantity,
      imageUrl: l.imageUrl,
    }));
  }, [isAuth, serverCart.data, guest.lines]);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = isAuth ? serverCart.data?.subtotal ?? lines.reduce((s, l) => s + l.lineTotal, 0)
                          : lines.reduce((s, l) => s + l.lineTotal, 0);

  const add = useCallback(
    (line: UnifiedLine) => {
      if (isAuth) m.addItem.mutate({ productId: line.productId, quantity: line.quantity });
      else useGuestCart.getState().add({
        productId: line.productId, quantity: line.quantity,
        name: line.name, slug: line.slug, price: line.unitPrice, imageUrl: line.imageUrl,
      });
    },
    [isAuth, m.addItem]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (isAuth) m.updateItem.mutate({ productId, quantity });
      else useGuestCart.getState().setQuantity(productId, quantity);
    },
    [isAuth, m.updateItem]
  );

  const remove = useCallback(
    (productId: string) => {
      if (isAuth) m.removeItem.mutate(productId);
      else useGuestCart.getState().remove(productId);
    },
    [isAuth, m.removeItem]
  );

  const clear = useCallback(() => {
    if (isAuth) m.clear.mutate();
    else useGuestCart.getState().clear();
  }, [isAuth, m.clear]);

  return {
    isAuth,
    isLoading: isAuth ? serverCart.isLoading : false,
    lines, count, subtotal,
    serverCart: serverCart.data,
    add, setQuantity, remove, clear,
    pending: m.addItem.isPending || m.updateItem.isPending || m.removeItem.isPending || m.clear.isPending,
  };
}

/**
 * Call once after a successful login/register: push guest lines to the server
 * via /cart/merge, then clear the local cart and refresh.
 */
export function useMergeGuestCartOnLogin() {
  const qc = useQueryClient();
  return useCallback(async () => {
    const guest = useGuestCart.getState();
    if (guest.lines.length === 0) return;
    try {
      await cartApi.merge({ items: guest.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) });
      guest.clear();
      qc.invalidateQueries({ queryKey: qk.cart.root });
    } catch {
      // Non-fatal: keep local lines so nothing is lost.
    }
  }, [qc]);
}
