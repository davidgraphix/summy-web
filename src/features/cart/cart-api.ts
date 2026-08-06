import { api } from "@/lib/api-client";
import type { Cart, CartSummary } from "@/types/models";
import { getGuestCartKey } from "./cart-key";
import { useAuthStore } from "@/features/auth/auth-store";

export interface AddItemRequest { productId: string; quantity: number; }
export interface UpdateItemRequest { quantity: number; }
/** Mirrors MergeCartRequest — the whole anonymous cart merges server-side by its key. */
export interface MergeCartRequest { anonymousId: string; }

/**
 * Attaches X-Cart-Key when there's no signed-in user, so the backend can
 * resolve an anonymous cart (see CartController.ResolveOwner). Ignored by the
 * server whenever a bearer token is present — the authenticated user always
 * wins, so this is safe to send unconditionally.
 */
function cartHeaders(): Record<string, string> {
  return useAuthStore.getState().isAuthenticated ? {} : { "X-Cart-Key": getGuestCartKey() };
}

export const cartApi = {
  get: () => api.get<Cart>("/cart", { headers: cartHeaders() }),
  summary: () => api.get<CartSummary>("/cart/summary", { headers: cartHeaders() }),
  addItem: (body: AddItemRequest) => api.post<Cart>("/cart/items", body, { headers: cartHeaders() }),
  updateItem: (productId: string, body: UpdateItemRequest) =>
    api.put<Cart>(`/cart/items/${productId}`, body, { headers: cartHeaders() }),
  removeItem: (productId: string) => api.delete<Cart>(`/cart/items/${productId}`, { headers: cartHeaders() }),
  clear: () => api.delete<void>("/cart", { headers: cartHeaders() }),
  merge: (body: MergeCartRequest) => api.post<Cart>("/cart/merge", body),
  addFromWishlist: (productId: string) => api.post<Cart>(`/cart/from-wishlist/${productId}`),
};
