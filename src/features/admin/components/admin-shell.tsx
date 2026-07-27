"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, ChevronLeft, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeft, User, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Hint } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLogout } from "@/features/auth/auth-hooks";
import { useProfile } from "@/features/customer/customer-hooks";
import { useUnreadCount } from "@/features/notifications/notifications-hooks";
import { useHasPermission } from "../permissions";
import { ADMIN_NAV, type NavItem } from "../admin-nav";
import { CommandSearch } from "./command-search";

const SIDEBAR_KEY = "summy.admin.sidebar-collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useLogout();
  const { data: profile } = useProfile();
  const unread = useUnreadCount();
  const unreadCount = unread.data?.count ?? 0;

  // Persist the collapsed preference across sessions.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch { /* storage unavailable — keep default */ }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  // Close the mobile drawer on navigation.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const name = profile?.fullName
    ?? [profile?.firstName, profile?.lastName].filter(Boolean).join(" ")
    ?? "Account";

  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-60"
        )}>
        <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
          <Link href="/admin" className="flex items-center gap-2 overflow-hidden" aria-label="Admin home">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ background: "conic-gradient(from 210deg, hsl(var(--accent)), hsl(var(--primary)))" }}>
              <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] bg-white" />
            </span>
            {!collapsed && (
              <span className="truncate">
                <span className="block text-sm font-extrabold leading-tight tracking-tight">SUMMY</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {ADMIN_NAV.map((section) => (
            <NavGroup key={section.title} title={section.title} items={section.items}
              pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <button onClick={toggleCollapsed}
            className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeft size={17} /> : <><PanelLeftClose size={17} /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* ---------- Sidebar (mobile drawer) ---------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-card">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-extrabold tracking-tight">SUMMY ADMIN</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><X size={18} /></button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {ADMIN_NAV.map((section) => (
                <NavGroup key={section.title} title={section.title} items={section.items}
                  pathname={pathname} collapsed={false} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ---------- Main column ---------- */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-60")}>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border px-4"
          style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-muted lg:hidden">
            <Menu size={19} />
          </button>

          <CommandSearch />

          <div className="ml-auto flex items-center gap-1">
            <Hint label="View storefront">
              <Link href="/" target="_blank" rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ExternalLink size={16} />
                <span className="sr-only">View storefront</span>
              </Link>
            </Hint>

            <Hint label="Notifications">
              <Link href="/dashboard/notifications"
                className="relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Link>
            </Hint>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted" aria-label="Account menu">
                  <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground">
                    {profile?.avatarUrl
                      ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                      : <User size={15} />}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">{name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case">
                  <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{profile?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard/profile"><User size={15} /> My profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard"><ChevronLeft size={15} /> Customer account</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => logout.mutate()}><LogOut size={15} /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ title, items, pathname, collapsed }: {
  title: string; items: NavItem[]; pathname: string; collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{title}</p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />)}
      </ul>
    </div>
  );
}

function NavLink({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  // Permission check runs per-item so the sidebar only shows reachable pages.
  const allowed = useHasPermission(item.permission);
  if (!allowed) return null;

  const Icon = item.icon;
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const link = (
    <Link href={item.href} aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0"
      )}>
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );

  return <li>{collapsed ? <Hint label={item.label} side="right">{link}</Hint> : link}</li>;
}
