import { Header } from "@/components/shared/header";
import { CartDrawer } from "@/components/shared/cart-drawer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      {children}
      <CartDrawer />
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-muted-foreground">
        Summy Solution &amp; Technology Ventures · BN-3217879 · Nationwide delivery across Nigeria
      </footer>
    </div>
  );
}
