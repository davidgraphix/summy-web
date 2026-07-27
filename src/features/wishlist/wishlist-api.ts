import { api } from "@/lib/api-client";
import type { WishlistItem } from "@/types/models";

export const wishlistApi = {
  list: () => api.get<WishlistItem[]>("/customers/me/wishlist"),
  add: (productId: string) => api.post<void>("/customers/me/wishlist", { productId }),
  remove: (productId: string) => api.delete<void>(`/customers/me/wishlist/${productId}`),
  merge: (productIds: string[]) => api.post<void>("/customers/me/wishlist/merge", { productIds }), // TODO confirm body
};
