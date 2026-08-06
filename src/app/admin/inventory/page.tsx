"use client";

import { useState } from "react";
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
import type { ProductSummary } from "@/types/models";

export default function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<ProductSummary | null>(null);

  const dashboard = useAdminDashboard();
  const { data, isLoading, isFetching, isError, refetch } = useLowStock(page, pageSize);

  const columns: ColumnDef<ProductSummary, unknown>[] = [
    {
      id: "product", header: "Product", accessorFn: (r) => r.name,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link href={`/admin/products/${row.original.id}`} onClick={(e) => e.stopPropagation()}
            className="truncate font-medium hover:text-primary">
            {row.original.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      ),
    },
    {
      id: "available", header: "Available",
      accessorFn: (r) => r.availableQuantity,
      cell: ({ row }) => {
        const qty = row.original.availableQuantity;
        return (
          <span className={qty === 0 ? "font-bold text-destructive" : "font-bold text-amber-600 dark:text-amber-400"}>
            {qty}
          </span>
        );
      },
    },
    { id: "inventoryStatus", header: "Status", enableSorting: false, accessorFn: (r) => r.inventoryStatus },
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
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Products at or below their low-stock threshold."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Inventory" }]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Low stock" icon={<AlertTriangle size={18} />} tone="warning"
          loading={dashboard.isLoading} value={(dashboard.data?.catalog.lowStockProducts ?? data?.totalCount ?? 0).toLocaleString()} />
        <StatCard label="Out of stock" icon={<XCircle size={18} />} tone="danger"
          loading={dashboard.isLoading} value={(dashboard.data?.catalog.outOfStockProducts ?? 0).toLocaleString()} />
        <StatCard label="Total products" icon={<Package size={18} />}
          loading={dashboard.isLoading} value={(dashboard.data?.catalog.totalProducts ?? 0).toLocaleString()} />
      </div>

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        getRowId={(r) => r.id}
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
              {selected?.name ?? "Manage stock"}
            </SheetTitle>
          </SheetHeader>
          <SheetBody>
            {selected && <InventoryPanel productId={selected.id} />}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
