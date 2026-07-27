import { api } from "@/lib/api-client";
import type { Referral, ReferralSummary } from "@/types/models";

export const referralsApi = {
  list: () => api.get<Referral[]>("/customers/me/referrals"),
  summary: () => api.get<ReferralSummary>("/customers/me/referrals/summary"),
};
