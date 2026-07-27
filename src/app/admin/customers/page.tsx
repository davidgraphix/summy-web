"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Info } from "lucide-react";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { DateRangeFilter } from "@/features/admin/components/filter-select";
import { useAdminOrders } from "@/features/admin/admin-hooks";
import { formatNaira, formatDate } from "@/lib/format";
import type { PagedResult } from "@/types/api";
import type { AdminListQuery } from "@/features/admin/admin-api";

/**
 * NOTE ON DATA SOURCE
 * The backend exposes per-customer endpoints (/admin/customers/{id}/…) but no
 * customer *list* endpoint. Rather than invent one or fabricate rows, this
 * directory is derived from real order data: orders are fetched from
 * /admin/orders and grouped by customer, giving an accurate view of everyone
 * who has purchased, along with their order count and lifetime spend.
 *
 * Consequence: customers who have registered but never ordered won't appear.
 * If a GET /admin/customers endpoint is added later, swap the hook below for it
 * — the table and columns need no changes.
 */
interface DerivedCustomer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  // Pull a wide page of orders and aggregate; the table then paginates locally.
  const ordersQuery: AdminListQuery = useMemo(() => ({
    pageNumber: 1, pageSize: 200, search: search || undefined, from: range.from, to: range.to,
  }), [search, range]);

  const { data: orders, isLoading, isFetching, isError, refetch } = useAdminOrders(ordersQuery);

  const derived = useMemo<DerivedCustomer[]>(() => {
    const map = new Map<string, DerivedCustomer>();
    for (const o of orders?.items ?? []) {
      const id = o.customerId ?? o.customerEmail;
      if (!id) continue;
      const existing = map.get(id);
      const total = o.total ?? 0;
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += total;
        if (o.createdAt && (!existing.lastOrderAt || o.createdAt > existing.lastOrderAt)) {
          existing.lastOrderAt = o.createdAt;
        }
      } else {
        map.set(id, {
          id,
          name: o.customerName ?? "—",
          email: o.customerEmail ?? "—",
          orderCount: 1,
          totalSpent: total,
          lastOrderAt: o.createdAt,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Client-side pagination over the aggregate, shaped like a server PagedResult.
  const paged: PagedResult<DerivedCustomer> = useMemo(() => {
    const totalCount = derived.length;
    const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
    return {
      items: derived.slice((page - 1) * pageSize, page * pageSize),
      pageNumber: page, pageSize, totalCount, totalPages,
      hasPreviousPage: page > 1, hasNextPage: page < totalPages,
    };
  }, [derived, page, pageSize]);

  const columns = useMemo<ColumnDef<DerivedCustomer, unknown>[]>(() => [
    {
      id: "name", header: "Customer", accessorFn: (c) => c.name,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    { id: "orderCount", header: "Orders", accessorFn: (c) => c.orderCount },
    {
      id: "totalSpent", header: "Lifetime spend", accessorFn: (c) => c.totalSpent,
      cell: ({ row }) => <span className="font-bold">{formatNaira(row.original.totalSpent)}</span>,
    },
    {
      id: "lastOrderAt", header: "Last order", accessorFn: (c) => c.lastOrderAt,
      cell: ({ row }) => formatDate(row.original.lastOrderAt),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has ordered from your store."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]}
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          This directory is built from order history, since the API exposes customer detail per ID
          rather than a list. Registered customers who haven&apos;t ordered yet won&apos;t appear here.
        </p>
      </div>

      <DataTable
        columns={columns} data={paged}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email or order…"
        getRowId={(c) => c.id}
        exportFileName="customers"
        onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        emptyTitle="No customers yet"
        emptyDescription="Customers appear here once they place their first order."
        toolbar={<DateRangeFilter from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />}
      />
    </>
  );
}
