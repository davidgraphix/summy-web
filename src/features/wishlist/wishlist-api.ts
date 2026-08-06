import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { WishlistItem } from "@/types/models";

export const wishlistApi = {
  list: (search?: string, pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<WishlistItem>>("/customers/me/wishlist", { params: { search, pageNumber, pageSize } }),
  contains: (productId: string) => api.get<boolean>(`/customers/me/wishlist/contains/${productId}`),
  add: (productId: string, note?: string) =>
    api.post<WishlistItem>("/customers/me/wishlist", { productId, note }),
  remove: (productId: string) => api.delete<void>(`/customers/me/wishlist/${productId}`),
  clear: () => api.delete<void>("/customers/me/wishlist"),
  /** Returns the count of items actually merged (duplicates are skipped). */
  merge: (productIds: string[]) => api.post<number>("/customers/me/wishlist/merge", { productIds }),
};
