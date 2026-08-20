"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, Package, Printer, UserPlus, Wallet, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatusBadge } from "@/features/admin/components/status-badge";
import {
  useAdminOrder, useAdminOrderTimeline, useAdminOrderMutations, useAdminUsers,
} from "@/features/admin/admin-hooks";
import { usePaymentsByOrder } from "@/features/payments/payments-hooks";
import { formatDate, formatDateTime, koboToNaira, nairaToKobo } from "@/lib/format";
import type { OrderStatus } from "@/types/models";

const ORDER_STATUSES: OrderStatus[] = [
  "Pending", "AwaitingPayment", "Paid", "Processing", "Packed", "Shipped",
  "Delivered", "Completed", "Cancelled", "RefundPending", "Refunded", "Failed",
];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError, refetch } = useAdminOrder(id);
  const timeline = useAdminOrderTimeline(id);
  const payment = usePaymentsByOrder(id);
  const m = useAdminOrderMutations(id);

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");

  if (isLoading) return <LoadingState label="Loading order…" />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  const title = `Order #${order.orderNumber}`;

  return (
    <>
      <PageHeader
        title={title}
        description={`Placed ${formatDate(order.placedAtUtc)}`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders", href: "/admin/orders" }, { label: title }]}
        actions={
          <>
            {/* The backend only exposes a PDF invoice download scoped to the
                owning customer (GET /orders/{id}/invoice/pdf); there is no
                admin-scoped PDF export. Staff use browser print instead. */}
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={15} /> Print</Button>
            {order.isCancellable && (
              <CancelOrderDialog pending={m.cancel.isPending}
                onConfirm={(reason) => m.cancel.mutate({ reason })} />
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
        {order.assignedStaffId && (
          <span className="text-xs text-muted-foreground">Assigned to staff member {order.assignedStaffId.slice(0, 8)}</span>
        )}
        {order.trackingNumber && (
          <span className="text-xs text-muted-foreground">Tracking: {order.trackingNumber}</span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 space-y-5">
          <Card><CardContent className="p-5">
            <h2 className="mb-4 font-bold tracking-tight">Items</h2>
            <ul className="divide-y divide-border">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                    {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={19} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity} · {it.unitPriceFormatted}
                      {it.refundedQuantity > 0 && ` · ${it.refundedQuantity} refunded`}
                    </p>
                  </div>
                  <span className="text-sm font-bold">{it.totalFormatted}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Items total" value={koboAsNaira(order.subtotalInKobo)} />
              {order.discountInKobo > 0 && <Row label="Discount" value={`-${koboAsNaira(order.discountInKobo)}`} />}
              <Row label="Delivery" value={order.deliveryFeeInKobo === 0 ? "FREE" : koboAsNaira(order.deliveryFeeInKobo)} />
              {/* Kept for historical orders that were charged VAT; hidden when zero. */}
              {order.vatInKobo > 0 && <Row label="VAT" value={koboAsNaira(order.vatInKobo)} />}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="text-lg font-extrabold">{order.totalFormatted}</dd>
              </div>
              <Row label="Paid" value={koboAsNaira(order.amountPaidInKobo)} />
              {order.amountRefundedInKobo > 0 && <Row label="Refunded" value={koboAsNaira(order.amountRefundedInKobo)} />}
              {order.outstandingBalanceInKobo > 0 && <Row label="Outstanding" value={koboAsNaira(order.outstandingBalanceInKobo)} />}
            </dl>
          </CardContent></Card>

          {!!timeline.data?.length && (
            <Card><CardContent className="p-5">
              <h2 className="mb-4 font-bold tracking-tight">Timeline</h2>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {timeline.data.map((t, i) => (
                  <li key={t.id} className="relative">
                    <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ${i === 0 ? "bg-primary ring-4 ring-primary/15" : "bg-border"}`} />
                    <p className="text-sm font-semibold">{t.description}</p>
                    {t.notes && <p className="text-sm text-muted-foreground">{t.notes}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t.actorName ?? t.actorType} · {formatDateTime(t.occurredAtUtc)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent></Card>
          )}

          {/* Notes */}
          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Notes</h2>
            <p className="mb-3 text-xs text-muted-foreground">Internal notes are never shown to the customer.</p>

            {!!order.notes.length && (
              <ul className="mb-4 space-y-2">
                {order.notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-sm">{n.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.authorName ?? "Staff"} · {formatDateTime(n.createdAtUtc)} {n.isInternal ? "· Internal" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for your team…" />
            <Button size="sm" className="mt-2" disabled={!note.trim() || m.addNote.isPending}
              onClick={() => m.addNote.mutate({ content: note.trim(), isInternal: true }, { onSuccess: () => setNote("") })}>
              {m.addNote.isPending ? <><Spinner className="h-4 w-4" /> Saving…</> : <><MessageSquarePlus size={15} /> Add note</>}
            </Button>
          </CardContent></Card>

          {payment.data && (
            <Card><CardContent className="p-5">
              <h2 className="mb-3 font-bold tracking-tight">Payment</h2>
              <div className="mb-3 flex items-center justify-between text-sm">
                <Link href={`/admin/payments/${payment.data.id}`} className="font-medium hover:text-primary">
                  {payment.data.reference ?? payment.data.id.slice(0, 12)}
                </Link>
                <div className="flex items-center gap-2">
                  <StatusBadge status={payment.data.status} />
                  <span className="font-bold">{payment.data.amountFormatted}</span>
                </div>
              </div>
              {!!payment.data.attempts.length && (
                <ul className="divide-y divide-border text-sm">
                  {payment.data.attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="text-muted-foreground">
                        Attempt {a.attemptNumber} · {a.provider} · {formatDateTime(a.startedAtUtc)}
                      </span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent></Card>
          )}
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <aside className="space-y-4">
          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Update status</h2>
            <div className="space-y-2">
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger><SelectValue placeholder={order.status} /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note (optional)" />
              {status === "Shipped" && (
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" />
              )}
              <Button size="sm" className="w-full" disabled={!status || m.updateStatus.isPending}
                onClick={() => status && m.updateStatus.mutate(
                  { status, notes: statusNote || undefined, trackingNumber: trackingNumber || undefined },
                  { onSuccess: () => { setStatus(""); setStatusNote(""); setTrackingNumber(""); } }
                )}>
                {m.updateStatus.isPending ? <><Spinner className="h-4 w-4" /> Updating…</> : "Update status"}
              </Button>
            </div>
          </CardContent></Card>

          <AssignCard value={assignee} onChange={setAssignee}
            onAssign={(staffId) => m.assign.mutate({ staffId })} pending={m.assign.isPending} />

          <RecordPaymentCard
            outstandingInKobo={order.outstandingBalanceInKobo}
            pending={m.recordPayment.isPending}
            onSubmit={(body) => m.recordPayment.mutate(body)}
          />

          <Card><CardContent className="p-5">
            <h2 className="mb-2 font-bold tracking-tight">Shipping address</h2>
            <p className="text-sm font-medium">{order.shippingAddress.recipientName}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.formattedAddress}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Customer</h2>

            {/*
              The account that placed the order — deliberately not the shipping
              recipient, who may be someone else entirely. Staff need both, and
              the two are labelled separately below so a support call never
              chases the wrong person.
            */}
            {order.customerName || order.customerEmail ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
                  <dd className="font-medium">{order.customerName ?? "—"}</dd>
                </div>
                {order.customerEmail && (
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                    <dd className="truncate">
                      <a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">
                        {order.customerEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                    <dd>
                      <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                        {order.customerPhone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              // No linked account. Says so plainly rather than rendering a dash
              // that reads like a loading failure.
              <p className="text-sm text-muted-foreground">Guest checkout — no customer account linked.</p>
            )}

            {/* Repeated here so "who bought it" and "who receives it" can be
                compared without scrolling between two cards. */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipping recipient</p>
              <p className="text-sm font-medium">{order.shippingAddress.recipientName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
            </div>

            {(order.customerName || order.customerEmail) && (
              <Link href={`/admin/customers/${order.userId}`}
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3 w-full" })}>
                View customer
              </Link>
            )}
          </CardContent></Card>
        </aside>
      </div>
    </>
  );
}

function koboAsNaira(kobo: number): string {
  return `₦${koboToNaira(kobo).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd>
    </div>
  );
}

function CancelOrderDialog({ onConfirm, pending }: { onConfirm: (reason: string) => void; pending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setOpen(true)}>
        <XCircle size={15} /> Cancel
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>The customer will be notified. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <Field label="Reason for cancellation">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus placeholder="Out of stock, customer request…" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Keep order</Button>
            <Button variant="destructive" disabled={!reason.trim() || pending}
              onClick={() => { onConfirm(reason.trim()); setOpen(false); setReason(""); }}>
              {pending ? <><Spinner className="h-4 w-4" /> Cancelling…</> : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Staff assignment — pulls the team list from /admin/users. */
function AssignCard({ value, onChange, onAssign, pending }: {
  value: string; onChange: (v: string) => void; onAssign: (staffId: string) => void; pending?: boolean;
}) {
  const { data } = useAdminUsers({ pageNumber: 1, pageSize: 100 });
  return (
    <Card><CardContent className="p-5">
      <h2 className="mb-3 font-bold tracking-tight">Assign to staff</h2>
      <div className="space-y-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
          <SelectContent>
            {(data?.items ?? []).map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="w-full" disabled={!value || pending}
          onClick={() => onAssign(value)}>
          {pending ? <><Spinner className="h-4 w-4" /> Assigning…</> : <><UserPlus size={15} /> Assign</>}
        </Button>
      </div>
    </CardContent></Card>
  );
}

/** Manual/offline payment capture via POST /admin/orders/{id}/payments. */
function RecordPaymentCard({ outstandingInKobo, onSubmit, pending }: {
  outstandingInKobo?: number;
  onSubmit: (b: { amountInKobo: number; paymentReference?: string; paymentMethod?: string }) => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("");

  return (
    <>
      <Card><CardContent className="p-5">
        <h2 className="mb-1 font-bold tracking-tight">Record a payment</h2>
        <p className="mb-3 text-xs text-muted-foreground">For bank transfers or cash paid outside Flutterwave.</p>
        <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <Wallet size={15} /> Record payment
        </Button>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              Logs a payment received outside the online gateway. This does not charge the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Field label="Amount (₦)">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={outstandingInKobo ? String(koboToNaira(outstandingInKobo)) : "0"} autoFocus />
            </Field>
            <Field label="Method">
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank transfer, cash…" />
            </Field>
            <Field label="Reference (optional)">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Teller or transfer reference" />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!amount || Number(amount) <= 0 || pending}
              onClick={() => {
                onSubmit({
                  amountInKobo: nairaToKobo(Number(amount)),
                  paymentReference: reference || undefined,
                  paymentMethod: method || undefined,
                });
                setOpen(false); setAmount(""); setReference(""); setMethod("");
              }}>
              {pending ? <><Spinner className="h-4 w-4" /> Saving…</> : "Record payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
