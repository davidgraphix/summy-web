"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import {
  useDeletedProducts, useDeletedCategories, useCatalogMutations,
} from "@/features/admin/admin-hooks";
import type { Category, ProductSummary } from "@/types/models";

export default function AdminTrashPage() {
  return (
    <>
      <PageHeader
        title="Restore"
        description="Recover deleted products and categories."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Restore" }]}
      />
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Deleted products</TabsTrigger>
          <TabsTrigger value="categories">Deleted categories</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><DeletedProducts /></TabsContent>
        <TabsContent value="categories"><DeletedCategories /></TabsContent>
      </Tabs>
    </>
  );
}

function DeletedProducts() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const m = useCatalogMutations();

  const { data, isLoading, isFetching, isError, refetch } = useDeletedProducts(page, pageSize);

  const columns = useMemo<ColumnDef<ProductSummary, unknown>[]>(() => [
    { id: "name", header: "Product", accessorFn: (p) => p.name,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      ) },
    { id: "price", header: "Price", accessorFn: (p) => p.price.kobo,
      cell: ({ row }) => row.original.price.formatted },
    { id: "actions", header: "", enableSorting: false, enableHiding: false, size: 120,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={m.restoreProduct.isPending}
            onClick={() => m.restoreProduct.mutate(row.original.id)}>
            <RotateCcw size={14} /> Restore
          </Button>
        </div>
      ) },
  ], [m]);

  return (
    <DataTable
      columns={columns} data={data}
      isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
      page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
      getRowId={(p) => p.id}
      emptyTitle="Nothing deleted"
      emptyDescription="Deleted products can be restored from here."
      bulkActions={(ids, clear) => (
        <ConfirmDialog
          trigger={<Button size="sm" variant="outline"><RotateCcw size={14} /> Restore selected</Button>}
          title={`Restore ${ids.length} product${ids.length > 1 ? "s" : ""}?`}
          description="They'll return to your catalogue with their previous publish status."
          actionLabel={`Restore ${ids.length}`} destructive={false}
          onConfirm={async () => { await Promise.all(ids.map((id) => m.restoreProduct.mutateAsync(id))); clear(); }}
        />
      )}
    />
  );
}

function DeletedCategories() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const m = useCatalogMutations();

  const { data, isLoading, isFetching, isError, refetch } = useDeletedCategories(page, pageSize);

  const columns = useMemo<ColumnDef<Category, unknown>[]>(() => [
    { id: "name", header: "Category", accessorFn: (c) => c.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: "slug", header: "Slug", accessorFn: (c) => c.slug },
    { id: "actions", header: "", enableSorting: false, enableHiding: false, size: 120,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={m.restoreCategory.isPending}
            onClick={() => m.restoreCategory.mutate(row.original.id)}>
            <RotateCcw size={14} /> Restore
          </Button>
        </div>
      ) },
  ], [m]);

  return (
    <DataTable
      columns={columns} data={data}
      isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
      page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
      getRowId={(c) => c.id}
      emptyTitle="Nothing deleted"
      emptyDescription="Deleted categories can be restored from here."
    />
  );
}
