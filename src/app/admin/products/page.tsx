"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Eye, EyeOff, MoreHorizontal, Package, Pencil, Plus, Star, Trash2, Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/features/admin/components/page-header";
import { DataTable } from "@/features/admin/components/data-table";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { FilterSelect } from "@/features/admin/components/filter-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImportProductsDialog } from "@/features/admin/components/import-products-dialog";
import { useAdminProducts, useProductMutations } from "@/features/admin/admin-hooks";
import { useCategories } from "@/features/categories/categories-hooks";
import { useBrands } from "@/features/brands/brands-hooks";
import { formatNaira } from "@/lib/format";
import { productImage } from "@/features/products/product-image";
import { API_ROOT } from "@/lib/env";
import { adminCatalogApi, type AdminListQuery } from "@/features/admin/admin-api";
import type { AdminProduct } from "@/features/admin/admin-types";

export default function AdminProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [categoryId, setCategoryId] = useState<string>();
  const [brandId, setBrandId] = useState<string>();
  const [status, setStatus] = useState<string>();

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const m = useProductMutations();

  const query: AdminListQuery = useMemo(() => ({
    pageNumber: page, pageSize,
    search: search || undefined,
    categoryId, brandId, status,
    sort: sorting[0] ? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}` : undefined,
  }), [page, pageSize, search, categoryId, brandId, status, sorting]);

  const { data, isLoading, isFetching, isError, refetch } = useAdminProducts(query);

  const isPublished = (p: AdminProduct) =>
    p.isPublished ?? (p.status ? /publish|active|live/i.test(p.status) : undefined);

  const columns = useMemo<ColumnDef<AdminProduct, unknown>[]>(() => [
    {
      id: "name", header: "Product", accessorFn: (p) => p.name,
      cell: ({ row }) => {
        const p = row.original;
        const img = productImage(p, "thumb");
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package size={17} />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.sku ?? p.slug}</p>
            </div>
          </div>
        );
      },
    },
    { id: "brand", header: "Brand", accessorFn: (p) => p.brand?.name ?? p.brandName ?? "—" },
    { id: "category", header: "Category", accessorFn: (p) => p.category?.name ?? p.categoryName ?? "—" },
    {
      id: "price", header: "Price", accessorFn: (p) => p.price,
      cell: ({ row }) => <span className="font-semibold">{formatNaira(row.original.price)}</span>,
    },
    {
      id: "stock", header: "Stock", accessorFn: (p) => p.stockQuantity ?? 0,
      cell: ({ row }) => {
        const qty = row.original.stockQuantity;
        if (typeof qty !== "number") return <span className="text-muted-foreground">—</span>;
        return (
          <span className={qty === 0 ? "font-semibold text-destructive" : qty <= 5 ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
            {qty}
          </span>
        );
      },
    },
    {
      id: "status", header: "Status", enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        const published = isPublished(p);
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={p.status ?? (published ? "Published" : "Draft")} />
            {p.isFeatured && <Badge variant="accent">Featured</Badge>}
          </div>
        );
      },
    },
    {
      id: "actions", header: "", enableSorting: false, enableHiding: false, size: 60,
      cell: ({ row }) => {
        const p = row.original;
        const published = isPublished(p);
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link href={`/admin/products/${p.id}`}><Pencil size={14} /> Edit</Link></DropdownMenuItem>
                {p.slug && (
                  <DropdownMenuItem asChild>
                    <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer"><Eye size={14} /> Preview</a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {published ? (
                  <DropdownMenuItem onClick={() => m.unpublish.mutate({ id: p.id, slug: p.slug })}>
                    <EyeOff size={14} /> Unpublish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => m.publish.mutate({ id: p.id, slug: p.slug })}>
                    <Eye size={14} /> Publish
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => m.setFeatured.mutate({ id: p.id, isFeatured: !p.isFeatured, slug: p.slug })}>
                  <Star size={14} /> {p.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()} asChild>
                  <ConfirmDialog
                    trigger={<button className="flex w-full items-center gap-2"><Trash2 size={14} /> Delete</button>}
                    title={`Delete “${p.name}”?`}
                    description="This removes the product from the storefront. You can restore it later from Restore."
                    actionLabel="Delete product"
                    pending={m.remove.isPending}
                    onConfirm={() => m.remove.mutateAsync({ id: p.id, slug: p.slug })}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [m]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Create, publish and manage everything in your catalogue."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Products" }]}
        actions={
          <>
            <a href={`${API_ROOT}${adminCatalogApi.exportProductsPath}`} target="_blank" rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              Export
            </a>
            <ImportProductsDialog trigger={<Button variant="outline" size="sm"><Upload size={15} /> Import</Button>} />
            <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
              <Plus size={15} /> New product
            </Link>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        onRetry={() => refetch()}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search products…"
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(p) => p.id}
        exportFileName="products"
        onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your filters, or add your first product."
        emptyAction={<Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}><Plus size={15} /> New product</Link>}
        toolbar={
          <>
            <FilterSelect value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} label="Category"
              placeholder="All categories" width="w-[160px]"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            <FilterSelect value={brandId} onChange={(v) => { setBrandId(v); setPage(1); }} label="Brand"
              placeholder="All brands" width="w-[150px]"
              options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))} />
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} label="Status"
              placeholder="Any status" width="w-[140px]"
              options={[{ value: "Published", label: "Published" }, { value: "Draft", label: "Draft" }]} />
          </>
        }
        bulkActions={(ids, clear) => (
          <>
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline"><Eye size={14} /> Publish</Button>}
              title={`Publish ${ids.length} product${ids.length > 1 ? "s" : ""}?`}
              description="These products will become visible on the storefront immediately."
              actionLabel="Publish" destructive={false}
              onConfirm={async () => { await Promise.all(ids.map((id) => m.publish.mutateAsync({ id }))); clear(); }}
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline"><EyeOff size={14} /> Unpublish</Button>}
              title={`Unpublish ${ids.length} product${ids.length > 1 ? "s" : ""}?`}
              description="These products will be hidden from the storefront immediately."
              actionLabel="Unpublish" destructive={false}
              onConfirm={async () => { await Promise.all(ids.map((id) => m.unpublish.mutateAsync({ id }))); clear(); }}
            />
            <ConfirmDialog
              trigger={<Button size="sm" variant="destructive"><Trash2 size={14} /> Delete</Button>}
              title={`Delete ${ids.length} product${ids.length > 1 ? "s" : ""}?`}
              description="They'll be removed from the storefront. You can restore them later from Restore."
              actionLabel={`Delete ${ids.length}`} confirmText="DELETE"
              onConfirm={async () => { await Promise.all(ids.map((id) => m.remove.mutateAsync({ id }))); clear(); }}
            />
          </>
        )}
      />
    </>
  );
}
