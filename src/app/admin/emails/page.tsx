"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect, DateRangeFilter } from "@/features/admin/components/filter-select";
import { useEmailLogs, useEmailMutations } from "@/features/admin/admin-hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { EmailLog } from "@/features/admin/admin-types";

const EMAIL_STATUSES = ["Sent", "Failed", "Queued"];

export default function AdminEmailsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");

  const m = useEmailMutations();

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize, search: search || undefined, status,
    from: range.from, to: range.to,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, status, range, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useEmailLogs(query);

  const columns = useMemo<ColumnDef<EmailLog, unknown>[]>(() => [
    { id: "recipient", header: "Recipient", accessorFn: (e) => e.to ?? e.recipient ?? "—" },
    {
      id: "subject", header: "Subject", accessorFn: (e) => e.subject ?? "—",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.subject ?? "—"}</p>
          {row.original.template && <p className="truncate text-xs text-muted-foreground">{row.original.template}</p>}
        </div>
      ),
    },
    {
      id: "sentAt", header: "Sent", accessorFn: (e) => e.sentAt ?? e.createdAt,
      cell: ({ row }) => formatDateTime(row.original.sentAt ?? row.original.createdAt),
    },
    {
      id: "status", header: "Status", enableSorting: false, accessorFn: (e) => e.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 50,
      cell: ({ row }) => {
        const failed = /fail|error|bounce/i.test(row.original.status ?? "");
        if (!failed) return null;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label="Retry email"
              disabled={m.retry.isPending} onClick={() => m.retry.mutate([row.original.id])}>
              <RefreshCw size={15} />
            </Button>
          </div>
        );
      },
    },
  ], [m]);

  return (
    <>
      <PageHeader
        title="Email logs"
        description="Delivery history for every transactional email."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Email logs" }]}
        actions={<Button size="sm" variant="outline" onClick={() => setTestOpen(true)}><Send size={15} /> Send test</Button>}
      />

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search recipient or subject…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(e) => e.id}
        exportFileName="email-logs"
        onRowClick={(e) => setSelected(e)}
        emptyTitle="No emails logged"
        emptyDescription="Transactional emails will appear here once they're sent."
        toolbar={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Status"
              placeholder="Any status" width="w-[140px]"
              options={EMAIL_STATUSES.map((s) => ({ value: s, label: s }))} />
            <DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
          </>
        }
        bulkActions={(ids, clear) => (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline"><RefreshCw size={14} /> Retry selected</Button>}
            title={`Retry ${ids.length} email${ids.length > 1 ? "s" : ""}?`}
            description="The selected emails will be queued for another delivery attempt."
            actionLabel={`Retry ${ids.length}`} destructive={false}
            onConfirm={async () => { await m.retry.mutateAsync(ids); clear(); }}
          />
        )}
      />

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-lg font-bold tracking-tight">
              {selected?.subject ?? "Email details"}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <dl className="divide-y divide-border text-sm">
              <DetailRow label="To" value={selected?.to ?? selected?.recipient ?? "—"} />
              <DetailRow label="Template" value={selected?.template ?? "—"} />
              <DetailRow label="Status" value={selected?.status ?? "—"} />
              <DetailRow label="Attempts" value={String(selected?.attempts ?? "—")} />
              <DetailRow label="Sent" value={formatDateTime(selected?.sentAt ?? selected?.createdAt)} />
            </dl>

            {(selected?.error || selected?.errorMessage) && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-destructive">Error</p>
                <p className="break-words text-sm">{selected.error ?? selected.errorMessage}</p>
              </div>
            )}

            {selected?.body && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Body</p>
                <div className="max-h-80 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs">
                  <pre className="whitespace-pre-wrap break-words font-sans">{selected.body}</pre>
                </div>
              </div>
            )}

            {selected && /fail|error/i.test(selected.status ?? "") && (
              <Button className="w-full" disabled={m.retry.isPending}
                onClick={() => m.retry.mutate([selected.id], { onSuccess: () => setSelected(null) })}>
                {m.retry.isPending ? <><Spinner className="h-4 w-4" /> Retrying…</> : <><RefreshCw size={15} /> Retry delivery</>}
              </Button>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Test email */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a test email</DialogTitle>
            <DialogDescription>Confirms your delivery provider is configured correctly.</DialogDescription>
          </DialogHeader>
          <Field label="Send to">
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com" autoFocus />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button disabled={!testTo.includes("@") || m.test.isPending}
              onClick={() => m.test.mutate({ to: testTo }, { onSuccess: () => { setTestOpen(false); setTestTo(""); } })}>
              {m.test.isPending ? <><Spinner className="h-4 w-4" /> Sending…</> : "Send test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{value}</dd>
    </div>
  );
}
