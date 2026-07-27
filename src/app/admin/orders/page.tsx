"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect, DateRangeFilter } from "@/features/admin/components/filter-select";
import { useAdminOrders } from "@/features/admin/admin-hooks";
import { formatNaira, formatDate } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { AdminOrder } from "@/features/admin/admin-types";

const ORDER_STATUSES = ["Pending", "Processing", "Paid", "Shipped", "Delivered", "Cancelled", "Refunded"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize,
    search: search || undefined,
    status, from: range.from, to: range.to,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, status, range, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminOrders(query);

  const columns = useMemo<ColumnDef<AdminOrder, unknown>[]>(() => [
    {
      id: "orderNumber", header: "Order",
      accessorFn: (o) => o.orderNumber ?? o.id,
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.orderNumber ? `#${row.original.orderNumber}` : row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "customer", header: "Customer",
      accessorFn: (o) => o.customerName ?? o.customerEmail ?? "—",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.customerName ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.customerEmail}</p>
        </div>
      ),
    },
    { id: "createdAt", header: "Date", accessorFn: (o) => o.createdAt, cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      id: "items", header: "Items", enableSorting: false,
      accessorFn: (o) => o.items?.length ?? 0,
    },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (o) => o.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "assignedTo", header: "Assigned", enableSorting: false,
      accessorFn: (o) => o.assignedToName ?? "—",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.assignedToName ?? "Unassigned"}</span>,
    },
    {
      id: "total", header: "Total", accessorFn: (o) => o.total,
      cell: ({ row }) => <span className="font-bold">{formatNaira(row.original.total)}</span>,
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
        searchPlaceholder="Search order number, customer…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(o) => o.id}
        exportFileName="orders"
        onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here as customers check out."
        toolbar={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Status"
              placeholder="Any status" width="w-[150px]"
              options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))} />
            <DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
          </>
        }
      />
    </>
  );
}
