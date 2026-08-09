"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { useAdminCustomers } from "@/features/admin/admin-hooks";
import { formatDate } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { CustomerListItem } from "@/features/admin/admin-types";

export default function AdminCustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const query: AdminListQuery = useMemo(
    () => ({ pageNumber: page, pageSize, search: search || undefined }),
    [page, pageSize, search]
  );

  const { data, isLoading, isFetching, isError, refetch } = useAdminCustomers(query);

  const columns = useMemo<ColumnDef<CustomerListItem, unknown>[]>(() => [
    {
      id: "name", header: "Customer",
      accessorFn: (c) => c.fullName,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">{c.fullName || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
          </div>
        );
      },
    },
    {
      id: "phoneNumber", header: "Phone", enableSorting: false,
      accessorFn: (c) => c.phoneNumber,
      cell: ({ row }) => row.original.phoneNumber || <span className="text-muted-foreground">—</span>,
    },
    {
      id: "emailConfirmed", header: "Email", enableSorting: false,
      accessorFn: (c) => c.emailConfirmed,
      cell: ({ row }) => row.original.emailConfirmed
        ? <Badge variant="success"><BadgeCheck size={13} /> Verified</Badge>
        : <span className="text-sm text-muted-foreground">Unverified</span>,
    },
    {
      id: "accountStatus", header: "Status", enableSorting: false,
      accessorFn: (c) => c.accountStatus,
      cell: ({ row }) => <StatusBadge status={row.original.accountStatus} />,
    },
    {
      id: "createdAtUtc", header: "Joined", accessorFn: (c) => c.createdAtUtc,
      cell: ({ row }) => formatDate(row.original.createdAtUtc),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone with a storefront account."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]}
      />

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search customers by name or email…"
        sorting={sorting} onSortingChange={setSorting}
        getRowId={(c) => c.id}
        onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        exportFileName="customers"
        emptyTitle="No customers yet"
        emptyDescription="Customers show up here as soon as they create a storefront account."
      />
    </>
  );
}
