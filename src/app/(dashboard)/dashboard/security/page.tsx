"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogOut, Monitor, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { formatDateTime } from "@/lib/format";
import {
  useChangePassword, useSessions, useSessionMutations, useLoginHistory,
} from "@/features/customer/account-hooks";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function SecurityPage() {
  const changePassword = useChangePassword();
  const sessions = useSessions();
  const history = useLoginHistory();
  const m = useSessionMutations();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      form.reset();
    } catch {
      // Toast already shown by the hook.
    }
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">Manage your password and active sessions.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Change password</h2>
          </div>

          <form onSubmit={onSubmit} className="grid max-w-md gap-3">
            <Field label="Current password" error={form.formState.errors.currentPassword?.message}>
              <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
            </Field>

            <Field label="New password" error={form.formState.errors.newPassword?.message}>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} autoComplete="new-password"
                  placeholder="At least 8 characters" className="pr-11" {...form.register("newPassword")} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm new password" error={form.formState.errors.confirmPassword?.message}>
              <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
            </Field>

            <div className="pt-1">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <><Spinner className="h-4 w-4" /> Updating…</> : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Active sessions</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => m.logoutOthers.mutate()}
                disabled={m.logoutOthers.isPending}>
                <LogOut size={15} /> Sign out other devices
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => m.logoutAll.mutate()}
                disabled={m.logoutAll.isPending}>
                <LogOut size={15} /> Sign out everywhere
              </Button>
            </div>
          </div>

          {sessions.isLoading ? (
            <LoadingState />
          ) : !sessions.data?.length ? (
            <EmptyState icon={<Monitor size={28} />} title="No active sessions found" />
          ) : (
            <ul className="divide-y divide-border">
              {sessions.data.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{s.deviceName ?? "Unknown device"}</p>
                      {s.isCurrent && <Badge variant="success">This device</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[s.location ?? s.ipAddress, `Last active ${formatDateTime(s.lastUsedAtUtc)}`]
                        .filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => m.revoke.mutate(s.id)} disabled={m.revoke.isPending}>
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-lg font-bold">Recent sign-in activity</h2>
          {history.isLoading ? (
            <LoadingState />
          ) : !history.data?.length ? (
            <EmptyState icon={<Monitor size={28} />} title="No sign-in history yet" />
          ) : (
            <ul className="divide-y divide-border">
              {history.data.slice(0, 10).map((h, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{h.deviceDescription ?? "Unknown device"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[h.location ?? h.ipAddress, formatDateTime(h.createdAtUtc), h.failureReason]
                        .filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge variant={h.outcome === "Success" ? "muted" : "destructive"}>
                    {h.outcome === "Success" ? "Success" : "Failed"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
