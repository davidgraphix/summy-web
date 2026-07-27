"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { BrandStrip } from "@/features/products/components/brand-strip";
import { ProductFilters, type FilterState } from "@/features/products/components/product-filters";
import { ProductCard, ProductCardSkeleton } from "@/features/products/components/product-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/products/products-hooks";
import { useBrands } from "@/features/brands/brands-hooks";
import { useDebounce } from "@/hooks/use-debounce";

function Storefront() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const debounced = useDebounce(search, 300);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(1);

  const { data: brands } = useBrands();
  const activeBrand = brands?.find((b) => b.id === brandId);

  const query = useMemo(
    () => ({
      pageNumber: page,
      pageSize: 12,
      search: debounced || undefined,
      brandId,
      categoryId: filters.categoryId,
      featured: filters.featured || undefined,
      sort: filters.sort,
    }),
    [page, debounced, brandId, filters]
  );

  const { data, isLoading, isError, refetch, isFetching } = useProducts(query);
  const items = data?.items ?? [];

  const resetPageAnd = <T,>(fn: (v: T) => void) => (v: T) => { setPage(1); fn(v); };

  return (
    <>
      <BrandStrip
        activeBrandId={brandId}
        onPick={(id) => { setPage(1); setBrandId(id ?? undefined); }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search products or brands…"
            className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>

        {activeBrand && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtered by</span>
            <button onClick={() => setBrandId(undefined)}
              className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground">
              {activeBrand.name} <X size={13} />
            </button>
          </div>
        )}

        <ProductFilters state={filters} onChange={resetPageAnd(setFilters)} totalCount={data?.totalCount} />

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {!isLoading && items.length === 0 && (
              <EmptyState
                icon={<Search size={30} />}
                title="No products match your search"
                description="Try a different keyword or clear your filters."
                action={<Button variant="outline" onClick={() => { setSearch(""); setBrandId(undefined); setFilters({}); setPage(1); }}>Clear all filters</Button>}
              />
            )}

            {data && (
              <Pagination page={data.pageNumber} totalPages={data.totalPages}
                hasPrev={data.hasPreviousPage} hasNext={data.hasNextPage}
                onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            )}
            {isFetching && !isLoading && <p className="pb-4 text-center text-xs text-muted-foreground">Updating…</p>}
          </>
        )}
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-6"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({length:8}).map((_,i)=><ProductCardSkeleton key={i}/>)}</div></main>}>
      <Storefront />
    </Suspense>
  );
}
