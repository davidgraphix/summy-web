"use client";

import Link from "next/link";
import { Activity, Heart, Package, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { useDashboard, useActivity, useProfile } from "@/features/customer/customer-hooks";
import { useOrders } from "@/features/orders/orders-hooks";

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: overview, isLoading, isError, refetch } = useDashboard();
  const { data: activity } = useActivity();
  // CustomerDashboardDto has no recent-orders list — pull the first page separately.
  const orders = useOrders({ pageNumber: 1, pageSize: 5 });

  const greetingName = profile?.firstName ?? "there";
  const recentOrders = orders.data?.items ?? [];

  if (isLoading) return <LoadingState label="Loading your dashboard…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Hi, {greetingName} 👋</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/*
        Two columns from the narrowest phone up. At 320px that gives each card
        ~146px, which comfortably fits the icon, label and figure; one column
        would leave a card the width of the screen holding a single number, and
        four would crush them.
      */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Package size={18} />} label="Orders"
          value={overview?.orderCount ?? orders.data?.totalCount ?? 0} />
        <Stat icon={<Heart size={18} />} label="Wishlist"
          value={overview?.wishlistCount ?? "—"} />
        <Stat icon={<Activity size={18} />} label="Unread alerts"
          value={overview?.unreadNotificationCount ?? "—"} />
        <Stat icon={<Users size={18} />} label="Referrals"
          value={overview?.referralCount ?? "—"} />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <h2 className="text-base font-bold sm:text-lg">Recent orders</h2>
            {/* -mr-2 keeps the enlarged tap area from pushing the card padding out. */}
            <Link
              href="/dashboard/orders"
              className="-mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={<Package size={28} />}
              title="No orders yet"
              description="When you place an order it'll show up here."
              action={<Link href="/" className={buttonVariants()}>Start shopping</Link>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  {/*
                    min-w-0 + truncate on the left column: an order number and
                    date must not push the status badge and total off the row on
                    a narrow screen.
                  */}
                  <Link href={`/dashboard/orders/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-3 transition-colors hover:text-primary">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">#{o.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(o.placedAtUtc)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="font-bold">{o.totalFormatted}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!!activity?.items.length && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h2 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">Recent activity</h2>
            <ul className="space-y-3">
              {activity.items.slice(0, 8).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0">
                    <p className="break-words font-medium">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.occurredAtUtc)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
