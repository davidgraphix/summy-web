"use client";

import { useState } from "react";
import { PageHeader } from "@/features/admin/components/page-header";
import { FilterSelect } from "@/features/admin/components/filter-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RevenueTrendChart, OrdersBarChart, GrowthLineChart,
  HorizontalBarChart, DistributionPieChart,
} from "@/features/admin/components/charts";
import {
  useSalesAnalytics, useCustomerAnalytics, useProductAnalytics, usePaymentAnalytics,
} from "@/features/admin/admin-hooks";

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

export default function AdminAnalyticsPage() {
  // TODO: confirm the query-param name the analytics endpoints expect for range.
  const [period, setPeriod] = useState<string | undefined>("30d");
  const q = { period };

  const sales = useSalesAnalytics(q);
  const customers = useCustomerAnalytics(q);
  const products = useProductAnalytics(q);
  const payments = usePaymentAnalytics(q);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Deeper reporting across sales, customers, products and payments."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}
        actions={
          <FilterSelect value={period} onChange={setPeriod} placeholder="All time"
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
          <div className="lg:col-span-2"><RevenueTrendChart data={sales.data?.series} subtitle="Revenue over the selected period" /></div>
          <OrdersBarChart data={sales.data?.series} subtitle="Order volume" />
          <HorizontalBarChart title="Sales by category" subtitle="Revenue contribution" currency
            data={sales.data?.byCategory ?? products.data?.byCategory} />
        </TabsContent>

        <TabsContent value="customers" className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <GrowthLineChart data={customers.data?.series ?? customers.data?.growth} subtitle="New customers over time" />
          </div>
        </TabsContent>

        <TabsContent value="products" className="grid gap-4 lg:grid-cols-2">
          <HorizontalBarChart title="Top selling products" subtitle="By units sold"
            data={products.data?.topSelling ?? sales.data?.topProducts} />
          <DistributionPieChart title="Sales by category" subtitle="Share of revenue" currency
            data={products.data?.byCategory} />
        </TabsContent>

        <TabsContent value="payments" className="grid gap-4 lg:grid-cols-2">
          <DistributionPieChart title="By provider" subtitle="Payment volume" currency data={payments.data?.byProvider} />
          <DistributionPieChart title="By status" subtitle="Transaction outcomes" data={payments.data?.byStatus} />
          <div className="lg:col-span-2">
            <RevenueTrendChart data={payments.data?.series} title="Payment volume" subtitle="Processed over time" />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
