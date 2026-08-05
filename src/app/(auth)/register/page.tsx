"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { useRegister } from "@/features/auth/auth-hooks";
import { registerSchema, type RegisterValues } from "@/features/auth/auth-schemas";
import { ApiRequestError } from "@/lib/api-client";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || undefined,
        referralCode: values.referralCode || undefined,
      });

      // Registration never issues a session — the account must be verified first.
      router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (e) {
      if (e instanceof ApiRequestError && e.validationErrors) {
        for (const { field, message } of e.validationErrors) {
          const key = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof RegisterValues;
          if (key in form.getValues()) form.setError(key, { message });
        }
      }
    }
  });

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save addresses, track orders and earn referral rewards.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input autoComplete="given-name" placeholder="Adaeze" {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input autoComplete="family-name" placeholder="Okonkwo" {...form.register("lastName")} />
            </Field>
          </div>

          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>

          <Field label="Phone number (optional)" error={form.formState.errors.phoneNumber?.message}>
            <Input inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" {...form.register("phoneNumber")} />
          </Field>

          <Field label="Password" error={form.formState.errors.password?.message}>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} autoComplete="new-password"
                placeholder="At least 8 characters" className="pr-11" {...form.register("password")} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" placeholder="Re-enter your password" {...form.register("confirmPassword")} />
          </Field>

          <Field label="Referral code (optional)" error={form.formState.errors.referralCode?.message}>
            <Input placeholder="SUMMY-XXXX" {...form.register("referralCode")} />
          </Field>

          <Button type="submit" className="h-12 w-full" disabled={register.isPending}>
            {register.isPending ? <><Spinner className="h-4 w-4" /> Creating account…</> : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card><CardContent className="flex justify-center p-10"><Spinner /></CardContent></Card>}>
      <RegisterForm />
    </Suspense>
  );
}
