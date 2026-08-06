"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { FileClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { DateRangeFilter } from "@/features/admin/components/filter-select";
import { useAuditLogs, useActorAuditLogs } from "@/features/admin/admin-hooks";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry, AuditLogQuery } from "@/features/admin/admin-types";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [actorId, setActorId] = useState<string | null>(null);
  const [actorName, setActorName] = useState<string>("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const query: AuditLogQuery = useMemo(() => ({
    pageNumber: page, pageSize, search: search || undefined,
    from: range.from, to: range.to,
  }), [page, pageSize, search, range]);

  // Filtering by actor uses the dedicated endpoint rather than a query param.
  const all = useAuditLogs(query);
  const byActor = useActorAuditLogs(actorId ?? "", query);
  const active = actorId ? byActor : all;

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(() => [
    {
      id: "occurredAtUtc", header: "When",
      accessorFn: (a) => a.occurredAtUtc,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">{formatDateTime(row.original.occurredAtUtc)}</span>
      ),
    },
    {
      id: "actor", header: "Actor", enableSorting: false,
      accessorFn: (a) => a.actorEmail ?? "System",
      cell: ({ row }) => {
        const a = row.original;
        const label = a.actorEmail ?? "System";
        if (!a.actorId) return <span className="text-sm">{label}</span>;
        return (
          <button onClick={(e) => { e.stopPropagation(); setActorId(a.actorId!); setActorName(label); setPage(1); }}
            className="text-sm font-medium text-primary hover:underline">
            {label}
          </button>
        );
      },
    },
    {
      id: "action", header: "Action", enableSorting: false,
      accessorFn: (a) => a.action,
      cell: ({ row }) => <Badge variant="muted">{row.original.action}</Badge>,
    },
    {
      id: "entity", header: "Entity", enableSorting: false,
      accessorFn: (a) => a.entityType ?? "—",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.original.entityType ?? "—"}</p>
          {row.original.entityId && (
            <p className="truncate text-xs text-muted-foreground">{row.original.entityId.slice(0, 12)}</p>
          )}
        </div>
      ),
    },
    { id: "ipAddress", header: "IP", enableSorting: false, accessorFn: (a) => a.ipAddress ?? "—" },
  ], []);

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="A record of every change made in the dashboard."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Audit logs" }]}
      />

      {actorId && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered to</span>
          <button onClick={() => { setActorId(null); setActorName(""); setPage(1); }}
            className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground">
            {actorName} <X size={13} />
          </button>
        </div>
      )}

      <DataTable
        columns={columns} data={active.data}
        isLoading={active.isLoading} isFetching={active.isFetching}
        isError={active.isError} onRetry={() => active.refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search action, entity, actor…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(a) => a.id}
        exportFileName="audit-logs"
        onRowClick={(a) => setSelected(a)}
        emptyTitle="No audit entries"
        emptyDescription="Changes made in the dashboard will be recorded here."
        toolbar={<DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />}
      />

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <FileClock size={18} /> Audit entry
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <dl className="divide-y divide-border text-sm">
              <Row label="Action" value={selected?.action ?? "—"} />
              <Row label="Actor" value={selected?.actorEmail ?? "System"} />
              <Row label="Entity" value={selected?.entityType ?? "—"} />
              <Row label="Entity ID" value={selected?.entityId ?? "—"} />
              <Row label="IP address" value={selected?.ipAddress ?? "—"} />
              <Row label="User agent" value={selected?.userAgent ?? "—"} />
              <Row label="When" value={formatDateTime(selected?.occurredAtUtc)} />
            </dl>

            {selected?.actorId && (
              <Button variant="outline" className="w-full"
                onClick={() => {
                  setActorId(selected.actorId!);
                  setActorName(selected.actorEmail ?? "Actor");
                  setSelected(null); setPage(1);
                }}>
                View all activity by this user
              </Button>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{value}</dd>
    </div>
  );
}
