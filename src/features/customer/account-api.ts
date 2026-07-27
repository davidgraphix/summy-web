import { api } from "@/lib/api-client";
import type { UserSession, LoginHistoryEntry } from "@/types/models";

export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }

export const accountApi = {
  changePassword: (body: ChangePasswordRequest) => api.post<void>("/account/change-password", body),
  logoutAll: () => api.post<void>("/account/logout-all"),
  logoutOthers: () => api.post<void>("/account/logout-other-devices"),
  sessions: () => api.get<UserSession[]>("/account/sessions"),
  revokeSession: (id: string) => api.delete<void>(`/account/sessions/${id}`),
  loginHistory: () => api.get<LoginHistoryEntry[]>("/account/login-history"),
};
