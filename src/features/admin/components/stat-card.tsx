"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon, delta, hint, loading, tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Percentage change; positive renders green, negative red. */
  delta?: number | null;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneCls = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {icon && <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneCls)}>{icon}</div>}
        </div>

        {loading ? (
          <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
        )}

        <div className="mt-1.5 flex items-center gap-2">
          {typeof delta === "number" && Number.isFinite(delta) && (
            <span className={cn("inline-flex items-center gap-1 text-xs font-semibold",
              delta >= 0 ? "text-success" : "text-destructive")}>
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
