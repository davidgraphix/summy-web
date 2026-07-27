"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNotifications, useNotificationMutations, useUnreadCount } from "@/features/notifications/notifications-hooks";

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const unread = useUnreadCount();
  const m = useNotificationMutations();

  const unreadCount = unread.data?.count ?? 0;
  const items = data?.items ?? [];

  if (isLoading) return <LoadingState label="Loading notifications…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => m.markAllRead.mutate()} disabled={m.markAllRead.isPending}>
            <CheckCheck size={16} /> Mark all as read
          </Button>
        )}
      </div>

      {!items.length ? (
        <Card><CardContent className="p-5">
          <EmptyState
            icon={<Bell size={28} />}
            title="No notifications yet"
            description="Order updates and account alerts will appear here."
          />
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const isUnread = n.isRead === false;
            return (
              <Card key={n.id} className={cn(isUnread && "border-primary/30 bg-primary/[0.03]")}>
                <CardContent className="flex gap-3 p-4">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", isUnread ? "bg-primary" : "bg-border")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className={cn("text-sm", isUnread ? "font-bold" : "font-medium")}>
                        {n.title ?? "Notification"}
                      </p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                    </div>
                    {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                    {isUnread && (
                      <button onClick={() => m.markRead.mutate(n.id)} disabled={m.markRead.isPending}
                        className="mt-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                        Mark as read
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
