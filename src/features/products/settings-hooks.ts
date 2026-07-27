"use client";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { settingsApi } from "./settings-api";

export function useStorefrontSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: ({ signal }) => settingsApi.get(signal), staleTime: 30 * 60_000 });
}
