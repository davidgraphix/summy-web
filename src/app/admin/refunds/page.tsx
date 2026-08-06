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
import { formatDate } from "@/lib/format";
import type { RefundQuery } from "@/features/admin/admin-api";
import type { Refund, RefundStatus } from "@/types/models";

const REFUND_STATUSES: RefundStatus[] = ["Requested", "Approved", "Processing", "Completed", "Rejected", "Failed"];

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<RefundStatus>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const m = usePaymentMutations();

  const query: RefundQuery = useMemo(() => ({ pageNumber: page, pageSize, status }), [page, pageSize, status]);

  const { data, isLoading, isFetching, isError, refetch } = useRefunds(query);

  const columns = useMemo<ColumnDef<Refund, unknown>[]>(() => [
    {
      id: "payment", header: "Payment", enableSorting: false,
      cell: ({ row }) => (
        <Link href={`/admin/payments/${row.original.paymentId}`} className="font-medium text-primary hover:underline">
          {row.original.paymentId.slice(0, 12)}
        </Link>
      ),
    },
    { id: "reason", header: "Reason", enableSorting: false, accessorFn: (r) => r.reason },
    { id: "requestedAtUtc", header: "Requested", accessorFn: (r) => r.requestedAtUtc, cell: ({ row }) => formatDate(row.original.requestedAtUtc) },
    {
      id: "status", header: "Status", enableSorting: false,
      accessorFn: (r) => r.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "amount", header: "Amount", accessorFn: (r) => r.amountInKobo,
      cell: ({ row }) => <span className="font-bold">{row.original.amountFormatted}</span>,
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false,
      cell: ({ row }) => {
        const r = row.original;
        if (r.status !== "Requested") return null;
        return (
          <div className="flex justify-end gap-1">
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline"><Check size={14} /> Approve</Button>}
              title="Approve this refund?"
              description={`${r.amountFormatted} will be submitted to the gateway for the customer.`}
              actionLabel="Approve refund" destructive={false}
              pending={m.approveRefund.isPending}
              onConfirm={() => m.approveRefund.mutateAsync({ id: r.id, body: {} })}
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="ghost" className="text-destructive"><X size={14} /></Button>}
              title="Reject this refund?"
              description="The request will be closed without refunding the customer."
              actionLabel="Reject refund"
              pending={m.rejectRefund.isPending}
              onConfirm={() => m.rejectRefund.mutateAsync({ id: r.id, body: { reason: "Rejected by staff" } })}
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
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(r) => r.id}
        exportFileName="refunds"
        emptyTitle="No refund requests"
        emptyDescription="Refund requests raised from a payment will show up here."
        toolbar={
          <FilterSelect value={status} onChange={(v) => { setStatus(v as RefundStatus | undefined); setPage(1); }} label="Status"
            placeholder="Any status" width="w-[150px]"
            options={REFUND_STATUSES.map((s) => ({ value: s, label: s }))} />
        }
        bulkActions={(ids, clear) => (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline"><Check size={14} /> Approve selected</Button>}
            title={`Approve ${ids.length} refund${ids.length > 1 ? "s" : ""}?`}
            description="The selected customers will be refunded. This can't be undone."
            actionLabel={`Approve ${ids.length}`} confirmText="APPROVE"
            onConfirm={async () => { await Promise.all(ids.map((id) => m.approveRefund.mutateAsync({ id, body: {} }))); clear(); }}
          />
        )}
      />
    </>
  );
}
