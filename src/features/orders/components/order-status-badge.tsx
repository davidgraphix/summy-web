import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/models";

/**
 * Maps a status string to a badge tone. Matching is case-insensitive and
 * substring-based so it degrades gracefully if the backend enum differs from
 * the assumed values.
 */
export function OrderStatusBadge({ status }: { status?: OrderStatus }) {
  const s = (status ?? "").toString();
  const l = s.toLowerCase();

  const variant =
    /deliver|complete|paid|success/.test(l) ? "success" :
    /cancel|fail|refund/.test(l) ? "destructive" :
    /ship|transit|dispatch/.test(l) ? "accent" :
    /pending|await|process/.test(l) ? "muted" :
    "outline";

  return <Badge variant={variant as never}>{s || "Unknown"}</Badge>;
}
