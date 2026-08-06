import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Referral, ReferralSummary } from "@/types/models";

export const referralsApi = {
  list: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<Referral>>("/customers/me/referrals", { params: { pageNumber, pageSize } }),
  summary: () => api.get<ReferralSummary>("/customers/me/referrals/summary"),
};
