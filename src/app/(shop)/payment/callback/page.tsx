"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useVerifyPayment } from "@/features/payments/payments-hooks";

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

  if (!reference) {
    return (
      <Result
        icon={<XCircle size={30} />}
        tone="error"
        title="Missing payment reference"
        description="We couldn't find a payment reference in the link you followed. If you were charged, your order status will still update."
        orderId={orderId}
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
        description="No charge was completed for this order. You can retry the payment from your order page."
        orderId={orderId ?? payment?.orderId ?? null}
      />
    );
  }

  return (
    <Result
      icon={<CheckCircle2 size={30} />}
      tone="success"
      title="Payment successful"
      description="Thank you! Your order is confirmed and we've started preparing it for delivery."
      orderId={orderId ?? payment?.orderId ?? null}
      meta={
        <>
          {payment?.reference && (
            <MetaRow label="Reference" value={payment.reference} />
          )}
          {payment && <MetaRow label="Amount paid" value={payment.amountFormatted} />}
          {payment?.status && <MetaRow label="Status" value={payment.status} />}
        </>
      }
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
  icon, tone, title, description, orderId, meta,
}: {
  icon: React.ReactNode;
  tone: "success" | "error";
  title: string;
  description: string;
  orderId: string | null;
  meta?: React.ReactNode;
}) {
  return (
    <Shell>
      <Card>
        <CardContent className="p-8 text-center">
          <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${
            tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {icon}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

          {meta && <div className="mt-5 divide-y divide-border border-y border-border text-left">{meta}</div>}

          <div className="mt-6 space-y-2">
            {orderId ? (
              <Link href={`/dashboard/orders/${orderId}`} className={buttonVariants({ className: "w-full" })}>
                View your order
              </Link>
            ) : (
              <Link href="/dashboard/orders" className={buttonVariants({ className: "w-full" })}>
                View your orders
              </Link>
            )}
            <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Continue shopping
            </Link>
          </div>
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
