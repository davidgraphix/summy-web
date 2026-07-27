"use client";

import { useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/**
 * Guards destructive and bulk actions. Pass `confirmText` to require the user
 * to type a value (e.g. the record's name) before the action unlocks.
 */
export function ConfirmDialog({
  trigger, title, description, actionLabel = "Confirm", destructive = true,
  confirmText, onConfirm, pending,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  destructive?: boolean;
  confirmText?: string;
  onConfirm: () => void | Promise<unknown>;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const locked = !!confirmText && typed.trim() !== confirmText.trim();

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTyped(""); }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>

        {confirmText && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-semibold text-foreground">{confirmText}</span> to confirm.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus placeholder={confirmText} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction destructive={destructive} disabled={locked || pending}
            onClick={async (e) => { e.preventDefault(); await onConfirm(); setOpen(false); setTyped(""); }}>
            {pending ? <><Spinner className="h-4 w-4" /> Working…</> : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
