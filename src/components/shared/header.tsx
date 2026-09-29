"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  ShoppingCart,
  User,
  ChevronDown,
} from "lucide-react";

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
  const [isScrolled, setIsScrolled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /*
   * -------------------------------------------------------------
   * SCROLL STATE
   * -------------------------------------------------------------
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
   * -------------------------------------------------------------
   * CLOSE ACCOUNT MENU WHEN CLICKING OUTSIDE
   * -------------------------------------------------------------
   */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenu(false);
      }
    };

    document.addEventListener("mousedown", onDoc);

    return () => {
      document.removeEventListener("mousedown", onDoc);
    };
  }, []);

  const unreadCount = unread.data?.unreadCount ?? 0;

  /*
   * -------------------------------------------------------------
   * ACTION BUTTON CLASSES
   * -------------------------------------------------------------
   */
  const actionButtonClass = `
    relative grid shrink-0 place-items-center
    rounded-xl
    border border-border/70
    bg-background/80
    text-foreground
    shadow-sm
    transition-all duration-200
    hover:border-primary/30
    hover:bg-muted
    hover:shadow-md
    active:scale-95
  `;

  return (
    <header
      className={`
        sticky top-0 z-40
        border-b border-border/70
        transition-all duration-300 ease-out
        ${
          isScrolled
            ? "shadow-md shadow-black/[0.04]"
            : "shadow-none"
        }
      `}
      style={{
        background: "hsl(var(--background) / 0.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">

        {/* =======================================================
            TOP / LOGO SECTION
            Expands at top, compresses when scrolling
        ======================================================= */}
        <div
          className={`
            flex items-center justify-center
            overflow-hidden
            transition-all duration-300 ease-out
            ${
              isScrolled
                ? "h-0 opacity-0"
                : "h-[110px] opacity-100 sm:h-[120px] md:h-[130px] lg:h-[140px]"
            }
          `}
        >
          <Logo
            className={`
              transition-transform duration-300
              ${
                isScrolled
                  ? "scale-75"
                  : "scale-100"
              }
            `}
          />
        </div>

        {/* =======================================================
            SEARCH + ACTIONS
        ======================================================= */}
        <div
          className={`
            flex items-center justify-center
            gap-2 sm:gap-3
            transition-all duration-300 ease-out
            ${
              isScrolled
                ? "py-3 sm:py-3"
                : "pb-5 sm:pb-6"
            }
          `}
        >
          {/* =====================================================
              SEARCH
          ===================================================== */}
          <div
            className={`
              min-w-0 flex-1
              transition-all duration-300
              ${
                isScrolled
                  ? "sm:max-w-[720px] lg:max-w-[760px]"
                  : "sm:max-w-[520px] md:max-w-[600px] lg:max-w-[700px]"
              }
            `}
          >
            <SearchBar className="w-full" />
          </div>

          {/* =====================================================
              NOTIFICATIONS
          ===================================================== */}
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className={`
              ${actionButtonClass}
              h-11 w-11
              sm:h-12 sm:w-12
            `}
          >
            <Bell
              size={19}
              strokeWidth={1.8}
              className="sm:h-5 sm:w-5"
            />

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
                  ring-2 ring-background
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* =====================================================
              ACCOUNT
          ===================================================== */}
          <div
            className="relative shrink-0"
            ref={menuRef}
          >
            <button
              onClick={() =>
                isAuth
                  ? setMenu((value) => !value)
                  : router.push("/login")
              }
              aria-label="Account"
              aria-expanded={isAuth ? menu : undefined}
              className={`
                ${actionButtonClass}
                h-11 w-11
                sm:h-12 sm:w-12
              `}
            >
              <User
                size={19}
                strokeWidth={1.8}
                className="sm:h-5 sm:w-5"
              />
            </button>

            {/* =================================================
                ACCOUNT DROPDOWN
            ================================================= */}
            {isAuth && menu && (
              <div
                className="
                  absolute right-0 top-full z-50 mt-3
                  w-56
                  overflow-hidden
                  rounded-2xl
                  border border-border/70
                  bg-card/95
                  py-1
                  shadow-2xl
                  backdrop-blur-xl
                  animate-in
                  fade-in
                  slide-in-from-top-2
                  duration-200
                "
              >
                {/* Account Header */}
                <div className="border-b border-border/60 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        grid h-9 w-9
                        place-items-center
                        rounded-full
                        bg-muted
                        text-muted-foreground
                      "
                    >
                      <User size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        My Account
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Manage your account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Links */}
                <div className="p-1.5">
                  {ACCOUNT_LINKS.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenu(false)}
                      className="
                        flex items-center justify-between
                        rounded-lg
                        px-3 py-2.5
                        text-sm
                        text-foreground
                        transition-colors
                        hover:bg-muted
                      "
                    >
                      <span>{label}</span>

                      <ChevronDown
                        size={14}
                        className="-rotate-90 text-muted-foreground"
                      />
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-border/60 p-1.5">
                  <button
                    onClick={() => {
                      setMenu(false);
                      logout.mutate();
                    }}
                    className="
                      flex w-full items-center gap-2
                      rounded-lg
                      px-3 py-2.5
                      text-sm
                      text-destructive
                      transition-colors
                      hover:bg-muted
                    "
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              CART
          ===================================================== */}
          <button
            onClick={openCart}
            aria-label="Shopping cart"
            className={`
              ${actionButtonClass}
              h-11 w-11
              sm:h-12 sm:w-12
            `}
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
                  ring-2 ring-background
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