"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/field";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { Spinner } from "@/components/ui/spinner";
import { useAddresses, useAddressMutations } from "@/features/addresses/addresses-hooks";
import { addressSchema, NG_STATES, type AddressValues } from "@/features/addresses/address-schema";
import type { Address } from "@/types/models";

export default function AddressesPage() {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const m = useAddressMutations();
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Nigeria", state: "Lagos" },
  });

  const openNew = () => {
    form.reset({ fullName: "", phoneNumber: "", line1: "", line2: "", city: "", state: "Lagos", postalCode: "", country: "Nigeria" });
    setEditing("new");
  };

  const openEdit = (a: Address) => {
    form.reset({
      fullName: a.fullName ?? "", phoneNumber: a.phoneNumber ?? "",
      line1: a.line1 ?? "", line2: a.line2 ?? "", city: a.city ?? "",
      state: a.state ?? "Lagos", postalCode: a.postalCode ?? "", country: a.country ?? "Nigeria",
    });
    setEditing(a);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing === "new") await m.create.mutateAsync(values);
      else if (editing) await m.update.mutateAsync({ id: editing.id, body: values });
      setEditing(null);
    } catch {
      // Toast already shown by the hook.
    }
  });

  const saving = m.create.isPending || m.update.isPending;

  if (isLoading) return <LoadingState label="Loading your addresses…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Addresses</h1>
          <p className="text-sm text-muted-foreground">Manage where we deliver your orders.</p>
        </div>
        {!editing && <Button onClick={openNew}><Plus size={16} /> Add address</Button>}
      </div>

      {editing && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing === "new" ? "New address" : "Edit address"}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" error={form.formState.errors.fullName?.message} className="sm:col-span-2">
                <Input placeholder="Adaeze Okonkwo" {...form.register("fullName")} />
              </Field>
              <Field label="Phone number" error={form.formState.errors.phoneNumber?.message}>
                <Input inputMode="tel" placeholder="0803 000 0000" {...form.register("phoneNumber")} />
              </Field>
              <Field label="City" error={form.formState.errors.city?.message}>
                <Input placeholder="Ikeja" {...form.register("city")} />
              </Field>
              <Field label="Street address" error={form.formState.errors.line1?.message} className="sm:col-span-2">
                <Input placeholder="12 Allen Avenue" {...form.register("line1")} />
              </Field>
              <Field label="Apartment, suite (optional)" className="sm:col-span-2">
                <Input placeholder="Flat 4B" {...form.register("line2")} />
              </Field>
              <Field label="State" error={form.formState.errors.state?.message}>
                <select {...form.register("state")}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary">
                  {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Postal code (optional)">
                <Input placeholder="100001" {...form.register("postalCode")} />
              </Field>
              <Field label="Country" error={form.formState.errors.country?.message} className="sm:col-span-2">
                <Input {...form.register("country")} />
              </Field>

              <div className="flex gap-2 pt-1 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save address"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!addresses?.length && !editing ? (
        <Card><CardContent className="p-5">
          <EmptyState
            icon={<MapPin size={28} />}
            title="No saved addresses"
            description="Add an address to check out faster next time."
            action={<Button onClick={openNew}><Plus size={16} /> Add address</Button>}
          />
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses?.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{a.fullName ?? "Address"}</p>
                  {a.isDefault && <Badge variant="accent">Default</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ")}
                </p>
                {a.phoneNumber && <p className="text-sm text-muted-foreground">{a.phoneNumber}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!a.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => m.setDefault.mutate(a.id)}
                      disabled={m.setDefault.isPending}>
                      <Check size={14} /> Set default
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => { if (confirm("Remove this address?")) m.remove.mutate(a.id); }}
                    disabled={m.remove.isPending}>
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
