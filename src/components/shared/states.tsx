import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-card text-primary">{icon}</div>}
      <p className="text-lg font-bold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-bold">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? "We couldn't load this right now."}
      </p>
      {onRetry && <Button className="mt-5" variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Spinner /> <span className="text-sm">{label ?? "Loading…"}</span>
    </div>
  );
}
