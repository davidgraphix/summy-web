import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type { Notification } from "@/types/models";

export const notificationsApi = {
  list: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<Notification>>("/customers/me/notifications", { params: { pageNumber, pageSize } }),
  unreadCount: () => api.get<{ count: number }>("/customers/me/notifications/unread-count"), // TODO confirm shape (number vs {count})
  markRead: (id: string) => api.patch<void>(`/customers/me/notifications/${id}/read`),
  markAllRead: () => api.patch<void>("/customers/me/notifications/read-all"),
};
