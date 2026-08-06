"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { productsApi, type ProductQuery } from "./products-api";

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: qk.products.list(query),
    queryFn: ({ signal }) => productsApi.list(query, signal),
    placeholderData: keepPreviousData,
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
