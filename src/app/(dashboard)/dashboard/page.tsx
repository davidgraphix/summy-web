"use client";

import Link from "next/link";
import { Activity, Heart, Package, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatNaira, formatDate, formatDateTime } from "@/lib/format";
import { useDashboard, useActivity, useProfile } from "@/features/customer/customer-hooks";
import { useOrders } from "@/features/orders/orders-hooks";

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: overview, isLoading, isError, refetch } = useDashboard();
  const { data: activity } = useActivity();
  // Fall back to the orders list if the dashboard DTO doesn't embed recent orders.
  const orders = useOrders(1);

  const greetingName = profile?.firstName ?? profile?.fullName ?? "there";
  const recentOrders = overview?.recentOrders ?? orders.data?.items ?? [];

  if (isLoading) return <LoadingState label="Loading your dashboard…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Hi, {greetingName} 👋</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Package size={18} />} label="Orders"
          value={overview?.orderCount ?? orders.data?.totalCount ?? 0} />
        <Stat icon={<Wallet size={18} />} label="Total spent"
          value={typeof overview?.totalSpent === "number" ? formatNaira(overview.totalSpent) : "—"} />
        <Stat icon={<Heart size={18} />} label="Wishlist"
          value={overview?.wishlistCount ?? "—"} />
        <Stat icon={<Activity size={18} />} label="Unread alerts"
          value={overview?.unreadNotifications ?? "—"} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">View all</Link>
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
              {recentOrders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:text-primary">
                    <div>
                      <p className="font-semibold">{o.orderNumber ? `#${o.orderNumber}` : `Order ${o.id.slice(0, 8)}`}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="font-bold">{formatNaira(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!!activity?.length && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-lg font-bold">Recent activity</h2>
            <ul className="space-y-3">
              {activity.slice(0, 8).map((a, i) => (
                <li key={a.id ?? i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="font-medium">{a.description ?? a.type ?? "Activity"}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.occurredAt)}</p>
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
