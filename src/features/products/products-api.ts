import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Product } from "@/types/models";

export interface ProductQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  /** e.g. "price_asc" | "price_desc" | "rating_desc". TODO confirm accepted sort values. */
  sort?: string;
}

export const productsApi = {
  // GET /storefront/products (paginated, public)
  list: (query: ProductQuery = {}, signal?: AbortSignal) =>
    api.get<PagedResult<Product>>("/storefront/products", { auth: false, params: { ...query }, signal }),

  // GET /storefront/products/featured
  featured: (signal?: AbortSignal) =>
    api.get<Product[]>("/storefront/products/featured", { auth: false, signal }),

  // GET /storefront/products/slug/{slug}
  bySlug: (slug: string, signal?: AbortSignal) =>
    api.get<Product>(`/storefront/products/slug/${encodeURIComponent(slug)}`, { auth: false, signal }),
};
