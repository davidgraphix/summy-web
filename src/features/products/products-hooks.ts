"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { productsApi, type ProductQuery } from "./products-api";

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: qk.products.list(query),
    queryFn: ({ signal }) => productsApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Filters for an infinite listing: everything except the page cursor. */
export type ProductFeedQuery = Omit<ProductQuery, "pageNumber">;

/**
 * Storefront product feed, paged one batch at a time off the existing
 * `/storefront/products` endpoint — the API already returns `hasNextPage`, so
 * no backend change is needed to drive infinite scroll.
 *
 * `filters` is part of the query key, so changing a filter, the search term or
 * the sort starts a genuinely separate cache entry: the feed resets to page one
 * on its own and cannot mix results from two different filter sets.
 */
export function useProductFeed(filters: ProductFeedQuery, pageSize = 24) {
  return useInfiniteQuery({
    queryKey: qk.products.infinite({ ...filters, pageSize }),
    queryFn: ({ pageParam, signal }) =>
      productsApi.list({ ...filters, pageSize, pageNumber: pageParam }, signal),
    initialPageParam: 1,
    // Trust the server's own flag rather than recomputing from totalCount, and
    // return undefined once it is false so React Query stops asking.
    getNextPageParam: (last) => (last.hasNextPage ? last.pageNumber + 1 : undefined),
  });
}

export function useFeaturedProducts(pageSize?: number) {
  return useQuery({
    queryKey: qk.products.featured,
    queryFn: ({ signal }) => productsApi.featured(pageSize, signal),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: qk.products.bySlug(slug),
    queryFn: ({ signal }) => productsApi.bySlug(slug, signal),
    enabled: !!slug,
  });
}
