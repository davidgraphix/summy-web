"use client";

import { useBrands } from "@/features/brands/brands-hooks";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function BrandStrip({ activeBrandId, onPick }: { activeBrandId?: string; onPick: (id: string | null) => void }) {
  const { data: brands, isLoading } = useBrands();
  if (isLoading) {
    return (
      <div className="border-b border-border bg-card py-4">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-hidden px-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 w-32 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }
  if (!brands?.length) return null;
  const row = [...brands, ...brands];
  return (
    <div className="relative overflow-hidden border-b border-border bg-card py-4">
      <div className="marquee-track flex w-max gap-3 px-4">
        {row.map((b, i) => {
          const on = activeBrandId === b.id;
          return (
            <button key={b.id + "-" + i} onClick={() => onPick(on ? null : b.id)}
              className={cn("flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>
              <span className={cn("grid h-8 w-8 place-items-center rounded-xl text-xs font-bold",
                on ? "bg-white/20" : "bg-muted")}>{b.name.charAt(0)}</span>
              {b.name}
              {on && <X size={14} />}
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
    </div>
  );
}
