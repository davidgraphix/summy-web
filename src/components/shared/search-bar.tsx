"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * The site's single search control. The URL (?search=…) is the source of
 * truth, so results are shareable, bookmarkable and survive a reload.
 */
interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  /** Called once a search has been committed (e.g. to close a mobile sheet). */
  onSubmitted?: () => void;
}

/**
 * useSearchParams needs a Suspense boundary or statically generated pages that
 * render the header fail the production build. It lives here so no consumer
 * can forget it.
 */
export function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarSkeleton className={props.className} />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}

/** Same dimensions as the real field, so nothing shifts on hydration. */
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
  const params = useSearchParams();
  const [isNavigating, startTransition] = useTransition();

  const urlTerm = params.get("search")?.trim() ?? "";
  const [value, setValue] = useState(urlTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  // 350ms: one request per pause in typing, not one per keystroke.
  const debounced = useDebounce(value, 350);

  /** The last term this component put in the URL. */
  const lastWritten = useRef(urlTerm);

  const writeTerm = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (term === lastWritten.current) return;
      lastWritten.current = term;

      // Read from the live URL so other params are never lost to a stale closure.
      const next = new URLSearchParams(window.location.search);
      if (term) next.set("search", term);
      else next.delete("search");

      const query = next.toString();

      // Results render on the catalogue, so searching from any page lands on "/".
      // replace, not push: refining a search must not bury the back button.
      startTransition(() => {
        router.replace(query ? `/?${query}` : "/", { scroll: false });
      });
    },
    [router]
  );

  // The URL changed from outside (back/forward, "Clear all filters", a link
  // into a pre-filled search): show it in the field. Skipped while one of our
  // own navigations is in flight, so a slow response can never overwrite what
  // the customer is typing.
  useEffect(() => {
    if (isNavigating || urlTerm === lastWritten.current) return;
    lastWritten.current = urlTerm;
    setValue(urlTerm);
  }, [urlTerm, isNavigating]);

  // Typing: write to the URL once the debounce settles.
  useEffect(() => {
    writeTerm(debounced);
  }, [debounced, writeTerm]);

  const clear = () => {
    setValue("");
    writeTerm(""); // no need to wait out the debounce
    inputRef.current?.focus();
  };

  // Typed but not yet reflected in the URL, or the results are still loading.
  const pending = value.trim() !== urlTerm || isNavigating;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        writeTerm(value); // Enter should not wait out the debounce
        // Dismiss the mobile keyboard so it doesn't cover the results.
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
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-full border border-border bg-card pl-9 pr-10 outline-none",
          "focus:border-primary",
          // 16px on mobile: smaller makes iOS Safari zoom the page on focus.
          "text-base sm:text-sm",
          // Use our own clear button instead of Safari's.
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        )}
      />

      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
        {pending && value.length > 0 && (
          <Spinner className="h-4 w-4 text-muted-foreground" />
        )}

        {!pending && value.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </form>
  );
}