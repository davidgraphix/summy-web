import { Header } from "@/components/shared/header";
import { CartDrawer } from "@/components/shared/cart-drawer";
import { StoreFooter } from "@/components/shared/store-footer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      {children}
      <CartDrawer />
      <StoreFooter />
    </div>
  );
}
