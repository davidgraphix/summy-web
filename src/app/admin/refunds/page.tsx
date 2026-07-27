"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect } from "@/features/admin/components/filter-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useRefunds, usePaymentMutations } from "@/features/admin/admin-hooks";
import { formatNaira, formatDate } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { Refund } from "@/features/admin/admin-types";

const REFUND_STATUSES = ["Pending", "Approved", "Rejected"];

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const m = usePaymentMutations();

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize, search: search || undefined, status,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, status, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useRefunds(query);

  const columns = useMemo<ColumnDef<Refund, unknown>[]>(() => [
    {
      id: "order", header: "Order", enableSorting: false,
      accessorFn: (r) => r.orderNumber ?? r.orderId ?? "—",
      cell: ({ row }) => row.original.orderId ? (
        <Link href={`/admin/orders/${row.original.orderId}`} className="font-medium text-primary hover:underline">
          {row.original.orderNumber ? `#${row.original.orderNumber}` : row.original.orderId.slice(0, 8)}
        </Link>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "payment", header: "Payment", enableSorting: false,
      accessorFn: (r) => r.paymentId ?? "—",
      cell: ({ row }) => row.original.paymentId ? (
        <Link href={`/admin/payments/${row.original.paymentId}`} className="text-primary hover:underline">
          {row.original.paymentId.slice(0, 12)}
        </Link>
      ) : "—",
    },
    { id: "reason", header: "Reason", enableSorting: false, accessorFn: (r) => r.reason ?? "—" },
    { id: "requestedBy", header: "Requested by", enableSorting: false, accessorFn: (r) => r.requestedBy ?? "—" },
    { id: "createdAt", header: "Date", accessorFn: (r) => r.createdAt, cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (r) => r.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "amount", header: "Amount", accessorFn: (r) => r.amount,
      cell: ({ row }) => <span className="font-bold">{formatNaira(row.original.amount)}</span>,
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false,
      cell: ({ row }) => {
        const r = row.original;
        const pending = /pending|await|review/i.test(r.status ?? "") || !r.status;
        if (!pending) return null;
        return (
          <div className="flex justify-end gap-1">
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline"><Check size={14} /> Approve</Button>}
              title="Approve this refund?"
              description={`${formatNaira(r.amount)} will be refunded to the customer.`}
              actionLabel="Approve refund" destructive={false}
              pending={m.approveRefund.isPending}
              onConfirm={() => m.approveRefund.mutateAsync(r.id)}
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="ghost" className="text-destructive"><X size={14} /></Button>}
              title="Reject this refund?"
              description="The request will be closed without refunding the customer."
              actionLabel="Reject refund"
              pending={m.rejectRefund.isPending}
              onConfirm={() => m.rejectRefund.mutateAsync(r.id)}
            />
          </div>
        );
      },
    },
  ], [m]);

  return (
    <>
      <PageHeader
        title="Refunds"
        description="Review and action refund requests."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Refunds" }]}
      />
      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search refunds…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(r) => r.id}
        exportFileName="refunds"
        emptyTitle="No refund requests"
        emptyDescription="Refund requests raised from a payment will show up here."
        toolbar={
          <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Status"
            placeholder="Any status" width="w-[150px]"
            options={REFUND_STATUSES.map((s) => ({ value: s, label: s }))} />
        }
        bulkActions={(ids, clear) => (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline"><Check size={14} /> Approve selected</Button>}
            title={`Approve ${ids.length} refund${ids.length > 1 ? "s" : ""}?`}
            description="The selected customers will be refunded. This can't be undone."
            actionLabel={`Approve ${ids.length}`} confirmText="APPROVE"
            onConfirm={async () => { await Promise.all(ids.map((id) => m.approveRefund.mutateAsync(id))); clear(); }}
          />
        )}
      />
    </>
  );
}
