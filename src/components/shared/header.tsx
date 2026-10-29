"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ShoppingCart, User, ChevronRight } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { SearchBar } from "@/components/shared/search-bar";
import { openCart } from "@/components/shared/cart-drawer";
import { useCart } from "@/features/cart/use-cart";
import { useAuthStore } from "@/features/auth/auth-store";
import { useLogout } from "@/features/auth/auth-hooks";
import { useUnreadCount } from "@/features/notifications/notifications-hooks";

const ACCOUNT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Wishlist", href: "/dashboard/wishlist" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Settings", href: "/dashboard/security" },
] as const;

const actionButtonClass =
  "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-background text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-11 sm:w-11";

const badgeClass =
  "absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background";

export function Header() {
  const router = useRouter();
  const cart = useCart();
  const isAuth = useAuthStore((state) => state.isAuthenticated);
  const logout = useLogout();
  const unread = useUnreadCount();

  const [menu, setMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only touches React state when the threshold is crossed, not on every scroll event.
  useEffect(() => {
    let frameId = 0;
    let previous = false;

    const update = () => {
      const next = window.scrollY > 8;
      if (next !== previous) {
        previous = next;
        setIsScrolled(next);
      }
      frameId = 0;
    };

    const onScroll = () => {
      if (frameId === 0) frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
    };
  }, []);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-border/70 bg-background transition-shadow duration-200 ${
        isScrolled ? "shadow-md shadow-black/[0.06]" : "shadow-none"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        {/*
          Mobile: row 1 = logo + actions, row 2 = full-width search.
          sm and up: everything on a single row.
        */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 py-2.5 sm:min-h-[84px] sm:flex-nowrap sm:gap-3 sm:py-0 lg:gap-4">
          {/* Logo */}
          <div className="order-1 mr-auto flex min-w-0 shrink-0 items-center sm:mr-0">
            <Logo className="h-9 w-auto sm:h-11" />
          </div>

          {/* Actions */}
          <div className="order-2 flex shrink-0 items-center gap-2 sm:order-3 sm:gap-3">
            <Link
              href="/dashboard/notifications"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
              className={actionButtonClass}
            >
              <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className={badgeClass}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() =>
                  isAuth ? setMenu((v) => !v) : router.push("/login")
                }
                aria-label="Account"
                aria-expanded={isAuth ? menu : undefined}
                aria-haspopup={isAuth ? "menu" : undefined}
                className={actionButtonClass}
              >
                <User size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>

              {isAuth && menu && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 top-full z-50 mt-3 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border/70 bg-background p-1.5 shadow-xl shadow-black/10"
                >
                  <div className="flex items-center gap-3 border-b border-border/60 px-3 py-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <User size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">My Account</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Manage your account
                      </p>
                    </div>
                  </div>

                  <nav aria-label="Account navigation" className="py-1">
                    {ACCOUNT_LINKS.map(({ label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={() => setMenu(false)}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted"
                      >
                        <span>{label}</span>
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Link>
                    ))}
                  </nav>

                  <div className="border-t border-border/60 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={logout.isPending}
                      onClick={() => {
                        setMenu(false);
                        logout.mutate();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive outline-none transition-colors duration-150 hover:bg-destructive/10 focus-visible:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={15} aria-hidden="true" />
                      {logout.isPending ? "Logging out..." : "Log out"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              type="button"
              onClick={openCart}
              aria-label={
                cart.count > 0
                  ? `Shopping cart, ${cart.count} items`
                  : "Shopping cart"
              }
              className={actionButtonClass}
            >
              <ShoppingCart size={19} strokeWidth={1.8} aria-hidden="true" />
              {cart.count > 0 && (
                <span className={badgeClass}>
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              )}
            </button>
          </div>

          {/* Search: full-width second row on mobile, flexible middle on sm+ */}
          <div className="order-3 w-full min-w-0 basis-full sm:order-2 sm:basis-0 sm:flex-1">
            <SearchBar className="w-full min-w-0" />
          </div>
        </div>
      </div>
    </header>
  );
}