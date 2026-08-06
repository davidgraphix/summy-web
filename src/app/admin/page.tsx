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
  HorizontalBarChart, DistributionPieChart, type ChartPoint,
} from "@/features/admin/components/charts";
import {
  useAdminDashboard, useSalesAnalytics, useCustomerAnalytics,
  useProductAnalytics, usePaymentAnalytics,
} from "@/features/admin/admin-hooks";
import {
  seriesToRevenue, seriesToCount, topProductsToRevenue, topCategoriesToRevenue,
  topCustomersToSpend, recordToChartPoints,
} from "@/features/admin/chart-helpers";
import { formatDate, formatDateTime } from "@/lib/format";
import type { RecentActivity, RecentCustomer, RecentOrder, RecentPayment } from "@/features/admin/admin-types";

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

  const orderStatusData: ChartPoint[] = [
    { x: "Pending", y: data?.orders.pendingOrders ?? 0 },
    { x: "Completed", y: data?.orders.completedOrders ?? 0 },
    { x: "Cancelled", y: data?.orders.cancelledOrders ?? 0 },
  ].filter((d) => d.y > 0);

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
          value={data?.revenue.totalRevenueFormatted ?? "₦0"}
          delta={sales.data?.growthPercentage != null ? Number(sales.data.growthPercentage) : null}
          hint="vs. previous period" />
        <StatCard label="Today's revenue" loading={isLoading} icon={<TrendingUp size={18} />}
          value={data?.revenue.revenueTodayFormatted ?? "₦0"} tone="success" />
        <StatCard label="Orders" loading={isLoading} icon={<ShoppingCart size={18} />}
          value={(data?.orders.totalOrders ?? 0).toLocaleString()} />
        <StatCard label="Average order value" loading={isLoading} icon={<Wallet size={18} />}
          value={data?.orders.averageOrderValueFormatted ?? "₦0"} />
      </div>

      {/* Operational metrics */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending orders" loading={isLoading} icon={<Clock size={18} />} tone="warning"
          value={(data?.orders.pendingOrders ?? 0).toLocaleString()} />
        <StatCard label="Completed" loading={isLoading} icon={<CheckCircle2 size={18} />} tone="success"
          value={(data?.orders.completedOrders ?? 0).toLocaleString()} />
        <StatCard label="Cancelled" loading={isLoading} icon={<Ban size={18} />} tone="danger"
          value={(data?.orders.cancelledOrders ?? 0).toLocaleString()} />
        <StatCard label="Customers" loading={isLoading} icon={<Users size={18} />}
          value={(data?.customers.totalCustomers ?? 0).toLocaleString()} />
      </div>

      {/* Catalog health */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatCard label="Products" loading={isLoading} icon={<Package size={18} />}
          value={(data?.catalog.totalProducts ?? 0).toLocaleString()} />
        <StatCard label="Low stock" loading={isLoading} icon={<AlertTriangle size={18} />} tone="warning"
          value={(data?.catalog.lowStockProducts ?? 0).toLocaleString()} hint="Needs restocking" />
        <StatCard label="Out of stock" loading={isLoading} icon={<XCircle size={18} />} tone="danger"
          value={(data?.catalog.outOfStockProducts ?? 0).toLocaleString()} hint="Unavailable to buy" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={seriesToRevenue(sales.data?.series)} subtitle="Revenue over time" />
        </div>
        <OrdersBarChart data={seriesToCount(sales.data?.series)} subtitle="Order volume by period" />
        <GrowthLineChart data={seriesToCount(customers.data?.registrationSeries)} subtitle="New customers over time" />
        <HorizontalBarChart title="Top selling products" subtitle="By revenue"
          data={topProductsToRevenue(products.data?.topProducts)} currency />
        <HorizontalBarChart title="Sales by category" subtitle="Revenue contribution" currency
          data={topCategoriesToRevenue(products.data?.topCategories)} />
        <DistributionPieChart title="Payment distribution" subtitle="By provider"
          data={recordToChartPoints(payments.data?.byProvider)} />
        <DistributionPieChart title="Order status" subtitle="Current breakdown" data={orderStatusData} />
        <HorizontalBarChart title="Top customers" subtitle="By lifetime spend" currency
          data={topCustomersToSpend(customers.data?.topCustomers)} />
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RecentOrders orders={data?.recentOrders} loading={isLoading} />
        <RecentPayments payments={data?.recentPayments} loading={isLoading} />
        <RecentCustomers customers={data?.recentCustomers} loading={isLoading} />
        <RecentActivityPanel entries={data?.recentActivities} loading={isLoading} />
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

function RecentOrders({ orders, loading }: { orders?: RecentOrder[]; loading?: boolean }) {
  return (
    <Panel title="Recent orders" href="/admin/orders">
      <Rows loading={loading} empty={!orders?.length}>
        {orders?.slice(0, 5).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">#{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.placedAtUtc)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={o.status} />
                <span className="text-sm font-bold">{o.totalFormatted}</span>
              </div>
            </Link>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentPayments({ payments, loading }: { payments?: RecentPayment[]; loading?: boolean }) {
  return (
    <Panel title="Recent payments" href="/admin/payments">
      <Rows loading={loading} empty={!payments?.length}>
        {payments?.slice(0, 5).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.reference ?? p.id.slice(0, 12)}</p>
              <p className="text-xs text-muted-foreground">{p.provider ?? "Flutterwave"} · {formatDate(p.createdAtUtc)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={p.status} />
              <span className="text-sm font-bold">{p.amountFormatted}</span>
            </div>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentCustomers({ customers, loading }: { customers?: RecentCustomer[]; loading?: boolean }) {
  return (
    <Panel title="Recent customers" href="/admin/customers">
      <Rows loading={loading} empty={!customers?.length}>
        {customers?.slice(0, 5).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{c.email}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.registeredAtUtc)}</span>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}

function RecentActivityPanel({ entries, loading }: { entries?: RecentActivity[]; loading?: boolean }) {
  return (
    <Panel title="Recent activity" href="/admin/audit-logs">
      <Rows loading={loading} empty={!entries?.length}>
        {entries?.slice(0, 6).map((a, i) => (
          <li key={i} className="flex gap-3 py-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0">
              <p className="truncate text-sm">
                <span className="font-medium">{a.actorEmail ?? "System"}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(a.occurredAtUtc)}</p>
            </div>
          </li>
        ))}
      </Rows>
    </Panel>
  );
}
