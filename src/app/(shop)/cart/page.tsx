"use client";

import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { useCart } from "@/features/cart/use-cart";

export default function CartPage() {
  const cart = useCart();

  if (cart.isLoading) return <LoadingState label="Loading your cart…" />;

  if (cart.lines.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Your Cart</h1>
        <EmptyState
          icon={<ShoppingCart size={30} />}
          title="Your cart is empty"
          description="Browse our catalogue and add items to get started."
          action={<Link href="/" className={buttonVariants()}>Start shopping</Link>}
        />
      </main>
    );
  }

  const server = cart.cart;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Cart</h1>
          <p className="text-sm text-muted-foreground">
            {cart.count} {cart.count === 1 ? "item" : "items"}
          </p>
        </div>
        <button onClick={cart.clear} disabled={cart.pending}
          className="flex items-center gap-1.5 text-sm font-medium text-destructive disabled:opacity-50">
          <Trash2 size={15} /> Clear cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {cart.lines.map((l) => (
            <Card key={l.productId}>
              <CardContent className="flex gap-4 p-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground/40">
                  {l.imageUrl
                    ? <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                    : <Package size={32} strokeWidth={1.4} />}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  {l.productSlug ? (
                    <Link href={`/products/${l.productSlug}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">
                      {l.productName}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 font-medium leading-snug">{l.productName}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{l.currentUnitPriceFormatted} each</p>
                  {!l.isAvailable && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {l.unavailableReason ?? "No longer available"}
                    </p>
                  )}
                  {l.priceChanged && l.isAvailable && (
                    <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Price {l.priceDifferenceInKobo < 0 ? "dropped" : "changed"} since you added this
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <QuantityStepper
                      value={l.quantity}
                      onChange={(q) => cart.setQuantity(l.productId, q)}
                      disabled={cart.pending}
                    />
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold">{l.lineTotalFormatted}</span>
                      <button onClick={() => cart.remove(l.productId)} aria-label="Remove item"
                        className="text-destructive disabled:opacity-50" disabled={cart.pending}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Order Summary</h2>

              <dl className="space-y-2 text-sm">
                <Row label="Subtotal" value={server?.subtotalFormatted ?? "—"} />
                {server && <Row label="Delivery" value={server.deliveryFeeInKobo === 0 ? "Free" : server.deliveryFeeFormatted} />}
                {server && <Row label="VAT" value={server.vatFormatted} />}
              </dl>

              {server?.warnings.map((w) => (
                <p key={w} className="mt-3 text-xs font-medium text-destructive">{w}</p>
              ))}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">{server?.totalFormatted ?? "—"}</span>
              </div>

              <Link href="/checkout" aria-disabled={server ? !server.isCheckoutReady : undefined}
                className={buttonVariants({
                  className: `mt-5 w-full ${server && !server.isCheckoutReady ? "pointer-events-none opacity-50" : ""}`,
                })}>
                Proceed to checkout <ArrowRight size={18} />
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-2 w-full" })}>
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
