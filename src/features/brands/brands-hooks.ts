"use client";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { brandsApi } from "./brands-api";

export function useBrands() {
  return useQuery({ queryKey: qk.brands.all, queryFn: ({ signal }) => brandsApi.list(signal), staleTime: 10 * 60_000 });
}
