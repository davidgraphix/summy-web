"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Lock, Package, Plus, ShoppingCart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Spinner } from "@/components/ui/spinner";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/use-cart";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAddresses } from "@/features/addresses/addresses-hooks";
import { addressSchema, NG_STATES, type AddressValues } from "@/features/addresses/address-schema";
import { useCreateOrder } from "@/features/orders/orders-hooks";
import { useInitializePayment, resolvePaymentLink } from "@/features/payments/payments-hooks";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();

  const createOrder = useCreateOrder();
  const initPayment = useInitializePayment();
  const [submitting, setSubmitting] = useState(false);

  // "saved" uses an existing addressId; "new" posts an inline shipping address.
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Nigeria", state: "Lagos" },
  });

  // Prefer a saved address when the customer has one.
  useEffect(() => {
    if (addresses?.length) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) { setSelectedAddressId(def.id); setMode("saved"); }
    }
  }, [addresses]);

  // Guests must sign in before an order can be created against their account.
  useEffect(() => {
    if (!isAuth) router.replace("/login?redirect=/checkout");
  }, [isAuth, router]);

  if (!isAuth) return <LoadingState label="Redirecting to sign in…" />;

  if (cart.lines.length === 0 && !submitting) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
        <EmptyState
          icon={<ShoppingCart size={30} />}
          title="Nothing to check out"
          description="Your cart is empty — add a product first."
          action={<Link href="/" className={buttonVariants()}>Browse products</Link>}
        />
      </main>
    );
  }

  const server = cart.serverCart;
  const subtotal = server?.subtotal ?? cart.subtotal;
  const tax = server?.tax;
  const shipping = server?.shipping;
  const total = server?.total ?? subtotal;

  /**
   * Shopping flow: Create Order → Initialize Payment → redirect to Flutterwave.
   * The hosted checkout returns the customer to /payment/callback.
   */
  const placeOrder = async (shippingAddress?: AddressValues) => {
    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        ...(mode === "saved" && selectedAddressId
          ? { shippingAddressId: selectedAddressId }
          : { shippingAddress }),
        notes: notes || undefined,
      });

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/payment/callback?orderId=${order.id}`
          : undefined;

      const result = await initPayment.mutateAsync({ orderId: order.id, redirectUrl });
      const link = resolvePaymentLink(result);

      if (link) {
        window.location.href = link; // Flutterwave hosted checkout
        return;
      }

      // No redirect link returned — send the customer somewhere useful instead
      // of leaving them on a dead screen.
      toast.error("Payment could not be started. You can retry from your order.");
      router.push(`/dashboard/orders/${order.id}`);
    } catch {
      // Errors already surfaced as toasts by the mutation hooks.
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => placeOrder(values));

  const handlePlaceOrder = () => {
    if (mode === "saved") {
      if (!selectedAddressId) { toast.error("Choose a delivery address"); return; }
      void placeOrder();
    } else {
      void onSubmit();
    }
  };

  const busy = submitting || createOrder.isPending || initPayment.isPending;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Delivery address</h2>

              {loadingAddresses ? (
                <LoadingState label="Loading saved addresses…" />
              ) : (
                <>
                  {!!addresses?.length && (
                    <div className="mb-4 space-y-2">
                      {addresses.map((a) => (
                        <button key={a.id} type="button"
                          onClick={() => { setMode("saved"); setSelectedAddressId(a.id); }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                            mode === "saved" && selectedAddressId === a.id
                              ? "border-primary bg-primary/5" : "border-border bg-card"
                          )}>
                          <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                            mode === "saved" && selectedAddressId === a.id ? "border-primary" : "border-muted-foreground")}>
                            {mode === "saved" && selectedAddressId === a.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">
                              {a.fullName ?? "Saved address"}
                              {a.isDefault && <span className="ml-2 text-xs font-medium text-accent">Default</span>}
                            </span>
                            <span className="block text-muted-foreground">
                              {[a.line1, a.line2, a.city, a.state, a.country].filter(Boolean).join(", ")}
                            </span>
                            {a.phoneNumber && <span className="block text-muted-foreground">{a.phoneNumber}</span>}
                          </span>
                        </button>
                      ))}

                      <button type="button" onClick={() => setMode("new")}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
                          mode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"
                        )}>
                        <Plus size={16} /> Use a new address
                      </button>
                    </div>
                  )}

                  {mode === "new" && (
                    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
                      <Field label="Full name" error={form.formState.errors.fullName?.message} className="sm:col-span-2">
                        <Input placeholder="Adaeze Okonkwo" {...form.register("fullName")} />
                      </Field>
                      <Field label="Phone number" error={form.formState.errors.phoneNumber?.message}>
                        <Input placeholder="0803 000 0000" inputMode="tel" {...form.register("phoneNumber")} />
                      </Field>
                      <Field label="City" error={form.formState.errors.city?.message}>
                        <Input placeholder="Ikeja" {...form.register("city")} />
                      </Field>
                      <Field label="Street address" error={form.formState.errors.line1?.message} className="sm:col-span-2">
                        <Input placeholder="12 Allen Avenue" {...form.register("line1")} />
                      </Field>
                      <Field label="Apartment, suite (optional)" className="sm:col-span-2">
                        <Input placeholder="Flat 4B" {...form.register("line2")} />
                      </Field>
                      <Field label="State" error={form.formState.errors.state?.message}>
                        <select {...form.register("state")}
                          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary">
                          {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Postal code (optional)">
                        <Input placeholder="100001" {...form.register("postalCode")} />
                      </Field>
                      <Field label="Country" error={form.formState.errors.country?.message} className="sm:col-span-2">
                        <Input {...form.register("country")} />
                      </Field>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-bold">Order notes (optional)</h2>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Landmark, delivery instructions, preferred time…" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <CreditCard size={20} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Pay securely with Flutterwave</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You&apos;ll be redirected to Flutterwave&apos;s secure checkout to pay by card, bank transfer or USSD,
                  then returned here automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Your order</h2>

              <ul className="mb-4 space-y-3">
                {cart.lines.map((l) => (
                  <li key={l.productId} className="flex gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                      {l.imageUrl ? <img src={l.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={20} />}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-1 font-medium">{l.name}</p>
                      <p className="text-muted-foreground">Qty {l.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatNaira(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{formatNaira(subtotal)}</dd>
                </div>
                {typeof shipping === "number" && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="font-medium">{shipping === 0 ? "Free" : formatNaira(shipping)}</dd>
                  </div>
                )}
                {typeof tax === "number" && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">VAT</dt><dd className="font-medium">{formatNaira(tax)}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">{formatNaira(total)}</span>
              </div>

              <Button className="mt-5 h-12 w-full" onClick={handlePlaceOrder} disabled={busy}>
                {busy ? <><Spinner className="h-4 w-4" /> Processing…</> : <><Lock size={16} /> Place order &amp; pay</>}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Your payment is processed securely by Flutterwave.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
