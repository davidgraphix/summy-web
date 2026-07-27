"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect, DateRangeFilter } from "@/features/admin/components/filter-select";
import { useAdminPayments, usePaymentMutations } from "@/features/admin/admin-hooks";
import { formatNaira, formatDateTime } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { AdminPayment } from "@/features/admin/admin-types";

const PAYMENT_STATUSES = ["Pending", "Successful", "Failed", "Refunded", "Cancelled"];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const m = usePaymentMutations();

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize, search: search || undefined, status,
    from: range.from, to: range.to,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, status, range, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminPayments(query);

  const columns = useMemo<ColumnDef<AdminPayment, unknown>[]>(() => [
    {
      id: "reference", header: "Reference",
      accessorFn: (p) => p.reference ?? p.id,
      cell: ({ row }) => <span className="font-medium">{row.original.reference ?? row.original.id.slice(0, 12)}</span>,
    },
    {
      id: "order", header: "Order", enableSorting: false,
      accessorFn: (p) => p.orderNumber ?? "—",
      cell: ({ row }) => row.original.orderId ? (
        <Link href={`/admin/orders/${row.original.orderId}`} onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline">
          {row.original.orderNumber ? `#${row.original.orderNumber}` : "View order"}
        </Link>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "customer", header: "Customer", enableSorting: false,
      accessorFn: (p) => p.customerName ?? p.customerEmail ?? "—",
    },
    { id: "provider", header: "Provider", accessorFn: (p) => p.provider ?? p.method ?? "Flutterwave" },
    { id: "createdAt", header: "Date", accessorFn: (p) => p.createdAt, cell: ({ row }) => formatDateTime(row.original.createdAt) },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (p) => p.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "amount", header: "Amount", accessorFn: (p) => p.amount,
      cell: ({ row }) => <span className="font-bold">{formatNaira(row.original.amount)}</span>,
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 50,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" aria-label="Re-verify payment"
            disabled={m.reverify.isPending} onClick={() => m.reverify.mutate(row.original.id)}>
            <RefreshCw size={15} />
          </Button>
        </div>
      ),
    },
  ], [m]);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every transaction processed through the store."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payments" }]}
      />
      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search reference, customer…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(p) => p.id}
        exportFileName="payments"
        onRowClick={(p) => router.push(`/admin/payments/${p.id}`)}
        emptyTitle="No payments found"
        emptyDescription="Transactions appear here once customers start paying."
        toolbar={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Status"
              placeholder="Any status" width="w-[150px]"
              options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))} />
            <DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
          </>
        }
      />
    </>
  );
}
