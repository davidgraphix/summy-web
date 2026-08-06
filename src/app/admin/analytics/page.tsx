"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/features/admin/components/page-header";
import { FilterSelect } from "@/features/admin/components/filter-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RevenueTrendChart, OrdersBarChart, GrowthLineChart,
  HorizontalBarChart, DistributionPieChart, type ChartPoint,
} from "@/features/admin/components/charts";
import {
  useSalesAnalytics, useCustomerAnalytics, useProductAnalytics, usePaymentAnalytics,
} from "@/features/admin/admin-hooks";
import {
  seriesToRevenue, seriesToCount, topProductsToUnits, topCategoriesToRevenue,
  topCustomersToSpend, recordToChartPoints,
} from "@/features/admin/chart-helpers";
import type { DateRangeQuery } from "@/features/admin/admin-types";

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<string | undefined>("30");

  const range: DateRangeQuery = useMemo(() => {
    if (!days) return {};
    const to = new Date();
    const from = new Date(to.getTime() - Number(days) * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [days]);

  const sales = useSalesAnalytics(range);
  const customers = useCustomerAnalytics(range);
  const products = useProductAnalytics(range);
  const payments = usePaymentAnalytics(range);

  const paymentOutcomeData: ChartPoint[] = [
    { x: "Successful", y: payments.data?.successful ?? 0 },
    { x: "Failed", y: payments.data?.failed ?? 0 },
  ].filter((d) => d.y > 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Deeper reporting across sales, customers, products and payments."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}
        actions={
          <FilterSelect value={days} onChange={setDays} placeholder="All time"
            label="Period" width="w-[170px]" options={PERIODS} />
        }
      />

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <RevenueTrendChart data={seriesToRevenue(sales.data?.series)} subtitle="Revenue over the selected period" />
          </div>
          <OrdersBarChart data={seriesToCount(sales.data?.series)} subtitle="Order volume" />
          <HorizontalBarChart title="Sales by category" subtitle="Revenue contribution" currency
            data={topCategoriesToRevenue(products.data?.topCategories)} />
        </TabsContent>

        <TabsContent value="customers" className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <GrowthLineChart data={seriesToCount(customers.data?.registrationSeries)} subtitle="New customers over time" />
          </div>
          <HorizontalBarChart title="Top customers" subtitle="By lifetime spend" currency
            data={topCustomersToSpend(customers.data?.topCustomers)} />
        </TabsContent>

        <TabsContent value="products" className="grid gap-4 lg:grid-cols-2">
          <HorizontalBarChart title="Top selling products" subtitle="By units sold"
            data={topProductsToUnits(products.data?.topProducts)} />
          <DistributionPieChart title="Sales by category" subtitle="Share of revenue" currency
            data={topCategoriesToRevenue(products.data?.topCategories)} />
        </TabsContent>

        <TabsContent value="payments" className="grid gap-4 lg:grid-cols-2">
          <DistributionPieChart title="By provider" subtitle="Attempt volume"
            data={recordToChartPoints(payments.data?.byProvider)} />
          <DistributionPieChart title="Outcomes" subtitle="Successful vs failed" data={paymentOutcomeData} />
        </TabsContent>
      </Tabs>
    </>
  );
}
