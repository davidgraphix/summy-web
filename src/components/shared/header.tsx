"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ShoppingCart, User, ChevronDown } from "lucide-react";

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

export function Header() {
  const router = useRouter();
  const cart = useCart();
  const isAuth = useAuthStore((state) => state.isAuthenticated);
  const logout = useLogout();
  const unread = useUnreadCount();

  const [menu, setMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Update the shadow without resizing the header.
  useEffect(() => {
    let frameId = 0;

    const handleScroll = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 40);
        frameId = 0;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Close the account menu on outside clicks or Escape.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <header
      className={`sticky top-0 z-40 isolate w-full border-b border-border/70 ${
        isScrolled
          ? "shadow-md shadow-black/[0.06]"
          : "shadow-sm shadow-black/[0.02]"
      }`}
      style={{
        backgroundColor: "hsl(var(--background))",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="flex min-h-[76px] items-center gap-2 sm:min-h-[84px] sm:gap-4">
          {/* Logo */}
          <div className="flex min-w-0 shrink-0 items-center">
            <Logo className="shrink-0" />
          </div>

          {/* Search */}
          <div className="min-w-0 flex-1">
            <SearchBar className="w-full" />
          </div>

          {/* Notifications */}
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
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() =>
                isAuth ? setMenu((value) => !value) : router.push("/login")
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
                className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-border/70 bg-background p-1.5 shadow-xl shadow-black/10"
              >
                {/* Account heading */}
                <div className="border-b border-border/60 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <User size={18} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">My Account</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Manage your account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account links */}
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
                      <ChevronDown
                        size={14}
                        className="-rotate-90 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </nav>

                {/* Logout */}
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

          {/* Shopping cart */}
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
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
                {cart.count > 99 ? "99+" : cart.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
