"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/features/cart/use-cart";

/** Lightweight global open/close via a module store (no context needed). */
let openSetter: ((v: boolean) => void) | null = null;
export function openCart() { openSetter?.(true); }

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  openSetter = setOpen;
  const cart = useCart();

  return (
    <>
      <div onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog" aria-label="Shopping cart">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-bold">Your Cart{cart.count > 0 ? ` (${cart.count})` : ""}</span>
          <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-card text-primary"><ShoppingCart size={28} /></div>
              <p className="text-lg font-bold">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Add items to start your order.</p>
              <Button className="mt-5" onClick={() => setOpen(false)}>Continue shopping</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.lines.map((l) => (
                <div key={l.productId} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground/40">
                    {l.imageUrl ? <img src={l.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={26} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{l.name}</p>
                    <p className="mt-0.5 text-sm font-bold">{formatNaira(l.unitPrice)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper value={l.quantity} onChange={(q) => cart.setQuantity(l.productId, q)} />
                      <button onClick={() => cart.remove(l.productId)} aria-label="Remove" className="text-destructive"><Trash2 size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={cart.clear} className="py-2 text-sm font-medium text-destructive">Clear cart</button>
            </div>
            <div className="shrink-0 border-t border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span className="font-semibold text-foreground">{formatNaira(cart.subtotal)}</span>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">Shipping &amp; VAT calculated at checkout</p>
              <Link href="/checkout" onClick={() => setOpen(false)}
                className={buttonVariants({ className: "w-full" })}>
                Proceed to checkout <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
