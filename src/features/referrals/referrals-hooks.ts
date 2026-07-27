"use client";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { referralsApi } from "./referrals-api";

export function useReferrals() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.referrals, queryFn: () => referralsApi.list(), enabled: isAuth });
}
export function useReferralSummary() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.referralSummary, queryFn: () => referralsApi.summary(), enabled: isAuth });
}
