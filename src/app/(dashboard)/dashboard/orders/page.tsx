"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatDate } from "@/lib/format";
import { useOrders } from "@/features/orders/orders-hooks";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useOrders({ pageNumber: page });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Your Orders</h1>
        {typeof data?.totalCount === "number" && (
          <p className="text-sm text-muted-foreground">{data.totalCount} total</p>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading your orders…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <Card><CardContent className="p-5">
          <EmptyState
            icon={<Package size={28} />}
            title="No orders yet"
            description="Once you place an order, you'll be able to track it here."
            action={<Link href="/" className={buttonVariants()}>Start shopping</Link>}
          />
        </CardContent></Card>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <Link href={`/dashboard/orders/${o.id}`} className="group flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold group-hover:text-primary">#{o.orderNumber}</p>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(o.placedAtUtc)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <span className="font-extrabold">{o.totalFormatted}</span>
                    <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination page={data.pageNumber} totalPages={data.totalPages}
            hasPrev={data.hasPreviousPage} hasNext={data.hasNextPage} onPage={setPage} />
        </>
      )}
    </div>
  );
}
