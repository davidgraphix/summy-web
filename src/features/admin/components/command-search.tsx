"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ALL_NAV_ITEMS } from "../admin-nav";
import { cn } from "@/lib/utils";

/**
 * Command palette (⌘K / Ctrl+K). Navigates the admin surface without reaching
 * for the mouse — the fastest path between any two pages.
 */
export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.href.includes(q));
  }, [query]);

  useEffect(() => setActive(0), [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 sm:w-64"
        aria-label="Search admin (Command K)">
        <Search size={15} />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-sans text-[10px] font-semibold sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md" className="p-0">
          <DialogTitle className="sr-only">Search admin</DialogTitle>

          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to…"
              aria-label="Jump to page"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter") {
                  const item = results[active];
                  if (item) go(item.href);
                }
              }}
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for “{query}”</p>
            ) : (
              results.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button key={item.href} onClick={() => go(item.href)} onMouseEnter={() => setActive(i)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      i === active ? "bg-muted" : "hover:bg-muted/60")}>
                    <Icon size={16} className="shrink-0 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">{item.href}</span>
                    {i === active && <CornerDownLeft size={13} className="shrink-0 text-muted-foreground" />}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
