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
  const unreadCount = unread.data?.count ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <AuthGuard>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
          {/* Mobile: horizontal scroller. Desktop: sticky sidebar. */}
          <nav className="lg:sticky lg:top-20 lg:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href} className="shrink-0 lg:shrink">
                    <Link href={href}
                      className={cn(
                        "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
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
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
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
