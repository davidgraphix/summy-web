"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { useAdminSettings, useSettingsMutations } from "@/features/admin/admin-hooks";
import type {
  CompanySettings, ContactSettings, MaintenanceSettings, SeoSettings, SocialSettings,
} from "@/features/admin/admin-types";

export default function AdminSettingsPage() {
  const { data, isLoading, isError, refetch } = useAdminSettings();
  const m = useSettingsMutations();

  if (isLoading) return <LoadingState label="Loading settings…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store details, contact information and storefront configuration."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <SettingsForm<CompanySettings>
            defaults={data?.company ?? {}} pending={m.company.isPending}
            onSave={(v) => m.company.mutate(v)}
            fields={[
              { name: "name", label: "Company name", placeholder: "Summy Solution & Technology Ventures" },
              { name: "registrationNumber", label: "Registration number", placeholder: "BN-3217879" },
              { name: "logoUrl", label: "Logo URL", placeholder: "https://res.cloudinary.com/…" },
              { name: "currency", label: "Currency code", placeholder: "NGN" },
              { name: "address", label: "Registered address", textarea: true },
            ]}
          />
        </TabsContent>

        <TabsContent value="contact">
          <SettingsForm<ContactSettings>
            defaults={data?.contact ?? {}} pending={m.contact.isPending}
            onSave={(v) => m.contact.mutate(v)}
            fields={[
              { name: "email", label: "Public email", placeholder: "hello@summy.com" },
              { name: "supportEmail", label: "Support email", placeholder: "support@summy.com" },
              { name: "phone", label: "Phone", placeholder: "0803 000 0000" },
              { name: "whatsapp", label: "WhatsApp", placeholder: "+234 803 000 0000" },
              { name: "address", label: "Store address", textarea: true },
            ]}
          />
        </TabsContent>

        <TabsContent value="social">
          <SettingsForm<SocialSettings>
            defaults={data?.social ?? {}} pending={m.social.isPending}
            onSave={(v) => m.social.mutate(v)}
            fields={[
              { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
              { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
              { name: "twitter", label: "X / Twitter", placeholder: "https://x.com/…" },
              { name: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
              { name: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
              { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
            ]}
          />
        </TabsContent>

        <TabsContent value="seo">
          <SettingsForm<SeoSettings>
            defaults={data?.seo ?? {}} pending={m.seo.isPending}
            onSave={(v) => m.seo.mutate(v)}
            hint="These defaults are used for storefront pages that don't set their own metadata."
            fields={[
              { name: "metaTitle", label: "Default meta title", placeholder: "Summy — Electronics & appliances" },
              { name: "metaDescription", label: "Default meta description", textarea: true },
              { name: "metaKeywords", label: "Keywords", placeholder: "tv, fridge, air conditioner" },
              { name: "ogImageUrl", label: "Social share image URL", placeholder: "https://…" },
            ]}
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceForm defaults={data?.maintenance ?? {}} pending={m.maintenance.isPending}
            onSave={(v) => m.maintenance.mutate(v)} />
        </TabsContent>
      </Tabs>
    </>
  );
}

interface FieldDef<T> { name: keyof T & string; label: string; placeholder?: string; textarea?: boolean }

/** Safely reads a settings value as a form-ready string. */
function asText<T extends object>(source: T, key: keyof T & string): string {
  const value = (source as Record<string, unknown>)[key];
  return value == null ? "" : String(value);
}

/** Generic settings form — each tab is a flat set of text fields. */
function SettingsForm<T extends object>({
  defaults, fields, onSave, pending, hint,
}: {
  defaults: T;
  fields: FieldDef<T>[];
  onSave: (values: T) => void;
  pending?: boolean;
  hint?: string;
}) {
  const form = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, asText(defaults, f.name)])),
  });

  // Re-seed when settings arrive after first render.
  useEffect(() => {
    form.reset(Object.fromEntries(fields.map((f) => [f.name, asText(defaults, f.name)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults]);

  const submit = form.handleSubmit((values) => {
    // Drop empty strings so we never overwrite stored values with blanks.
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "").map(([k, v]) => [k, v])
    );
    onSave(cleaned as T);
  });

  return (
    <Card><CardContent className="p-5">
      {hint && <p className="mb-4 text-sm text-muted-foreground">{hint}</p>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.name} label={f.label} className={f.textarea ? "sm:col-span-2" : undefined}>
            {f.textarea
              ? <Textarea rows={3} placeholder={f.placeholder} {...form.register(f.name)} />
              : <Input placeholder={f.placeholder} {...form.register(f.name)} />}
          </Field>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending || !form.formState.isDirty}>
            {pending ? <><Spinner className="h-4 w-4" /> Saving…</> : <><Save size={15} /> Save changes</>}
          </Button>
        </div>
      </form>
    </CardContent></Card>
  );
}

function MaintenanceForm({ defaults, onSave, pending }: {
  defaults: MaintenanceSettings; onSave: (v: MaintenanceSettings) => void; pending?: boolean;
}) {
  const form = useForm<{ message: string; allowedIps: string }>({
    defaultValues: { message: defaults.message ?? "", allowedIps: defaults.allowedIps ?? "" },
  });
  const enabled = defaults.enabled ?? false;

  useEffect(() => {
    form.reset({ message: defaults.message ?? "", allowedIps: defaults.allowedIps ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults]);

  return (
    <Card><CardContent className="space-y-5 p-5">
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-muted-foreground">
          Maintenance mode takes the storefront offline for customers. Orders can&apos;t be placed
          while it&apos;s on — the admin dashboard stays accessible.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
        <div>
          <Label>Maintenance mode</Label>
          <p className="text-xs text-muted-foreground">
            {enabled ? "The storefront is currently offline." : "The storefront is live."}
          </p>
        </div>
        <ConfirmDialog
          trigger={<span><Switch checked={enabled} aria-label="Toggle maintenance mode" /></span>}
          title={enabled ? "Bring the store back online?" : "Take the store offline?"}
          description={enabled
            ? "Customers will be able to browse and order again immediately."
            : "Customers will see a maintenance notice and won't be able to place orders."}
          actionLabel={enabled ? "Go live" : "Enable maintenance mode"}
          destructive={!enabled}
          pending={pending}
          onConfirm={() => onSave({ ...form.getValues(), enabled: !enabled })}
        />
      </div>

      <form onSubmit={form.handleSubmit((v) => onSave({ ...v, enabled }))} className="space-y-4">
        <Field label="Message shown to customers">
          <Textarea rows={3} placeholder="We'll be back shortly — we're making improvements."
            {...form.register("message")} />
        </Field>
        <Field label="Allowed IP addresses (comma separated)">
          <Input placeholder="102.89.0.1, 41.58.0.1" {...form.register("allowedIps")} />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? <><Spinner className="h-4 w-4" /> Saving…</> : <><Save size={15} /> Save settings</>}
        </Button>
      </form>
    </CardContent></Card>
  );
}
