"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Gift, Heart, LayoutDashboard, LogOut, MapPin, Package, ShieldCheck, User,
} from "lucide-react";
import { Header } from "@/components/shared/header";
import { CartDrawer } from "@/components/shared/cart-drawer";
import { AuthGuard } from "@/components/shared/auth-guard";
import { useLogout } from "@/features/auth/auth-hooks";
import { useUnreadCount } from "@/features/notifications/notifications-hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const unread = useUnreadCount();
  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <AuthGuard>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:gap-6 sm:py-6 lg:grid-cols-[240px_1fr]">
          {/*
            min-w-0 is what keeps the whole dashboard inside the viewport.

            A grid item defaults to `min-width: auto`, meaning it refuses to be
            narrower than its own content. The tab rail below is a nowrap flex row
            about 1150px wide; without this, that width became the grid column's
            width, so at a 375px viewport the page canvas measured 1151px — the
            entire dashboard laid itself out at desktop width and the browser
            scrolled sideways over it. `overflow-x-auto` on the rail could not
            help, because the rail was never the thing being constrained.

            <main> already carried min-w-0. The nav did not, and in a
            single-column grid both items share one column, so the nav alone was
            enough to stretch everything.
          */}
          <nav className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            {/*
              overscroll-x-contain stops a swipe that reaches the end of this
              rail from chaining into the page and triggering browser
              back-navigation; no-scrollbar hides the bar that would otherwise
              sit across the tabs on desktop trackpads.
            */}
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href} className="shrink-0 lg:shrink">
                    <Link href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        // min-h-11 rather than padding alone: the rail is the
                        // primary navigation on a phone and each tab has to be a
                        // comfortable target, not a 36px sliver.
                        "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <Icon size={17} />
                      {label}
                      {href === "/dashboard/notifications" && unreadCount > 0 && (
                        <span className={cn("ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold",
                          active ? "bg-white/20 text-white" : "bg-destructive text-white")}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              <li className="shrink-0 lg:shrink lg:pt-2">
                <button onClick={() => logout.mutate()}
                  className="flex min-h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                  <LogOut size={17} /> Log out
                </button>
              </li>
            </ul>
          </nav>

          <main className="min-w-0">{children}</main>
        </div>
      </AuthGuard>
      <CartDrawer />
    </div>
  );
}
