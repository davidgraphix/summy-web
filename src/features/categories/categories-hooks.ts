"use client";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { categoriesApi } from "./categories-api";

export function useCategories() {
  return useQuery({ queryKey: qk.categories.all, queryFn: ({ signal }) => categoriesApi.list(signal), staleTime: 10 * 60_000 });
}
export function useCategoryTree() {
  return useQuery({ queryKey: qk.categories.tree, queryFn: ({ signal }) => categoriesApi.tree(signal), staleTime: 10 * 60_000 });
}
