"use client";

import { useEffect, useRef, useState } from "react";
import { useBrands } from "@/features/brands/brands-hooks";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function BrandStrip({ activeBrandId, onPick }: { activeBrandId?: string; onPick: (id: string | null) => void }) {
  const { data: brands, isLoading } = useBrands();
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  // The marquee illusion works by doubling the brand list and scrolling it by
  // exactly half its width so it loops seamlessly — but that only reads
  // correctly while the animation is actually running AND the content is
  // wider than its container. Otherwise both copies just sit there,
  // statically visible, which is exactly what showed up as "brands appear
  // twice". So: measure the single (undoubled) row against its container,
  // and only double + animate when it would actually overflow and motion
  // isn't disabled; otherwise render one copy in a normal wrapping row.
  useEffect(() => {
    if (!brands?.length) { setShouldMarquee(false); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShouldMarquee(false);
      return;
    }

    const measure = () => {
      const wrap = wrapRef.current;
      const row = rowRef.current;
      if (!wrap || !row) return;
      setShouldMarquee(row.scrollWidth > wrap.clientWidth);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [brands]);

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

  const row = shouldMarquee ? [...brands, ...brands] : brands;

  return (
    <div ref={wrapRef} className="relative overflow-hidden border-b border-border bg-card py-4">
      <div ref={rowRef}
        className={cn("flex gap-3 px-4", shouldMarquee ? "marquee-track w-max" : "flex-wrap justify-center")}>
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
      {shouldMarquee && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
        </>
      )}
    </div>
  );
}
