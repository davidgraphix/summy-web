"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { useResetPassword } from "@/features/auth/auth-hooks";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/auth-schemas";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const reset = useResetPassword();
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await reset.mutateAsync({ token, newPassword: values.newPassword, confirmPassword: values.confirmPassword });
      setDone(true);
    } catch {
      // Toast already shown by the hook.
    }
  });

  if (!token) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link is missing its reset token. Request a new one to continue.
        </p>
        <Link href="/forgot-password" className={buttonVariants({ className: "mt-6 w-full" })}>
          Request a new link
        </Link>
      </CardContent></Card>
    );
  }

  if (done) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Link href="/login" className={buttonVariants({ className: "mt-6 w-full" })}>Continue to sign in</Link>
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick something you haven&apos;t used before.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="New password" error={form.formState.errors.newPassword?.message}>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} autoComplete="new-password"
                placeholder="8+ chars, upper, lower, digit, symbol" className="pr-11" {...form.register("newPassword")} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm new password" error={form.formState.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" placeholder="Re-enter your password" {...form.register("confirmPassword")} />
          </Field>

          <Button type="submit" className="h-12 w-full" disabled={reset.isPending}>
            {reset.isPending ? <><Spinner className="h-4 w-4" /> Updating…</> : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card><CardContent className="flex justify-center p-10"><Spinner /></CardContent></Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
