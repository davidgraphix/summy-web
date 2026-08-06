"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { MediaManager } from "@/features/admin/components/media-manager";
import { useAdminProducts } from "@/features/admin/admin-hooks";
import { productImage } from "@/features/products/product-image";
import type { ProductSearchQuery } from "@/features/admin/admin-api";
import type { ProductSummary } from "@/types/models";

/**
 * Media is scoped per product in the API (/media/products/{productId}/images),
 * so the manager is reached by picking a product first.
 */
export default function AdminMediaPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProductSummary | null>(null);

  const query: ProductSearchQuery = useMemo(
    () => ({ pageNumber: page, pageSize, search: search || undefined }),
    [page, pageSize, search]
  );
  const { data, isLoading, isFetching, isError, refetch } = useAdminProducts(query);

  const columns = useMemo<ColumnDef<ProductSummary, unknown>[]>(() => [
    {
      id: "name", header: "Product", accessorFn: (p) => p.name,
      cell: ({ row }) => {
        const img = productImage(row.original, "thumb");
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package size={17} />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "images", header: "Image", enableSorting: false,
      accessorFn: (p) => !!p.primaryImageUrl,
      cell: ({ row }) => (
        <span className={row.original.primaryImageUrl ? "text-sm" : "text-sm font-medium text-destructive"}>
          {row.original.primaryImageUrl ? "Has image" : "No images"}
        </span>
      ),
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 130,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setSelected(row.original)}>
            <ImageIcon size={14} /> Manage
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Media"
        description="Manage product imagery. Changes appear on the storefront immediately."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Media" }]}
      />

      <DataTable
        columns={columns} data={data}
        isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={() => refetch()}
        page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Find a product…"
        getRowId={(p) => p.id}
        onRowClick={(p) => setSelected(p)}
        emptyTitle="No products found"
        emptyDescription="Add products before uploading imagery."
      />

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent width="max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold tracking-tight">{selected?.name ?? "Media"}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {selected && <MediaManager productId={selected.id} slug={selected.slug} />}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
