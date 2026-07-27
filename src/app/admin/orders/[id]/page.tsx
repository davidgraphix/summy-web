"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Download, MessageSquarePlus, Package, Printer, UserPlus, Wallet, XCircle } from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatusBadge } from "@/features/admin/components/status-badge";
import {
  useAdminOrder, useAdminOrderTimeline, useAdminOrderMutations, useAdminUsers,
} from "@/features/admin/admin-hooks";
import { usePaymentsByOrder } from "@/features/payments/payments-hooks";
import { formatNaira, formatDate, formatDateTime } from "@/lib/format";
import { API_ROOT } from "@/lib/env";

const ORDER_STATUSES = ["Pending", "Processing", "Paid", "Shipped", "Delivered", "Cancelled", "Refunded"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError, refetch } = useAdminOrder(id);
  const timeline = useAdminOrderTimeline(id);
  const payments = usePaymentsByOrder(id);
  const m = useAdminOrderMutations(id);

  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");

  if (isLoading) return <LoadingState label="Loading order…" />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  const title = order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(0, 8)}`;
  const cancellable = !/cancel|refund|deliver/i.test(order.status ?? "");

  return (
    <>
      <PageHeader
        title={title}
        description={`Placed ${formatDate(order.createdAt)}`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders", href: "/admin/orders" }, { label: title }]}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={15} /> Print</Button>
            <a href={`${API_ROOT}/admin/orders/${id}/invoice`} target="_blank" rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download size={15} /> Invoice
            </a>
            {cancellable && (
              <ConfirmDialog
                trigger={<Button size="sm" variant="ghost" className="text-destructive"><XCircle size={15} /> Cancel</Button>}
                title="Cancel this order?"
                description="The customer will be notified. This can't be undone."
                actionLabel="Cancel order"
                pending={m.cancel.isPending}
                onConfirm={() => m.cancel.mutateAsync()}
              />
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        {order.paymentStatus && <StatusBadge status={order.paymentStatus} />}
        {order.assignedToName && (
          <span className="text-xs text-muted-foreground">Assigned to {order.assignedToName}</span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 space-y-5">
          <Card><CardContent className="p-5">
            <h2 className="mb-4 font-bold tracking-tight">Items</h2>
            <ul className="divide-y divide-border">
              {order.items?.map((it, i) => (
                <li key={(it.productId ?? "") + i} className="flex gap-3 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                    {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={19} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.name ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity}{typeof it.unitPrice === "number" ? ` · ${formatNaira(it.unitPrice)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatNaira(it.lineTotal ?? (it.unitPrice ?? 0) * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {typeof order.subtotal === "number" && <Row label="Subtotal" value={formatNaira(order.subtotal)} />}
              {typeof order.shipping === "number" && <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatNaira(order.shipping)} />}
              {typeof order.tax === "number" && <Row label="VAT" value={formatNaira(order.tax)} />}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="text-lg font-extrabold">{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </CardContent></Card>

          {!!timeline.data?.length && (
            <Card><CardContent className="p-5">
              <h2 className="mb-4 font-bold tracking-tight">Timeline</h2>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {timeline.data.map((t, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ${i === 0 ? "bg-primary ring-4 ring-primary/15" : "bg-border"}`} />
                    <p className="text-sm font-semibold">{t.title ?? t.status}</p>
                    {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                    <p className="text-xs text-muted-foreground">{formatDateTime(t.occurredAt ?? t.timestamp)}</p>
                  </li>
                ))}
              </ol>
            </CardContent></Card>
          )}

          {/* Internal notes */}
          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Internal notes</h2>
            <p className="mb-3 text-xs text-muted-foreground">Only visible to your team — never shown to the customer.</p>

            {!!order.notes?.length && (
              <ul className="mb-4 space-y-2">
                {order.notes.map((n, i) => (
                  <li key={n.id ?? i} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.authorName ?? "Staff"} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for your team…" />
            <Button size="sm" className="mt-2" disabled={!note.trim() || m.addNote.isPending}
              onClick={() => m.addNote.mutate({ note: note.trim() }, { onSuccess: () => setNote("") })}>
              {m.addNote.isPending ? <><Spinner className="h-4 w-4" /> Saving…</> : <><MessageSquarePlus size={15} /> Add note</>}
            </Button>
          </CardContent></Card>

          {!!payments.data?.length && (
            <Card><CardContent className="p-5">
              <h2 className="mb-3 font-bold tracking-tight">Payment history</h2>
              <ul className="divide-y divide-border text-sm">
                {payments.data.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/admin/payments/${p.id}`} className="truncate font-medium hover:text-primary">
                        {p.reference ?? p.id.slice(0, 12)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.provider ?? "Flutterwave"} · {formatDateTime(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="font-bold">{formatNaira(p.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent></Card>
          )}
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <aside className="space-y-4">
          <Card><CardContent className="p-5">
            <h2 className="mb-3 font-bold tracking-tight">Update status</h2>
            <div className="space-y-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder={order.status ?? "Select status"} /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note (optional)" />
              <Button size="sm" className="w-full" disabled={!status || m.updateStatus.isPending}
                onClick={() => m.updateStatus.mutate(
                  { status, note: statusNote || undefined },
                  { onSuccess: () => { setStatus(""); setStatusNote(""); } }
                )}>
                {m.updateStatus.isPending ? <><Spinner className="h-4 w-4" /> Updating…</> : "Update status"}
              </Button>
            </div>
          </CardContent></Card>

          <AssignCard orderId={id} value={assignee} onChange={setAssignee}
            onAssign={(userId) => m.assign.mutate({ userId })} pending={m.assign.isPending} />

          <RecordPaymentCard
            outstanding={order.total}
            pending={m.recordPayment.isPending}
            onSubmit={(body) => m.recordPayment.mutate(body)}
          />

          {order.shippingAddress && (
            <Card><CardContent className="p-5">
              <h2 className="mb-2 font-bold tracking-tight">Shipping address</h2>
              <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {[order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city,
                  order.shippingAddress.state, order.shippingAddress.country].filter(Boolean).join(", ")}
              </p>
              {order.shippingAddress.phoneNumber && (
                <p className="text-sm text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
              )}
            </CardContent></Card>
          )}

          <Card><CardContent className="p-5">
            <h2 className="mb-2 font-bold tracking-tight">Customer</h2>
            <p className="text-sm font-medium">{order.customerName ?? "—"}</p>
            <p className="truncate text-sm text-muted-foreground">{order.customerEmail}</p>
            {order.customerId && (
              <Link href={`/admin/customers/${order.customerId}`}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd>
    </div>
  );
}

/** Staff assignment — pulls the team list from /admin/users. */
function AssignCard({ value, onChange, onAssign, pending }: {
  orderId: string; value: string; onChange: (v: string) => void; onAssign: (userId: string) => void; pending?: boolean;
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
              <SelectItem key={u.id} value={u.id}>
                {u.fullName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? u.email}
              </SelectItem>
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
function RecordPaymentCard({ outstanding, onSubmit, pending }: {
  outstanding?: number; onSubmit: (b: { amount: number; reference?: string; method?: string; note?: string }) => void; pending?: boolean;
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
                placeholder={outstanding ? String(outstanding) : "0"} autoFocus />
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
                onSubmit({ amount: Number(amount), reference: reference || undefined, method: method || undefined });
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
