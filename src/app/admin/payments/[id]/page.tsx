"use client";

import { use, useState } from "react";
import Link from "next/link";
import { RefreshCw, Undo2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { useAdminPayment, usePaymentMutations } from "@/features/admin/admin-hooks";
import { formatNaira, formatDateTime } from "@/lib/format";

export default function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: payment, isLoading, isError, refetch } = useAdminPayment(id);
  const m = usePaymentMutations();
  const [refundOpen, setRefundOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  if (isLoading) return <LoadingState label="Loading payment…" />;
  if (isError || !payment) return <ErrorState onRetry={() => refetch()} />;

  const ref = payment.reference ?? payment.id.slice(0, 12);
  const refundable = /success|paid|complete/i.test(payment.status ?? "");

  return (
    <>
      <PageHeader
        title={`Payment ${ref}`}
        description={`${payment.provider ?? "Flutterwave"} · ${formatDateTime(payment.createdAt)}`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payments", href: "/admin/payments" }, { label: ref }]}
        actions={
          <>
            <Button size="sm" variant="outline" disabled={m.reverify.isPending} onClick={() => m.reverify.mutate(id)}>
              {m.reverify.isPending ? <><Spinner className="h-4 w-4" /> Verifying…</> : <><RefreshCw size={15} /> Re-verify</>}
            </Button>
            {refundable && (
              <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}>
                <Undo2 size={15} /> Request refund
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card><CardContent className="p-5">
          <h2 className="mb-4 font-bold tracking-tight">Transaction details</h2>
          <dl className="divide-y divide-border text-sm">
            <Row label="Reference" value={payment.reference ?? "—"} />
            <Row label="Payment ID" value={payment.id} />
            <Row label="Provider" value={payment.provider ?? "Flutterwave"} />
            <Row label="Method" value={payment.method ?? "—"} />
            <Row label="Amount" value={formatNaira(payment.amount)} />
            <Row label="Created" value={formatDateTime(payment.createdAt)} />
            <Row label="Customer" value={payment.customerName ?? payment.customerEmail ?? "—"} />
          </dl>
        </CardContent></Card>

        <aside className="space-y-4">
          <Card><CardContent className="p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatNaira(payment.amount)}</p>
            <div className="mt-3 flex justify-center"><StatusBadge status={payment.status} /></div>
          </CardContent></Card>

          {payment.orderId && (
            <Card><CardContent className="p-5">
              <h2 className="mb-2 font-bold tracking-tight">Related order</h2>
              <p className="text-sm text-muted-foreground">
                {payment.orderNumber ? `#${payment.orderNumber}` : payment.orderId.slice(0, 8)}
              </p>
              <Link href={`/admin/orders/${payment.orderId}`}
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3 w-full" })}>
                View order
              </Link>
            </CardContent></Card>
          )}
        </aside>
      </div>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              This creates a refund request for approval — it doesn&apos;t move money on its own.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Amount (₦)">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={String(payment.amount ?? 0)} autoFocus />
            </Field>
            <Field label="Reason">
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being refunded?" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button disabled={!amount || Number(amount) <= 0 || m.createRefund.isPending}
              onClick={() => {
                m.createRefund.mutate(
                  { paymentId: id, amount: Number(amount), reason: reason || undefined },
                  { onSuccess: () => { setRefundOpen(false); setAmount(""); setReason(""); } }
                );
              }}>
              {m.createRefund.isPending ? <><Spinner className="h-4 w-4" /> Submitting…</> : "Request refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
