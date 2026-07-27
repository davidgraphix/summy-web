"use client";

import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, Ban, CheckCircle2, Clock, Package,
  ShoppingCart, TrendingUp, Users, Wallet, XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatCard } from "@/features/admin/components/stat-card";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { ErrorState } from "@/components/shared/states";
import {
  RevenueTrendChart, OrdersBarChart, GrowthLineChart,
  HorizontalBarChart, DistributionPieChart,
} from "@/features/admin/components/charts";
import {
  useAdminDashboard, useSalesAnalytics, useCustomerAnalytics,
  useProductAnalytics, usePaymentAnalytics,
} from "@/features/admin/admin-hooks";
import { formatNaira, formatDate, formatDateTime } from "@/lib/format";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const sales = useSalesAnalytics();
  const customers = useCustomerAnalytics();
  const products = useProductAnalytics();
  const payments = usePaymentAnalytics();

  if (isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState onRetry={() => refetch()} message="We couldn't load your dashboard metrics." />
      </>
    );
  }

  const orderStatusData = [
    { name: "Pending", value: data?.pendingOrders ?? 0 },
    { name: "Completed", value: data?.completedOrders ?? 0 },
    { name: "Cancelled", value: data?.cancelledOrders ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Store performance at a glance."
        actions={
          <Link href="/admin/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View all orders <ArrowUpRight size={15} />
          </Link>
        }
      />

      {/* Primary metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" loading={isLoading} icon={<Wallet size={18} />}
          value={formatNaira(data?.totalRevenue)} delta={data?.revenueGrowth ?? null} hint="vs. previous period" />
        <StatCard label="Today's revenue" loading={isLoading} icon={<TrendingUp size={18} />}
          value={formatNaira(data?.todayRevenue)} tone="success" />
        <StatCard label="Orders" loading={isLoading} icon={<ShoppingCart size={18} />}
          value={(data?.totalOrders ?? 0).toLocaleString()} />
        <StatCard label="Average order value" loading={isLoading} icon={<Wallet size={18} />}
          value={formatNaira(data?.averageOrderValue)} />
      </div>

      {/* Operational metrics */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending orders" loading={isLoading} icon={<Clock size={18} />} tone="warning"
          value={(data?.pendingOrders ?? 0).toLocaleString()} />
        <StatCard label="Completed" loading={isLoading} icon={<CheckCircle2 size={18} />} tone="success"
          value={(data?.completedOrders ?? 0).toLocaleString()} />
        <StatCard label="Cancelled" loading={isLoading} icon={<Ban size={18} />} tone="danger"
          value={(data?.cancelledOrders ?? 0).toLocaleString()} />
        <StatCard label="Customers" loading={isLoading} icon={<Users size={18} />}
          value={(data?.totalCustomers ?? 0).toLocaleString()} />
      </div>

      {/* Catalog health */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatCard label="Products" loading={isLoading} icon={<Package size={18} />}
          value={(data?.totalProducts ?? 0).toLocaleString()} />
        <StatCard label="Low stock" loading={isLoading} icon={<AlertTriangle size={18} />} tone="warning"
          value={(data?.lowStockCount ?? 0).toLocaleString()} hint="Needs restocking" />
        <StatCard label="Out of stock" loading={isLoading} icon={<XCircle size={18} />} tone="danger"
          value={(data?.outOfStockCount ?? 0).toLocaleString()} hint="Unavailable to buy" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={sales.data?.series} subtitle="Revenue over time" />
        </div>
        <OrdersBarChart data={sales.data?.series} subtitle="Order volume by period" />
        <GrowthLineChart data={customers.data?.series ?? customers.data?.growth} subtitle="New customers over time" />
        <HorizontalBarChart title="Top selling products" subtitle="By units sold"
          data={products.data?.topSelling ?? sales.data?.topProducts} />
        <HorizontalBarChart title="Sales by category" subtitle="Revenue contribution" currency
          data={products.data?.byCategory ?? sales.data?.byCategory} />
        <DistributionPieChart title="Payment distribution" subtitle="By provider"
          data={payments.data?.byProvider ?? payments.data?.byStatus} currency />
        <DistributionPieChart title="Order status" subtitle="Current breakdown" data={orderStatusData} />
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RecentOrders orders={data?.recentOrders} loading={isLoading} />
        <RecentPayments payments={data?.recentPayments} loading={isLoading} />
        <RecentCustomers customers={data?.recentCustomers} loading={isLoading} />
        <RecentActivity entries={data?.recentActivity} loading={isLoading} />
      </div>
    </>
  );
}

function Panel({ title, href, linkLabel, children }: {
  title: string; href?: string; linkLabel?: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold tracking-tight">{title}</h3>
          {href && <Link href={href} className="text-sm font-medium text-primary hover:underline">{linkLabel ?? "View all"}</Link>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Rows({ loading, empty, children }: { loading?: boolean; empty: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
      </div>
    );
  }
  if (empty) return <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show yet.</p>;
  return <ul className="divide-y divide-border">{children}</ul>;
}

function RecentOrders({ orders, loading }: { orders?: import("@/types/models").Order[]; loading?: boolean }) {
  return (
    <Panel title="Recent orders" href="/admin/orders">
      <Rows loading={loading} empty={!orders?.length}>
        {orders?.slice(0, 5).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{o.orderNumber ? `#${o.orderNumber}` : o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={o.status} />
                <span className="text-sm font-bold">{formatNaira(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentPayments({ payments, loading }: { payments?: import("@/types/models").Payment[]; loading?: boolean }) {
  return (
    <Panel title="Recent payments" href="/admin/payments">
      <Rows loading={loading} empty={!payments?.length}>
        {payments?.slice(0, 5).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.reference ?? p.id.slice(0, 12)}</p>
              <p className="text-xs text-muted-foreground">{p.provider ?? "Flutterwave"} · {formatDate(p.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={p.status} />
              <span className="text-sm font-bold">{formatNaira(p.amount)}</span>
            </div>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentCustomers({ customers, loading }: {
  customers?: import("@/features/admin/admin-types").AdminCustomerSummary[]; loading?: boolean;
}) {
  return (
    <Panel title="Recent customers" href="/admin/customers">
      <Rows loading={loading} empty={!customers?.length}>
        {customers?.slice(0, 5).map((c) => (
          <li key={c.id}>
            <Link href={`/admin/customers/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {c.fullName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? c.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
            </Link>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentActivity({ entries, loading }: {
  entries?: import("@/features/admin/admin-types").AuditLogEntry[]; loading?: boolean;
}) {
  return (
    <Panel title="Recent activity" href="/admin/audit-logs">
      <Rows loading={loading} empty={!entries?.length}>
        {entries?.slice(0, 6).map((a, i) => (
          <li key={a.id ?? i} className="flex gap-3 py-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0">
              <p className="truncate text-sm">
                <span className="font-medium">{a.actorName ?? a.actorEmail ?? "System"}</span>{" "}
                <span className="text-muted-foreground">{a.description ?? a.action}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(a.occurredAt ?? a.createdAt)}</p>
            </div>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}
