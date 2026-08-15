"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Package, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { useOrder, useOrderTimeline, useCancelOrder, useReorder } from "@/features/orders/orders-hooks";
import { usePaymentsByOrder, useInitializePayment, resolvePaymentLink } from "@/features/payments/payments-hooks";
import { downloadFile } from "@/lib/api-client";
import { ordersApi } from "@/features/orders/orders-api";
import { toast } from "sonner";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const timeline = useOrderTimeline(id);
  const payment = usePaymentsByOrder(id);
  const cancel = useCancelOrder();
  const reorder = useReorder();
  const initPayment = useInitializePayment();
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (isLoading) return <LoadingState label="Loading order…" />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  const retryPayment = async () => {
    setRetrying(true);
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/payment/callback?orderId=${order.id}` : undefined;
      const result = await initPayment.mutateAsync({ orderId: order.id, redirectUrl });
      const link = resolvePaymentLink(result);
      if (link) { window.location.href = link; return; }
      toast.error("Couldn't start the payment. Please try again shortly.");
    } catch (e) {
      toast.error((e as Error).message || "Payment could not be started");
    } finally {
      setRetrying(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      await downloadFile(ordersApi.invoicePdfPath(order.id), `invoice-${order.orderNumber}.pdf`);
    } catch {
      toast.error("Could not download the invoice");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-primary">
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.placedAtUtc)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Items</h2>
              <ul className="divide-y divide-border">
                {order.items.map((it) => (
                  <li key={it.id} className="flex gap-3 py-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                      {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{it.productName}</p>
                      <p className="text-sm text-muted-foreground">Qty {it.quantity} · {it.unitPriceFormatted} each</p>
                    </div>
                    <span className="text-sm font-bold">{it.totalFormatted}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {!!timeline.data?.length && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-bold">Tracking</h2>
                <ol className="relative space-y-5 border-l border-border pl-5">
                  {timeline.data.map((t, i) => (
                    <li key={t.id} className="relative">
                      <span className={`absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full ${
                        i === 0 ? "bg-primary ring-4 ring-primary/15" : "bg-border"}`} />
                      <p className="text-sm font-semibold">{t.description}</p>
                      {t.notes && <p className="text-sm text-muted-foreground">{t.notes}</p>}
                      <p className="text-xs text-muted-foreground">{formatDateTime(t.occurredAtUtc)}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-bold">Delivery address</h2>
              <p className="text-sm font-medium">{order.shippingAddress.recipientName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.formattedAddress}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
            </CardContent>
          </Card>

          {payment.data && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-lg font-bold">Payment</h2>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{payment.data.reference ?? payment.data.id.slice(0, 12)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.data.provider ?? "Flutterwave"} · {formatDateTime(payment.data.createdAtUtc)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{payment.data.status}</span>
                    <span className="font-bold">{payment.data.amountFormatted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Summary</h2>
              <dl className="space-y-2 text-sm">
                <SummaryRow label="Items total" value={`₦${(order.subtotalInKobo / 100).toLocaleString()}`} />
                {order.discountInKobo > 0 && <SummaryRow label="Discount" value={`-₦${(order.discountInKobo / 100).toLocaleString()}`} />}
                {/*
                  Names the arrangement, not just the charge — "store pickup" and
                  "delivery" both cost nothing but mean different things to someone
                  deciding whether to wait in for a courier.

                  Delivery and VAT rows render a real figure if a past order
                  carries one. Orders are historical records: an order placed
                  under an earlier fee policy must keep showing what was actually
                  charged, not today's zero.
                */}
                <SummaryRow
                  label={order.deliveryMethod === "StorePickup" ? "Delivery (store pickup)" : "Delivery"}
                  value={order.deliveryFeeInKobo === 0 ? "FREE" : `₦${(order.deliveryFeeInKobo / 100).toLocaleString()}`}
                />
                {order.vatInKobo > 0 && (
                  <SummaryRow label="VAT" value={`₦${(order.vatInKobo / 100).toLocaleString()}`} />
                )}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">{order.totalFormatted}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5">
              {order.paymentStatus !== "Paid" && order.paymentStatus !== "PartiallyRefunded" && order.paymentStatus !== "Refunded" && (
                <Button className="w-full" onClick={retryPayment} disabled={retrying || initPayment.isPending}>
                  {retrying ? <><Spinner className="h-4 w-4" /> Starting…</> : "Complete payment"}
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={() => reorder.mutate(order.id)} disabled={reorder.isPending}>
                <RefreshCw size={16} /> {reorder.isPending ? "Adding…" : "Reorder"}
              </Button>

              <Button variant="outline" className="w-full" onClick={downloadInvoice} disabled={downloading}>
                {downloading ? <><Spinner className="h-4 w-4" /> Downloading…</> : <><Download size={16} /> Download invoice</>}
              </Button>

              {order.isCancellable && (
                <Button variant="destructive" className="w-full"
                  onClick={() => { if (confirm("Cancel this order? This can't be undone.")) cancel.mutate({ id: order.id, reason: "Customer requested cancellation" }); }}
                  disabled={cancel.isPending}>
                  <XCircle size={16} /> {cancel.isPending ? "Cancelling…" : "Cancel order"}
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
