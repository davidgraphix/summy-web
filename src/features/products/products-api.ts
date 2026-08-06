import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Product, ProductSummary } from "@/types/models";

/** Sort values accepted by ProductSortOption — sent by name, matched server-side. */
export type ProductSortBy = "Newest" | "Oldest" | "PriceLowToHigh" | "PriceHighToLow" | "Alphabetical" | "Popularity";

export interface ProductQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  includeSubcategories?: boolean;
  brandId?: string;
  featured?: boolean;
  /** Kobo. */
  minPrice?: number;
  /** Kobo. */
  maxPrice?: number;
  inStockOnly?: boolean;
  tags?: string[];
  sortBy?: ProductSortBy;
}

export const productsApi = {
  // GET /storefront/products (paginated, public, published-only)
  list: (query: ProductQuery = {}, signal?: AbortSignal) =>
    api.get<PagedResult<ProductSummary>>("/storefront/products", { auth: false, params: { ...query }, signal }),

  // GET /storefront/products/featured
  featured: (pageSize?: number, signal?: AbortSignal) =>
    api.get<PagedResult<ProductSummary>>("/storefront/products/featured", { auth: false, params: { pageSize }, signal }),

  // GET /storefront/products/slug/{slug}
  bySlug: (slug: string, signal?: AbortSignal) =>
    api.get<Product>(`/storefront/products/slug/${encodeURIComponent(slug)}`, { auth: false, signal }),
};
