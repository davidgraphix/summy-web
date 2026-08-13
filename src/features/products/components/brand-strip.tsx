"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrands } from "@/features/brands/brands-hooks";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Horizontal brand filter, in the style of the category rails on Jumia/Temu:
 * always one row, swipeable on touch, drag-scrollable with a mouse, and
 * arrow-steppable on desktop. The row scrolls within its own container, so a
 * long brand list can never make the page itself scroll sideways.
 */
export function BrandStrip({ activeBrandId, onPick }: { activeBrandId?: string; onPick: (id: string | null) => void }) {
  const { data: brands, isLoading } = useBrands();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px of slack absorbs sub-pixel rounding at the end of the scroll range,
    // which would otherwise leave the right arrow permanently enabled.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateArrows();
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [brands, updateArrows]);

  const step = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(200, el.clientWidth * 0.8), behavior: "smooth" });
  };

  // Drag-to-scroll for mouse users. Touch is left to the browser's own inertial
  // scrolling, which feels better than anything reimplemented here.
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - delta;
  };

  const endDrag = () => { drag.current.active = false; };

  // A drag that travelled far enough must not also fire the button underneath.
  const onPickGuarded = (id: string | null) => {
    if (drag.current.moved) { drag.current.moved = false; return; }
    onPick(id);
  };

  if (isLoading) {
    return (
      <div className="border-b border-border bg-card py-4">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-hidden px-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 w-32 shrink-0 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }
  if (!brands?.length) return null;

  return (
    <div className="relative border-b border-border bg-card py-4">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        // overscroll-x-contain stops a swipe that reaches the end of this rail
        // from chaining into the page or triggering browser back-navigation.
        // Deliberately no `scroll-smooth` here: drag-to-scroll assigns scrollLeft
        // on every pointer move, and CSS smooth scrolling would animate each of
        // those assignments, making the drag lag behind the cursor. The arrow
        // buttons opt into smooth scrolling per call instead.
        className="no-scrollbar mx-auto flex max-w-6xl snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 md:px-12"
      >
        {brands.map((b) => {
          const on = activeBrandId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onPickGuarded(on ? null : b.id)}
              aria-pressed={on}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
              )}
            >
              {/*
                The real logo when the brand has one, the initial when it does
                not. `object-contain` on a padded tile rather than `object-cover`:
                manufacturer logos are wordmarks of wildly different aspect
                ratios, and cropping them to a square cuts the name in half.
              */}
              <span className={cn(
                "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold",
                on ? "bg-white/20" : "bg-muted"
              )}>
                {b.logoUrl ? (
                  <img
                    src={b.logoUrl}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  b.name.charAt(0)
                )}
              </span>
              {b.name}
              {on && <X size={14} />}
            </button>
          );
        })}
      </div>

      {/* Fades and arrows appear only on the side that still has content, and
          only from md up — on mobile the swipe itself is the affordance. */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-card to-transparent md:block" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-card to-transparent md:block" />
      )}

      <ArrowButton side="left" show={canScrollLeft} onClick={() => step(-1)} />
      <ArrowButton side="right" show={canScrollRight} onClick={() => step(1)} />
    </div>
  );
}

function ArrowButton({ side, show, onClick }: { side: "left" | "right"; show: boolean; onClick: () => void }) {
  if (!show) return null;
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll brands left" : "Scroll brands right"}
      className={cn(
        "absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted md:grid",
        side === "left" ? "left-1" : "right-1"
      )}
    >
      <Icon size={18} />
    </button>
  );
}
