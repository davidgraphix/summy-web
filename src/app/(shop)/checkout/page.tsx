"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Info, Lock, Package, Plus, ShoppingCart, Store, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/use-cart";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAddresses } from "@/features/addresses/addresses-hooks";
import { addressSchema, NG_STATES, type AddressValues } from "@/features/addresses/address-schema";
import { useCheckoutQuote, useCreateOrder } from "@/features/orders/orders-hooks";
import { useInitializePayment, resolvePaymentLink } from "@/features/payments/payments-hooks";
import { useStorefrontSettings } from "@/features/products/settings-hooks";
import type { CheckoutQuoteRequest, DeliveryMethod } from "@/types/models";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const { data: settings } = useStorefrontSettings();

  const createOrder = useCreateOrder();
  const initPayment = useInitializePayment();

  /**
   * Guards the whole place-order sequence, which spans two requests (create,
   * then initialise payment) and finally a full-page redirect to Flutterwave.
   * A ref rather than state because it must be readable synchronously inside the
   * click handler: a second click can land before React has re-rendered with the
   * disabled button, and the check has to reject it in that same tick.
   */
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  // "saved" uses an existing addressId; "new" posts an inline shipping address.
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("HomeDelivery");
  const [notes, setNotes] = useState("");

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Nigeria", state: "Lagos" },
  });

  // Watched rather than read once, so switching state re-quotes the delivery fee
  // as the customer edits the form.
  const formState = form.watch("state");

  // Prefer a saved address when the customer has one.
  useEffect(() => {
    if (addresses?.length) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) { setSelectedAddressId(def.id); setMode("saved"); }
    }
  }, [addresses]);

  // Guests must sign in before an order can be created against their account.
  // Waits for hydration, or a hard refresh bounces an authenticated customer.
  useEffect(() => {
    if (hasHydrated && !isAuth) router.replace("/login?redirect=/checkout");
  }, [hasHydrated, isAuth, router]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  // The destination the fee is calculated from — the saved address's state when
  // one is chosen, otherwise whatever is in the form.
  const destinationState = mode === "saved" ? selectedAddress?.state : formState;

  const quoteRequest: CheckoutQuoteRequest | null = useMemo(() => {
    if (cart.lines.length === 0) return null;
    return {
      items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      deliveryMethod,
      ...(deliveryMethod === "HomeDelivery"
        ? mode === "saved" && selectedAddressId
          ? { shippingAddressId: selectedAddressId }
          : { state: destinationState }
        : {}),
    };
  }, [cart.lines, deliveryMethod, mode, selectedAddressId, destinationState]);

  const { data: quote, isFetching: quoting } = useCheckoutQuote(quoteRequest);

  if (!hasHydrated || !isAuth) return <LoadingState label="Checking your session…" />;

  if (cart.lines.length === 0 && !busy) {
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

  /**
   * Shopping flow: Create Order → Initialize Payment → redirect to Flutterwave.
   * The hosted checkout returns the customer to /payment/callback, where the
   * payment is verified server-side before anything is treated as paid.
   */
  const placeOrder = async (shippingAddress?: AddressValues) => {
    // Double-submit guard. Placing the same order twice charges twice and
    // reserves stock twice, so this rejects rather than queues.
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);

    let orderId: string | undefined;

    try {
      const order = await createOrder.mutateAsync({
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        ...(mode === "saved" && selectedAddressId
          ? { shippingAddressId: selectedAddressId }
          : { shippingAddress }),
        deliveryMethod,
        customerNote: notes || undefined,
      });

      orderId = order.id;

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/payment/callback?orderId=${order.id}`
          : undefined;

      const result = await initPayment.mutateAsync({ orderId: order.id, redirectUrl });
      const link = resolvePaymentLink(result);

      if (link) {
        // Deliberately left busy: the page is navigating away, and re-enabling
        // the button during that gap invites a second click.
        window.location.href = link;
        return;
      }

      // The order exists but payment could not be started. Send the customer to
      // the order, where they can retry — never leave them on a dead screen, and
      // never imply the order failed when it did not.
      toast.error("Your order was placed, but payment could not be started. You can pay from your order.");
      router.push(`/dashboard/orders/${order.id}`);
    } catch {
      // The mutation hooks have already surfaced the message. If the order was
      // created and only payment initialisation failed, point the customer at it
      // rather than letting them place a duplicate.
      if (orderId) router.push(`/dashboard/orders/${orderId}`);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => placeOrder(values));

  const handlePlaceOrder = () => {
    if (busy) return;

    if (mode === "saved") {
      if (!selectedAddressId) { toast.error("Choose a delivery address"); return; }
      void placeOrder();
    } else {
      void onSubmit();
    }
  };

  const isPickup = deliveryMethod === "StorePickup";

  // Only ever the server's figure. Until the first quote lands the button says
  // "Place order & pay" without an amount rather than showing a number the
  // browser worked out for itself.
  const payLabel = quote ? `Place order & pay ${quote.totalFormatted}` : "Place order & pay";

  const pickupAddress = [settings?.addressLine1, settings?.city, settings?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-6">
      <h1 className="mb-5 text-xl font-extrabold tracking-tight sm:text-2xl">Checkout</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* ---------------- Delivery method ---------------- */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="mb-1 text-base font-bold sm:text-lg">How would you like to receive it?</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Both options are free — choose whichever suits you.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {/*
                  Both options are free, so neither price is quoted or
                  recalculated — the choice is now purely about how the customer
                  wants to receive the order.
                */}
                <DeliveryOption
                  active={isPickup}
                  onSelect={() => setDeliveryMethod("StorePickup")}
                  icon={<Store size={18} />}
                  title="Store pickup"
                  price="FREE"
                  description="Collect from our store yourself, or send your own transport."
                />
                <DeliveryOption
                  active={!isPickup}
                  onSelect={() => setDeliveryMethod("HomeDelivery")}
                  icon={<Truck size={18} />}
                  title="Home delivery"
                  price="FREE"
                  description="Delivered to the address below."
                />
              </div>

              {isPickup && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm">
                  <Info size={16} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Collect from our store</p>
                    <p className="text-muted-foreground">
                      {pickupAddress || "We'll confirm the pickup address and times by email once your payment clears."}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      We still need your name and phone number below so we know who is collecting.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---------------- Address ---------------- */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="mb-4 text-base font-bold sm:text-lg">
                {isPickup ? "Your contact details" : "Delivery address"}
              </h2>

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
                              {a.recipientName}
                              {a.isDefault && <span className="ml-2 text-xs font-medium text-accent">Default</span>}
                            </span>
                            <span className="block break-words text-muted-foreground">{a.formattedAddress}</span>
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
                      <Field label="Full name" error={form.formState.errors.recipientName?.message} className="sm:col-span-2">
                        <Input placeholder="Adaeze Okonkwo" autoComplete="name" {...form.register("recipientName")} />
                      </Field>
                      <Field label="Phone number" error={form.formState.errors.phoneNumber?.message}>
                        <Input placeholder="0803 000 0000" inputMode="tel" autoComplete="tel" {...form.register("phoneNumber")} />
                      </Field>
                      <Field label="City" error={form.formState.errors.city?.message}>
                        <Input placeholder="Ikeja" autoComplete="address-level2" {...form.register("city")} />
                      </Field>
                      <Field label="Street address" error={form.formState.errors.streetAddress?.message} className="sm:col-span-2">
                        <Input placeholder="12 Allen Avenue" autoComplete="street-address" {...form.register("streetAddress")} />
                      </Field>
                      <Field label="Apartment, suite (optional)" className="sm:col-span-2">
                        <Input placeholder="Flat 4B" {...form.register("apartmentSuite")} />
                      </Field>
                      <Field label="State" error={form.formState.errors.state?.message}>
                        <select {...form.register("state")}
                          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary">
                          {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Postal code (optional)">
                        <Input placeholder="100001" inputMode="numeric" {...form.register("postalCode")} />
                      </Field>
                      <Field label="Landmark (optional)">
                        <Input placeholder="Near First Bank" {...form.register("landmark")} />
                      </Field>
                      <Field label="Country" error={form.formState.errors.country?.message} className="sm:col-span-2">
                        <Input autoComplete="country-name" {...form.register("country")} />
                      </Field>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="mb-3 text-base font-bold sm:text-lg">
                {isPickup ? "Pickup notes (optional)" : "Delivery notes (optional)"}
              </h2>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={isPickup
                  ? "When you plan to collect, who is collecting on your behalf…"
                  : "Landmark, delivery instructions, preferred time…"} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4 sm:p-5">
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

        {/* ---------------- Summary ---------------- */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="mb-4 text-base font-bold sm:text-lg">Your order</h2>

              <ul className="mb-4 space-y-3">
                {cart.lines.map((l) => (
                  <li key={l.productId} className="flex gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                      {l.imageUrl
                        ? <img src={l.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        : <Package size={20} />}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-medium">{l.productName}</p>
                      <p className="text-muted-foreground">Qty {l.quantity}</p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">{l.lineTotalFormatted}</span>
                  </li>
                ))}
              </ul>

              {/*
                Items total, delivery, total. No VAT row, no fee rows — the
                customer pays the sum of the products and nothing else, and the
                summary says exactly that.

                A VAT row is still rendered if the server ever returns a non-zero
                figure. The backend charges none today, but a summary that can
                only display zero would hide a real charge if that policy ever
                changed, and an invisible charge is far worse than an extra row.
              */}
              <dl className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Items total" value={quote?.subtotalFormatted} pending={quoting} />
                <Row
                  label={isPickup ? "Delivery (store pickup)" : "Delivery"}
                  value={quote ? (quote.deliveryFeeInKobo === 0 ? "FREE" : quote.deliveryFeeFormatted) : undefined}
                  pending={quoting}
                />
                {!!quote && quote.vatInKobo > 0 && <Row label="VAT" value={quote.vatFormatted} pending={false} />}
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">
                  {quoting && !quote ? "—" : quote?.totalFormatted ?? "—"}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                No delivery fee, VAT or extra charges — you pay the price of the items.
              </p>

              {/* Desktop / tablet action. The mobile one is the fixed bar below. */}
              <Button className="mt-5 hidden h-12 w-full lg:flex" onClick={handlePlaceOrder}
                disabled={busy || !quote}>
                {busy ? <><Spinner className="h-4 w-4" /> Processing…</> : <><Lock size={16} /> {payLabel}</>}
              </Button>

              <p className="mt-2 hidden text-center text-xs text-muted-foreground lg:block">
                Your payment is processed securely by Flutterwave.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/*
        Fixed action bar on small screens. On a phone the summary sits below a
        long address form, so a button inside it is far off-screen while the
        customer is filling the form in — the one control they are heading
        towards should not require scrolling to find.
      */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] leading-tight text-muted-foreground">Total</p>
            <p className="truncate text-base font-extrabold leading-tight">
              {quoting && !quote ? "—" : quote?.totalFormatted ?? "—"}
            </p>
          </div>
          <Button className="h-12 flex-1" onClick={handlePlaceOrder} disabled={busy || !quote}>
            {busy ? <><Spinner className="h-4 w-4" /> Processing…</> : <><Lock size={16} /> Place order &amp; pay</>}
          </Button>
        </div>
      </div>
    </main>
  );
}

/** One line of the cost breakdown, with a placeholder while a quote is in flight. */
function Row({ label, value, pending }: { label: string; value?: string; pending: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value ?? (pending ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" /> : "—")}
      </dd>
    </div>
  );
}

function DeliveryOption({
  active, onSelect, icon, title, price, description,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  price: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/40"
      )}
    >
      <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
        active ? "border-primary" : "border-muted-foreground")}>
        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold">
          <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          {title}
        </span>
        <span className="mt-0.5 block text-sm font-medium">{price}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
