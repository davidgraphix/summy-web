"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { useForgotPassword } from "@/features/auth/auth-hooks";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/features/auth/auth-schemas";

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await forgot.mutateAsync(values);
      setSentTo(values.email);
    } catch {
      // Toast already shown by the hook.
    }
  });

  if (sentTo) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent a
          link to reset your password.
        </p>
        <Link href="/login" className={buttonVariants({ className: "mt-6 w-full" })}>Back to sign in</Link>
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>
          <Button type="submit" className="h-12 w-full" disabled={forgot.isPending}>
            {forgot.isPending ? <><Spinner className="h-4 w-4" /> Sending…</> : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
