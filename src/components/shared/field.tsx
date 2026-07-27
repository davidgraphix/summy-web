import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label, error, children, className,
}: { label?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
