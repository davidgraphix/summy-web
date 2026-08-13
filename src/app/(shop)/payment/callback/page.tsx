"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useVerifyPayment } from "@/features/payments/payments-hooks";
import { useOrder } from "@/features/orders/orders-hooks";
import { useStorefrontSettings } from "@/features/products/settings-hooks";

/**
 * Flutterwave's hosted checkout redirects here with `tx_ref` — the same
 * reference the backend verifies by (see FlutterwavePaymentProvider's
 * verify_by_reference call). `transaction_id` and `trxref` are accepted as
 * fallbacks for older Flutterwave redirect formats.
 */
function resolveReference(params: URLSearchParams): string {
  return (
    params.get("tx_ref") ??
    params.get("transaction_id") ??
    params.get("trxref") ??
    params.get("reference") ??
    ""
  );
}

function CallbackInner() {
  const params = useSearchParams();
  const reference = resolveReference(new URLSearchParams(params.toString()));
  const orderId = params.get("orderId");
  // Flutterwave sends a status hint; the server verification is authoritative.
  const statusHint = params.get("status");

  const { data: payment, isLoading, isError, error } = useVerifyPayment(reference);

  // Fetched for the order number and fulfilment method shown on the receipt.
  // Non-blocking: the payment result is what matters, and this must never delay
  // telling the customer their money went through.
  const { data: order } = useOrder(orderId ?? payment?.orderId ?? "");
  const { data: settings } = useStorefrontSettings();
  const supportEmail = settings?.supportEmail ?? null;

  if (!reference) {
    return (
      <Result
        icon={<XCircle size={30} />}
        tone="error"
        title="Missing payment reference"
        description="We couldn't find a payment reference in the link you followed. If you were charged, your order status will still update."
        orderId={orderId}
        supportEmail={supportEmail}
      />
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-lg font-bold">Confirming your payment…</p>
            <p className="text-sm text-muted-foreground">
              Please don&apos;t close this page. This usually takes a few seconds.
            </p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Result
        icon={<XCircle size={30} />}
        tone="error"
        title="We couldn't confirm your payment"
        description={
          (error as Error)?.message ??
          "The payment could not be verified. If money left your account, it will be reconciled — check your order for the latest status."
        }
        orderId={orderId}
        supportEmail={supportEmail}
      />
    );
  }

  // Verification succeeded. Treat an explicit failure status from the payment
  // record as a failure; otherwise show success.
  const failed = payment?.status === "Failed" || payment?.status === "Cancelled" || payment?.status === "Expired";

  if (failed || statusHint === "cancelled") {
    return (
      <Result
        icon={<XCircle size={30} />}
        tone="error"
        title="Payment was not completed"
        description="No charge was completed, and nothing has been taken from your account. Your items are still in your cart, so you can try again whenever you're ready."
        orderId={orderId ?? payment?.orderId ?? null}
        supportEmail={supportEmail}
        retry
      />
    );
  }

  const resolvedOrderId = orderId ?? payment?.orderId ?? null;

  return (
    <Result
      icon={<CheckCircle2 size={30} />}
      tone="success"
      title="Payment successful"
      description={
        order?.deliveryMethod === "StorePickup"
          ? "Thank you! Your order is confirmed and will be ready for collection from our store."
          : "Thank you! Your order is confirmed and we've started preparing it for delivery."
      }
      orderId={resolvedOrderId}
      meta={
        <>
          {/*
            The order number leads: it is the reference a customer will quote to
            support, and the gateway's own reference means nothing to them.
          */}
          {order?.orderNumber && <MetaRow label="Order number" value={order.orderNumber} />}
          {payment && <MetaRow label="Amount paid" value={payment.amountFormatted} />}
          {payment?.status && <MetaRow label="Payment status" value={payment.status} />}
          {order && (
            <MetaRow
              label="Fulfilment"
              value={order.deliveryMethod === "StorePickup" ? "Store pickup" : "Home delivery"}
            />
          )}
          {payment?.reference && <MetaRow label="Reference" value={payment.reference} />}
        </>
      }
      nextSteps={
        order?.deliveryMethod === "StorePickup"
          ? "We'll email you as soon as your order is packed and ready to collect. Bring your order number with you."
          : "We'll email you a confirmation now, and again when your order is on its way."
      }
      supportEmail={supportEmail}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-lg px-4 py-14">{children}</main>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function Result({
  icon, tone, title, description, orderId, meta, nextSteps, supportEmail, retry,
}: {
  icon: React.ReactNode;
  tone: "success" | "error";
  title: string;
  description: string;
  orderId: string | null;
  meta?: React.ReactNode;
  nextSteps?: string;
  supportEmail?: string | null;
  /** Shown on failure: the cart is intact, so retrying is one tap. */
  retry?: boolean;
}) {
  return (
    <Shell>
      <Card>
        <CardContent className="p-6 text-center sm:p-8">
          <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${
            tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {icon}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

          {meta && <div className="mt-5 divide-y divide-border border-y border-border text-left">{meta}</div>}

          {nextSteps && (
            <p className="mt-4 rounded-xl bg-muted/60 p-3 text-left text-sm text-muted-foreground">
              <span className="font-medium text-foreground">What happens next: </span>
              {nextSteps}
            </p>
          )}

          <div className="mt-6 space-y-2">
            {orderId ? (
              <Link href={`/dashboard/orders/${orderId}`} className={buttonVariants({ className: "h-12 w-full" })}>
                View your order
              </Link>
            ) : (
              <Link href="/dashboard/orders" className={buttonVariants({ className: "h-12 w-full" })}>
                View your orders
              </Link>
            )}

            {retry && (
              <Link href="/checkout" className={buttonVariants({ variant: "outline", className: "h-12 w-full" })}>
                Try payment again
              </Link>
            )}

            <Link href="/" className={buttonVariants({ variant: "outline", className: "h-12 w-full" })}>
              Continue shopping
            </Link>
          </div>

          {supportEmail && (
            <p className="mt-4 text-xs text-muted-foreground">
              Need help?{" "}
              <a href={`mailto:${supportEmail}`} className="font-medium text-primary underline underline-offset-2">
                {supportEmail}
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<Shell><Card><CardContent className="flex justify-center p-10"><Spinner /></CardContent></Card></Shell>}>
      <CallbackInner />
    </Suspense>
  );
}
