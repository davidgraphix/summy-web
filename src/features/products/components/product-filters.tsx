"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/features/categories/categories-hooks";
import type { ProductSortBy } from "@/features/products/products-api";

export interface FilterState {
  categoryId?: string;
  featured?: boolean;
  sortBy?: ProductSortBy;
}

const SORTS: Array<[ProductSortBy | "", string]> = [
  ["", "Recommended"],
  ["Newest", "Newest"],
  ["PriceLowToHigh", "Price: Low to High"],
  ["PriceHighToLow", "Price: High to Low"],
  ["Alphabetical", "A–Z"],
];

export function ProductFilters({
  state, onChange,
}: { state: FilterState; onChange: (next: FilterState) => void }) {
  const { data: categories } = useCategories();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">All Products</h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal size={15} />
          <select
            value={state.sortBy ?? ""}
            onChange={(e) => onChange({ ...state, sortBy: (e.target.value || undefined) as ProductSortBy | undefined })}
            className="h-9 rounded-lg border border-border bg-card pl-2 pr-7 text-sm font-medium text-foreground outline-none">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Pill active={!state.categoryId && !state.featured}
          onClick={() => onChange({ ...state, categoryId: undefined, featured: false })}>All</Pill>
        <Pill active={!!state.featured}
          onClick={() => onChange({ ...state, featured: !state.featured, categoryId: undefined })}>Featured</Pill>
        {categories?.map((c) => (
          <Pill key={c.id} active={state.categoryId === c.id}
            onClick={() => onChange({ ...state, categoryId: state.categoryId === c.id ? undefined : c.id, featured: false })}>
            {c.name}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
      {children}
    </button>
  );
}
