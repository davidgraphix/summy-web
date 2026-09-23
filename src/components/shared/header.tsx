"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ShoppingCart, User } from "lucide-react";

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

export function Header() {
  const router = useRouter();
  const cart = useCart();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();
  const unread = useUnreadCount();

  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    };

    document.addEventListener("mousedown", onDoc);

    return () => {
      document.removeEventListener("mousedown", onDoc);
    };
  }, []);

  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70"
      style={{
        background: "hsl(var(--background) / 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        {/* =========================================================
            LOGO
        ========================================================= */}
        <div className="flex h-[125px] items-center justify-center sm:h-[135px] md:h-[145px] lg:h-[160px]">
          <Logo />
        </div>

        {/* =========================================================
            SEARCH + ACTIONS
        ========================================================= */}
        <div className="flex items-center justify-center gap-2 pb-5 sm:gap-3 sm:pb-6">
          {/* Search */}
          <div className="w-full sm:max-w-[520px] md:max-w-[560px] lg:max-w-[700px]">
            <SearchBar className="w-full" />
          </div>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="
              relative grid h-11 w-11 shrink-0
              place-items-center
              rounded-xl
              border border-border/70
              bg-background
              text-foreground
              shadow-sm
              transition-all duration-200
              hover:border-primary/30
              hover:bg-muted
              hover:shadow-md
              active:scale-95
              sm:h-12 sm:w-12
            "
          >
            <Bell size={19} strokeWidth={1.8} className="sm:h-5 sm:w-5" />

            {unreadCount > 0 && (
              <span
                className="
                  absolute -right-1 -top-1
                  grid h-[18px] min-w-[18px]
                  place-items-center
                  rounded-full
                  bg-destructive
                  px-1
                  text-[10px]
                  font-bold
                  leading-none
                  text-white
                  shadow-sm
                  ring-2
                  ring-background
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() =>
                isAuth ? setMenu((value) => !value) : router.push("/login")
              }
              aria-label="Account"
              aria-expanded={isAuth ? menu : undefined}
              className="
                grid h-11 w-11 shrink-0
                place-items-center
                rounded-xl
                border border-border/70
                bg-background
                text-foreground
                shadow-sm
                transition-all duration-200
                hover:border-primary/30
                hover:bg-muted
                hover:shadow-md
                active:scale-95
                sm:h-12 sm:w-12
              "
            >
              <User size={19} strokeWidth={1.8} className="sm:h-5 sm:w-5" />
            </button>

            {isAuth && menu && (
              <div
                className="
                  absolute right-0 top-full z-50 mt-2
                  w-52
                  overflow-hidden
                  rounded-2xl
                  border border-border/70
                  bg-card
                  py-1
                  shadow-xl
                "
              >
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-semibold">My Account</p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage your account
                  </p>
                </div>

                {ACCOUNT_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenu(false)}
                    className="
                      block px-4 py-2.5
                      text-sm
                      transition-colors
                      hover:bg-muted
                    "
                  >
                    {label}
                  </Link>
                ))}

                <button
                  onClick={() => {
                    setMenu(false);
                    logout.mutate();
                  }}
                  className="
                    flex w-full items-center gap-2
                    border-t border-border/60
                    px-4 py-2.5
                    text-sm text-destructive
                    transition-colors
                    hover:bg-muted
                  "
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label="Shopping cart"
            className="
              relative grid h-11 w-11 shrink-0
              place-items-center
              rounded-xl
              border border-border/70
              bg-background
              text-foreground
              shadow-sm
              transition-all duration-200
              hover:border-primary/30
              hover:bg-muted
              hover:shadow-md
              active:scale-95
              sm:h-12 sm:w-12
            "
          >
            <ShoppingCart
              size={20}
              strokeWidth={1.8}
              className="sm:h-5 sm:w-5"
            />

            {cart.count > 0 && (
              <span
                className="
                  absolute -right-1 -top-1
                  grid h-[18px] min-w-[18px]
                  place-items-center
                  rounded-full
                  bg-destructive
                  px-1
                  text-[10px]
                  font-bold
                  leading-none
                  text-white
                  shadow-sm
                  ring-2
                  ring-background
                "
              >
                {cart.count > 99 ? "99+" : cart.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
