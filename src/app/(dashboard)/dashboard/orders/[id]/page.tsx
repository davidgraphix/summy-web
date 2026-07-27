"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Package, RefreshCw, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatNaira, formatDate, formatDateTime } from "@/lib/format";
import { useOrder, useOrderTimeline, useCancelOrder, useReorder } from "@/features/orders/orders-hooks";
import { usePaymentsByOrder, useInitializePayment, resolvePaymentLink } from "@/features/payments/payments-hooks";
import { API_ROOT } from "@/lib/env";
import { ordersApi } from "@/features/orders/orders-api";
import { toast } from "sonner";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const timeline = useOrderTimeline(id);
  const payments = usePaymentsByOrder(id);
  const cancel = useCancelOrder();
  const reorder = useReorder();
  const initPayment = useInitializePayment();
  const [retrying, setRetrying] = useState(false);

  if (isLoading) return <LoadingState label="Loading order…" />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  const status = (order.status ?? "").toString().toLowerCase();
  const canCancel = /pending|process|await/.test(status) && !/cancel/.test(status);
  const unpaid = !/paid|deliver|ship|complete/.test(status);

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

  return (
    <div className="space-y-5">
      <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-primary">
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Items</h2>
              <ul className="divide-y divide-border">
                {order.items?.map((it, i) => (
                  <li key={it.productId + i} className="flex gap-3 py-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                      {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{it.name ?? "Product"}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty {it.quantity}{typeof it.unitPrice === "number" ? ` · ${formatNaira(it.unitPrice)} each` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {formatNaira(it.lineTotal ?? (it.unitPrice ?? 0) * it.quantity)}
                    </span>
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
                    <li key={i} className="relative">
                      <span className={`absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full ${
                        i === 0 ? "bg-primary ring-4 ring-primary/15" : "bg-border"}`} />
                      <p className="text-sm font-semibold">{t.title ?? t.status}</p>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      <p className="text-xs text-muted-foreground">{formatDateTime(t.occurredAt ?? t.timestamp)}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {order.shippingAddress && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-lg font-bold">Delivery address</h2>
                <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {[order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city,
                    order.shippingAddress.state, order.shippingAddress.country].filter(Boolean).join(", ")}
                </p>
                {order.shippingAddress.phoneNumber && (
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
                )}
              </CardContent>
            </Card>
          )}

          {!!payments.data?.length && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-lg font-bold">Payments</h2>
                <ul className="divide-y divide-border text-sm">
                  {payments.data.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div>
                        <p className="font-medium">{p.reference ?? p.id.slice(0, 12)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.provider ?? "Flutterwave"} · {formatDateTime(p.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.status && <span className="text-xs font-semibold uppercase text-muted-foreground">{p.status}</span>}
                        {typeof p.amount === "number" && <span className="font-bold">{formatNaira(p.amount)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">Summary</h2>
              <dl className="space-y-2 text-sm">
                {typeof order.subtotal === "number" && <SummaryRow label="Subtotal" value={formatNaira(order.subtotal)} />}
                {typeof order.shipping === "number" && (
                  <SummaryRow label="Shipping" value={order.shipping === 0 ? "Free" : formatNaira(order.shipping)} />
                )}
                {typeof order.tax === "number" && <SummaryRow label="VAT" value={formatNaira(order.tax)} />}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">{formatNaira(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5">
              {unpaid && (
                <Button className="w-full" onClick={retryPayment} disabled={retrying || initPayment.isPending}>
                  {retrying ? <><Spinner className="h-4 w-4" /> Starting…</> : "Complete payment"}
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={() => reorder.mutate(order.id)} disabled={reorder.isPending}>
                <RefreshCw size={16} /> {reorder.isPending ? "Adding…" : "Reorder"}
              </Button>

              {/*
                The invoice PDF is a file download rather than a JSON envelope.
                TODO: if the endpoint requires the bearer token, swap this anchor
                for a fetch + blob download using the api client.
              */}
              <a href={`${API_ROOT}${ordersApi.invoicePdfPath(order.id)}`}
                target="_blank" rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", className: "w-full" })}>
                <Download size={16} /> Download invoice
              </a>

              {canCancel && (
                <Button variant="destructive" className="w-full"
                  onClick={() => { if (confirm("Cancel this order? This can't be undone.")) cancel.mutate(order.id); }}
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
