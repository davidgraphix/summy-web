import { api } from "@/lib/api-client";
import type { MessageResponse } from "@/features/auth/auth-types";
import type { UserSession, LoginHistoryEntry } from "@/types/models";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const accountApi = {
  changePassword: (body: ChangePasswordRequest) => api.post<MessageResponse>("/account/change-password", body),
  logoutAll: () => api.post<void>("/account/logout-all"),
  logoutOthers: () => api.post<void>("/account/logout-other-devices"),
  sessions: () => api.get<UserSession[]>("/account/sessions"),
  revokeSession: (id: string) => api.delete<void>(`/account/sessions/${id}`),
  loginHistory: (take?: number) => api.get<LoginHistoryEntry[]>("/account/login-history", { params: { take } }),
};
