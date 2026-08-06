"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Mail, MapPin, Phone, ShoppingCart, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatCard } from "@/features/admin/components/stat-card";
import { StatusBadge } from "@/features/admin/components/status-badge";
import {
  useAdminCustomer, useAdminCustomerAddresses, useAdminCustomerActivity,
  useAdminCustomerDashboard, useCustomerStatusMutation, useAdminOrders,
} from "@/features/admin/admin-hooks";
import { formatDate, formatDateTime } from "@/lib/format";

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: customer, isLoading, isError, refetch } = useAdminCustomer(id);
  const addresses = useAdminCustomerAddresses(id);
  const activity = useAdminCustomerActivity(id);
  const dashboard = useAdminCustomerDashboard(id);
  const status = useCustomerStatusMutation(id);
  const ordersQuery = useMemo(() => ({ customerId: id, pageNumber: 1, pageSize: 10 }), [id]);
  const orders = useAdminOrders(ordersQuery);

  if (isLoading) return <LoadingState label="Loading customer…" />;
  if (isError || !customer) return <ErrorState onRetry={() => refetch()} />;

  const name = customer.fullName || customer.email;
  const suspended = customer.accountStatus === "Suspended";

  return (
    <>
      <PageHeader
        title={name}
        description={customer.email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: name },
        ]}
        actions={
          suspended ? (
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline"><CheckCircle2 size={15} /> Reactivate</Button>}
              title="Reactivate this account?"
              description="The customer will be able to sign in and place orders again."
              actionLabel="Reactivate" destructive={false}
              pending={status.isPending}
              onConfirm={() => status.mutateAsync({ isActive: true })}
            />
          ) : (
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline" className="text-destructive"><Ban size={15} /> Suspend</Button>}
              title="Suspend this account?"
              description="The customer will be blocked from signing in and placing new orders. Existing orders are unaffected."
              actionLabel="Suspend account"
              pending={status.isPending}
              onConfirm={() => status.mutateAsync({ isActive: false })}
            />
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={customer.accountStatus} />
        <span className="text-xs text-muted-foreground">Customer since {formatDate(customer.createdAtUtc)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Orders" icon={<ShoppingCart size={18} />} loading={dashboard.isLoading}
          value={(dashboard.data?.orderCount ?? 0).toLocaleString()} />
        <StatCard label="Profile complete" icon={<Wallet size={18} />} loading={dashboard.isLoading}
          value={`${dashboard.data?.profileCompletionPercentage ?? customer.profileCompletionPercentage}%`} />
        <StatCard label="Wishlist items" icon={<CheckCircle2 size={18} />} loading={dashboard.isLoading}
          value={dashboard.data?.wishlistCount ?? "—"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card><CardContent className="p-5">
                {orders.isLoading ? (
                  <LoadingState />
                ) : !orders.data?.items.length ? (
                  <EmptyState icon={<ShoppingCart size={26} />} title="No orders yet" />
                ) : (
                  <ul className="divide-y divide-border">
                    {orders.data.items.map((o) => (
                      <li key={o.id}>
                        <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">#{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(o.placedAtUtc)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={o.status} />
                            <span className="font-bold">{o.totalFormatted}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card><CardContent className="p-5">
                {addresses.isLoading ? (
                  <LoadingState />
                ) : !addresses.data?.length ? (
                  <EmptyState icon={<MapPin size={26} />} title="No saved addresses" />
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {addresses.data.map((a) => (
                      <li key={a.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{a.recipientName}</p>
                          {a.isDefault && <StatusBadge status="Default" />}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{a.formattedAddress}</p>
                        {a.phoneNumber && <p className="text-sm text-muted-foreground">{a.phoneNumber}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card><CardContent className="p-5">
                {activity.isLoading ? (
                  <LoadingState />
                ) : !activity.data?.items.length ? (
                  <EmptyState title="No recorded activity" />
                ) : (
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {activity.data.items.map((a) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(a.occurredAtUtc)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Contact</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="truncate hover:text-primary">{customer.email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{customer.phoneNumber ?? "—"}</span>
              </li>
            </ul>
            <Link href="/admin/orders" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 w-full" })}>
              Search their orders
            </Link>
          </CardContent></Card>
        </aside>
      </div>
    </>
  );
}
