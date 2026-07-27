import { Badge } from "@/components/ui/badge";

/**
 * Generic status pill. Matching is substring-based and case-insensitive so it
 * stays correct whatever the backend's exact enum values turn out to be.
 */
export function StatusBadge({ status, fallback = "Unknown" }: { status?: string | null; fallback?: string }) {
  const s = (status ?? "").toString();
  const l = s.toLowerCase();

  const variant =
    /active|success|paid|complete|deliver|approved|sent|published|enabled/.test(l) ? "success" :
    /fail|cancel|reject|suspend|disabled|error|refund|deleted|out of stock/.test(l) ? "destructive" :
    /pending|queue|await|process|draft|low/.test(l) ? "muted" :
    /ship|transit|dispatch/.test(l) ? "accent" :
    "outline";

  return <Badge variant={variant as never}>{s || fallback}</Badge>;
}
