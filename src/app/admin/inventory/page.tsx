"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Package, Settings2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatCard } from "@/features/admin/components/stat-card";
import { DataTable } from "@/features/admin/components/data-table";
import { InventoryPanel } from "@/features/admin/components/inventory-panel";
import { useLowStock, useAdminDashboard } from "@/features/admin/admin-hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminListQuery } from "@/features/admin/admin-api";
import type { InventoryRecord } from "@/features/admin/admin-types";

export default function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InventoryRecord | null>(null);

  const dashboard = useAdminDashboard();
  const query: AdminListQuery = useMemo(
    () => ({ pageNumber: page, pageSize, search: search || undefined }),
    [page, pageSize, search]
  );
  const { data, isLoading, isFetching, isError, refetch } = useLowStock(query);

  const columns = useMemo<ColumnDef<InventoryRecord, unknown>[]>(() => [
    {
      id: "product", header: "Product", accessorFn: (r) => r.productName ?? r.productId,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link href={`/admin/products/${row.original.productId}`} onClick={(e) => e.stopPropagation()}
            className="truncate font-medium hover:text-primary">
            {row.original.productName ?? row.original.productId.slice(0, 8)}
          </Link>
          {row.original.sku && <p className="truncate text-xs text-muted-foreground">{row.original.sku}</p>}
        </div>
      ),
    },
    {
      id: "quantity", header: "On hand",
      accessorFn: (r) => r.quantity ?? r.stockQuantity ?? 0,
      cell: ({ row }) => {
        const qty = row.original.quantity ?? row.original.stockQuantity ?? 0;
        return (
          <span className={qty === 0 ? "font-bold text-destructive" : "font-bold text-amber-600 dark:text-amber-400"}>
            {qty}
          </span>
        );
      },
    },
    { id: "reserved", header: "Reserved", accessorFn: (r) => r.reserved ?? 0 },
    { id: "available", header: "Available", accessorFn: (r) => r.available ?? "—" },
    { id: "threshold", header: "Low-stock at", accessorFn: (r) => r.lowStockThreshold ?? "—" },
    {
      id: "updatedAt", header: "Updated", accessorFn: (r) => r.updatedAt,
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 50,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" aria-label="Manage stock" onClick={() => setSelected(row.original)}>
            <Settings2 size={15} />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Products at or below their low-stock threshold."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Inventory" }]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Low stock" icon={<AlertTriangle size={18} />} tone="warning"
          loading={dashboard.isLoading} value={(dashboard.data?.lowStockCount ?? data?.totalCount ?? 0).toLocaleString()} />
        <StatCard label="Out of stock" icon={<XCircle size={18} />} tone="danger"
          loading={dashboard.isLoading} value={(dashboard.data?.outOfStockCount ?? 0).toLocaleString()} />
        <StatCard label="Total products" icon={<Package size={18} />}
          loading={dashboard.isLoading} value={(dashboard.data?.totalProducts ?? 0).toLocaleString()} />
      </div>

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search products…"
        getRowId={(r) => r.productId}
        exportFileName="low-stock"
        onRowClick={(r) => setSelected(r)}
        emptyTitle="Everything is well stocked"
        emptyDescription="No products are below their low-stock threshold right now."
      />

      {/* Stock management opens in a drawer so you never lose your place in the list. */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent width="max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold tracking-tight">
              {selected?.productName ?? "Manage stock"}
            </SheetTitle>
          </SheetHeader>
          <SheetBody>
            {selected && <InventoryPanel productId={selected.productId} />}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
