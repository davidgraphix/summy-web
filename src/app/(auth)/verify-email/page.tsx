"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useVerifyEmail, useResendVerification } from "@/features/auth/auth-hooks";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email") ?? "";

  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const attempted = useRef(false);
  const [state, setState] = useState<"idle" | "verifying" | "done" | "failed">(token ? "verifying" : "idle");

  // Verify once when arriving from the emailed link.
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verify.mutateAsync({ token, email: email || undefined })
      .then(() => setState("done"))
      .catch(() => setState("failed"));
  }, [token, email, verify]);

  if (state === "verifying") {
    return (
      <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-lg font-bold">Verifying your email…</p>
      </CardContent></Card>
    );
  }

  if (state === "done") {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Email verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account is ready. You can sign in now.</p>
        <Link href="/login" className={buttonVariants({ className: "mt-6 w-full" })}>Continue to sign in</Link>
      </CardContent></Card>
    );
  }

  if (state === "failed") {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle size={30} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Verification link didn&apos;t work</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may have expired or already been used. Request a fresh one below.
        </p>
        {email && (
          <Button className="mt-6 w-full" disabled={resend.isPending} onClick={() => resend.mutate(email)}>
            {resend.isPending ? <><Spinner className="h-4 w-4" /> Sending…</> : "Resend verification email"}
          </Button>
        )}
        <Link href="/login" className={buttonVariants({ variant: "outline", className: "mt-2 w-full" })}>
          Back to sign in
        </Link>
      </CardContent></Card>
    );
  }

  // No token in the URL — the post-registration "check your inbox" screen.
  return (
    <Card><CardContent className="p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck size={30} />
      </div>
      <h1 className="text-xl font-extrabold tracking-tight">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a verification link{email ? <> to <span className="font-medium text-foreground">{email}</span></> : ""}.
        Click it to activate your account.
      </p>
      {email && (
        <Button variant="outline" className="mt-6 w-full" disabled={resend.isPending} onClick={() => resend.mutate(email)}>
          {resend.isPending ? <><Spinner className="h-4 w-4" /> Sending…</> : "Resend email"}
        </Button>
      )}
      <Link href="/login" className={buttonVariants({ variant: "ghost", className: "mt-2 w-full" })}>
        Back to sign in
      </Link>
    </CardContent></Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Card><CardContent className="flex justify-center p-10"><Spinner /></CardContent></Card>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
