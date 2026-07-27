"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { notificationsApi } from "./notifications-api";

export function useNotifications() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.notifications.list, queryFn: () => notificationsApi.list(), enabled: isAuth });
}
export function useUnreadCount() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuth,
    refetchInterval: 60_000,
  });
}
export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.notifications.list });
    qc.invalidateQueries({ queryKey: qk.notifications.unreadCount });
  };
  return {
    markRead: useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: invalidate }),
  };
}
