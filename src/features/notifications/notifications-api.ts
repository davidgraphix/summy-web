import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Notification } from "@/types/models";

export interface UnreadCount { unreadCount: number }

export const notificationsApi = {
  list: (unreadOnly = false, search?: string, pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<Notification>>("/customers/me/notifications", { params: { unreadOnly, search, pageNumber, pageSize } }),
  unreadCount: () => api.get<UnreadCount>("/customers/me/notifications/unread-count"),
  markRead: (id: string) => api.patch<void>(`/customers/me/notifications/${id}/read`),
  markAllRead: () => api.patch<void>("/customers/me/notifications/read-all"),
};
