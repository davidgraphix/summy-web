import { api } from "@/lib/api-client";
import type { Cart, CartSummary } from "@/types/models";

export interface AddItemRequest { productId: string; quantity: number; }
export interface UpdateItemRequest { quantity: number; }
/** Guest lines pushed to the server on login. TODO: confirm merge body shape. */
export interface MergeCartRequest { items: AddItemRequest[]; }

export const cartApi = {
  get: () => api.get<Cart>("/cart"),
  summary: () => api.get<CartSummary>("/cart/summary"),
  addItem: (body: AddItemRequest) => api.post<Cart>("/cart/items", body),
  updateItem: (productId: string, body: UpdateItemRequest) =>
    api.put<Cart>(`/cart/items/${productId}`, body),
  removeItem: (productId: string) => api.delete<Cart>(`/cart/items/${productId}`),
  clear: () => api.delete<void>("/cart"),
  merge: (body: MergeCartRequest) => api.post<Cart>("/cart/merge", body),
  addFromWishlist: (productId: string) => api.post<Cart>(`/cart/from-wishlist/${productId}`),
};
