"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { BrandStrip } from "@/features/products/components/brand-strip";
import { ProductFilters, type FilterState } from "@/features/products/components/product-filters";
import { ProductCard, ProductCardSkeleton } from "@/features/products/components/product-card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useProductFeed } from "@/features/products/products-hooks";
import { useBrands } from "@/features/brands/brands-hooks";

const PAGE_SIZE = 24;

function Storefront() {
  const params = useSearchParams();

  // The URL is the single source of truth for the search term, written by the
  // one SearchBar in the header. Reading it here (rather than keeping a second
  // copy in state) is what makes header searches actually work: the previous
  // version seeded useState from the URL once, so every search after the first
  // updated the address bar and changed nothing on screen.
  const search = params.get("search")?.trim() ?? "";

  const [brandId, setBrandId] = useState<string | undefined>();
  const [filters, setFilters] = useState<FilterState>({});

  const router = useRouter();
  const { data: brands } = useBrands();
  const activeBrand = brands?.find((b) => b.id === brandId);

  /** Resets every filter, including the URL-held search term. */
  const clearAll = () => {
    setBrandId(undefined);
    setFilters({});
    router.replace("/", { scroll: false });
  };

  // No page number here: it is the feed's cursor, not a filter. Every value
  // below is part of the query key, so changing any of them starts a fresh
  // feed at page one automatically — there is no page state left to reset.
  //
  // The term arrives already debounced by the SearchBar, which owns that
  // timing; debouncing again here would only add latency.
  const query = useMemo(
    () => ({
      search: search || undefined,
      brandId,
      categoryId: filters.categoryId,
      featured: filters.featured || undefined,
      sortBy: filters.sortBy,
    }),
    [search, brandId, filters]
  );

  const {
    data, isLoading, isError, refetch,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useProductFeed(query, PAGE_SIZE);

  // Flattened once per data change. Deduplicated by id as a safety net: the
  // server sort is now totally ordered, but a product created between two page
  // requests could still shift the window, and a repeated key would break React.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((p) => p.items).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data]);

  // Changing any filter restarts the feed at page one. Without this the reader
  // keeps whatever scroll depth they had built up, and because the list has just
  // shrunk the browser clamps them to the bottom of the new results instead of
  // the top. Skipped on first render so a deep link does not fight the browser's
  // own scroll restoration.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [query]);

  // Sentinel below the grid: once it scrolls into view the next batch loads.
  // rootMargin starts the fetch before the user actually reaches the bottom.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  return (
    <>
      <BrandStrip
        activeBrandId={brandId}
        onPick={(id) => setBrandId(id ?? undefined)}
      />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
        {/*
          Active filters, shown as removable chips. Wraps rather than scrolls, so
          nothing is hidden off the right edge on a narrow screen.
        */}
        {(search || activeBrand) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Showing</span>

            {search && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
                <span className="truncate">results for “{search}”</span>
              </span>
            )}

            {activeBrand && (
              <button onClick={() => setBrandId(undefined)}
                aria-label={`Remove ${activeBrand.name} filter`}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground">
                {activeBrand.name} <X size={13} />
              </button>
            )}
          </div>
        )}

        <ProductFilters state={filters} onChange={setFilters} />

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {/* gap-3 at 320-360px: gap-4 leaves each of two columns under 140px,
                which crams the price and the add-to-cart button. */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)
                : items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {!isLoading && items.length === 0 && (
              <EmptyState
                icon={<Search size={30} />}
                title={search ? `No results for “${search}”` : "No products match your filters"}
                description={
                  search
                    ? "Check the spelling, try a broader term such as “fridge” or “air conditioner”, or clear your filters."
                    : "Try removing a filter to see more of the catalogue."
                }
                action={<Button variant="outline" onClick={clearAll}>Clear all filters</Button>}
              />
            )}

            {/* Skeletons for the batch in flight, so the grid grows rather than
                jumping when the new products land. */}
            {isFetchingNextPage && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}

            {/* Watched by the IntersectionObserver above. Rendered only while
                more pages exist, so the observer stops firing when the feed
                is exhausted. */}
            {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}

            {isFetchingNextPage && (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" /> Loading more products…
              </p>
            )}

            {/* Manual fallback: keyboard users, and anyone whose browser does
                not fire the observer, can still reach the rest of the catalogue. */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <Button variant="outline" onClick={() => void fetchNextPage()}>Load more</Button>
              </div>
            )}

            {!isLoading && !hasNextPage && items.length > 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">You have reached the end of the catalogue.</p>
            )}
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
