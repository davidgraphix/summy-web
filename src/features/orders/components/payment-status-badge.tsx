import { Badge } from "@/components/ui/badge";

/**
 * The one place a payment status becomes something a human reads.
 *
 * <p>
 * Payment status was previously rendered as raw uppercase text in a muted grey
 * span, so <code>Successful</code>, <code>Expired</code> and <code>Failed</code>
 * were visually identical — the customer and the admin had to read carefully to
 * tell a paid order from a lost one. Order status already had a badge; payment
 * status, which is the one that decides whether money moved, did not.
 * </p>
 * <p>
 * Both a tone and a plain-English label are given, never colour alone.
 * </p>
 */
export type PaymentStatusTone = "success" | "destructive" | "accent" | "muted" | "outline";

/** Maps the backend's PaymentTransactionStatus to a tone and a readable label. */
export function describePaymentStatus(status?: string): { label: string; variant: PaymentStatusTone } {
  switch ((status ?? "").toLowerCase()) {
    case "successful":
      return { label: "Paid", variant: "success" };
    case "pending":
    case "initialized":
      return { label: "Awaiting payment", variant: "muted" };
    case "processing":
      return { label: "Confirming payment", variant: "accent" };
    case "failed":
      return { label: "Payment failed", variant: "destructive" };
    case "cancelled":
      return { label: "Payment cancelled", variant: "destructive" };
    case "expired":
      return { label: "Payment expired", variant: "destructive" };
    case "refunded":
      return { label: "Refunded", variant: "outline" };
    case "partiallyrefunded":
      return { label: "Partially refunded", variant: "outline" };
    default:
      // Shown rather than hidden: an unmapped status is a contract drift worth
      // noticing, not something to silently render as blank.
      return { label: status || "Unknown", variant: "outline" };
  }
}

export function PaymentStatusBadge({ status }: { status?: string }) {
  const { label, variant } = describePaymentStatus(status);
  return <Badge variant={variant as never}>{label}</Badge>;
}
