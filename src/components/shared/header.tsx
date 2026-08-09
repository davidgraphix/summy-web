"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "@/components/shared/logo";
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
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : "/");
  };

  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border"
      style={{ background: "hsl(var(--background) / 0.82)", backdropFilter: "blur(12px)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo className="shrink-0" />

        <form onSubmit={submit} className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search TVs, fridges, brands…"
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </form>

        <Link href="/dashboard/notifications" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full" aria-label="Notifications">
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative shrink-0" ref={menuRef}>
          <button onClick={() => (isAuth ? setMenu((v) => !v) : router.push("/login"))}
            className="grid h-10 w-10 place-items-center rounded-full" aria-label="Account">
            <User size={19} />
          </button>
          {isAuth && menu && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
              {ACCOUNT_LINKS.map(({ label, href }) => (
                <Link key={href} href={href} onClick={() => setMenu(false)}
                  className="block px-4 py-2 text-sm hover:bg-muted">{label}</Link>
              ))}
              <button onClick={() => logout.mutate()} className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-sm text-destructive hover:bg-muted">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>

        <button onClick={openCart} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full" aria-label="Cart">
          <ShoppingCart size={20} />
          {cart.count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {cart.count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
