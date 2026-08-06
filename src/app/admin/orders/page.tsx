"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect, DateRangeFilter } from "@/features/admin/components/filter-select";
import { useAdminOrders } from "@/features/admin/admin-hooks";
import { formatDate } from "@/lib/format";
import type { AdminOrderQuery } from "@/features/admin/admin-api";
import type { OrderStatus, OrderSummary } from "@/types/models";

const ORDER_STATUSES: OrderStatus[] = [
  "Pending", "AwaitingPayment", "Paid", "Processing", "Packed", "Shipped",
  "Delivered", "Completed", "Cancelled", "RefundPending", "Refunded", "Failed",
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus>();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const query: AdminOrderQuery = useMemo(() => ({
    pageNumber: page, pageSize,
    search: search || undefined,
    status, placedFrom: range.from, placedTo: range.to,
    oldestFirst: sorting[0]?.id === "placedAtUtc" ? !sorting[0].desc : undefined,
  }), [page, pageSize, search, status, range, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminOrders(query);

  const columns = useMemo<ColumnDef<OrderSummary, unknown>[]>(() => [
    {
      id: "orderNumber", header: "Order",
      accessorFn: (o) => o.orderNumber,
      cell: ({ row }) => <span className="font-semibold">#{row.original.orderNumber}</span>,
    },
    {
      id: "placedAtUtc", header: "Date", accessorFn: (o) => o.placedAtUtc,
      cell: ({ row }) => formatDate(row.original.placedAtUtc),
    },
    { id: "itemCount", header: "Items", enableSorting: false, accessorFn: (o) => o.itemCount },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (o) => o.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "paymentStatus", header: "Payment", enableSorting: false,
      accessorFn: (o) => o.paymentStatus,
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      id: "total", header: "Total", accessorFn: (o) => o.totalInKobo,
      cell: ({ row }) => <span className="font-bold">{row.original.totalFormatted}</span>,
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track, update and fulfil customer orders."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
      />

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order number…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(o) => o.id}
        exportFileName="orders"
        onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here as customers check out."
        toolbar={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v as OrderStatus | undefined); setPage(1); }} label="Status"
              placeholder="Any status" width="w-[150px]"
              options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))} />
            <DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
          </>
        }
      />
    </>
  );
}
