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
import { useLogin } from "@/features/auth/auth-hooks";
import { loginSchema, type LoginValues } from "@/features/auth/auth-schemas";
import { ApiRequestError } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      router.replace(redirect);
    } catch (e) {
      // Surface server-side field errors on the matching inputs.
      if (e instanceof ApiRequestError && e.validationErrors) {
        for (const { field, message } of e.validationErrors) {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          if (key === "email" || key === "password") {
            form.setError(key, { message });
          }
        }
      }
    }
  });

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to track orders and check out faster.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>

          <Field label="Password" error={form.formState.errors.password?.message}>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} autoComplete="current-password"
                placeholder="••••••••" className="pr-11" {...form.register("password")} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="h-12 w-full" disabled={login.isPending}>
            {login.isPending ? <><Spinner className="h-4 w-4" /> Signing in…</> : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Summy?{" "}
          <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card><CardContent className="flex justify-center p-10"><Spinner /></CardContent></Card>}>
      <LoginForm />
    </Suspense>
  );
}
