"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * The site's single search control.
 *
 * <p>
 * There used to be two — one in the header, one on the storefront — which was
 * not just duplication: the header's pushed <code>/?search=…</code> while the
 * storefront read that parameter only into <code>useState</code>'s initial
 * value, so every header search after the first silently did nothing. The URL
 * is now the single source of truth, which fixes that class of bug outright and
 * makes a search result shareable, bookmarkable and survivable across a reload.
 * </p>
 */
interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  /** Called once a search has been committed — used to close the mobile sheet. */
  onSubmitted?: () => void;
}

/**
 * Suspense boundary, owned here rather than left to every caller.
 *
 * <p>
 * <code>useSearchParams</code> opts a subtree out of prerendering unless it sits
 * under Suspense. This bar lives in the site header, so without the boundary in
 * this file every statically generated page that renders the header fails the
 * production build — which is exactly what happened. Keeping it with the
 * component means a new consumer cannot forget it.
 * </p>
 */
export function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarSkeleton className={props.className} />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}

/** Matches the real field's dimensions exactly, so nothing shifts on hydration. */
function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative min-w-0", className)} aria-hidden>
      <div className="h-11 w-full rounded-full border border-border bg-card" />
    </div>
  );
}

function SearchBarInner({
  className,
  autoFocus = false,
  placeholder = "Search TVs, fridges, air conditioners…",
  onSubmitted,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlTerm = params.get("search") ?? "";
  const [value, setValue] = useState(urlTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  // 350ms: long enough that ordinary typing produces one request rather than
  // one per keystroke, short enough that the results feel like they are keeping
  // up. Below ~250ms a fast typist still fires several requests; above ~500ms
  // the pause becomes noticeable.
  const debounced = useDebounce(value, 350);

  /**
   * Tracks whether the field has diverged from the URL. Without it, the effect
   * below would push a navigation on mount for a URL that already carries the
   * term, and again on every back/forward.
   */
  const dirty = useRef(false);

  // Keep the field in step when the URL changes underneath it — a back button,
  // a "clear filters" action, or a link into a pre-filled search.
  useEffect(() => {
    if (!dirty.current) setValue(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (!dirty.current) return;
    if (debounced === urlTerm) return;

    const next = new URLSearchParams(params.toString());

    if (debounced.trim()) next.set("search", debounced.trim());
    else next.delete("search");

    // Searching from a product page, the cart, or anywhere else should land on
    // the catalogue — that is where results are rendered.
    const target = pathname === "/" ? "/" : "/";
    const query = next.toString();

    // replace, not push: a search refined character by character would
    // otherwise bury the previous page under a dozen history entries and make
    // the back button useless.
    router.replace(query ? `${target}?${query}` : target, { scroll: false });
  }, [debounced, urlTerm, params, pathname, router]);

  const commit = (term: string) => {
    dirty.current = true;
    setValue(term);
  };

  const clear = () => {
    commit("");
    inputRef.current?.focus();
  };

  // The term is committed but the debounce has not yet caught up.
  const pending = dirty.current && value !== debounced;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();

        // Enter should not wait out the debounce.
        dirty.current = true;
        const term = value.trim();
        const next = new URLSearchParams(params.toString());

        if (term) next.set("search", term);
        else next.delete("search");

        const query = next.toString();
        router.replace(query ? `/?${query}` : "/", { scroll: false });

        // Dismisses the on-screen keyboard on mobile, which otherwise covers
        // the results the customer just asked for.
        inputRef.current?.blur();
        onSubmitted?.();
      }}
      className={cn("relative min-w-0", className)}
    >
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />

      <input
        ref={inputRef}
        type="search"
        name="search"
        value={value}
        onChange={(e) => commit(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autoFocus}
        autoComplete="off"
        // enterKeyHint puts "Search" on the mobile keyboard's action key
        // instead of "Go", which is what the customer is actually doing.
        enterKeyHint="search"
        className={cn(
          "h-11 w-full rounded-full border border-border bg-card pl-9 pr-10 text-sm outline-none",
          "focus:border-primary",
          // 16px on mobile: anything smaller makes iOS Safari zoom the whole
          // page on focus, which then leaves the layout scrolled sideways.
          "text-base sm:text-sm",
          // Safari renders its own clear affordance on type=search; ours is
          // consistent across browsers and reachable by keyboard.
          "[&::-webkit-search-cancel-button]:appearance-none"
        )}
      />

      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
        {pending && <Spinner className="h-4 w-4 text-muted-foreground" />}

        {!pending && value.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            // 32px hit area inside a 44px-tall field: comfortably tappable
            // without crowding the text.
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </form>
  );
}
