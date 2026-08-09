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
import { ApiRequestError } from "@/lib/api-client";
import type { Address } from "@/types/models";

const ADDRESS_FIELDS = new Set<keyof AddressValues>([
  "recipientName", "phoneNumber", "country", "state", "city", "localGovernment",
  "streetAddress", "apartmentSuite", "postalCode", "landmark", "deliveryInstructions",
]);

export default function AddressesPage() {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const m = useAddressMutations();
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Nigeria", state: "Lagos" },
  });

  const openNew = () => {
    form.reset({
      recipientName: "", phoneNumber: "", streetAddress: "", apartmentSuite: "",
      city: "", state: "Lagos", postalCode: "", country: "Nigeria",
    });
    setEditing("new");
  };

  const openEdit = (a: Address) => {
    form.reset({
      recipientName: a.recipientName, phoneNumber: a.phoneNumber,
      streetAddress: a.streetAddress, apartmentSuite: a.apartmentSuite ?? "", city: a.city,
      state: a.state, postalCode: a.postalCode ?? "", country: a.country,
      localGovernment: a.localGovernment ?? "", landmark: a.landmark ?? "",
      deliveryInstructions: a.deliveryInstructions ?? "",
    });
    setEditing(a);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing === "new") await m.create.mutateAsync(values);
      else if (editing) await m.update.mutateAsync({ id: editing.id, body: { ...values, isActive: true } });
      setEditing(null);
    } catch (e) {
      // The hook already toasts the top-level message; this additionally
      // pins field-specific failures onto the matching input.
      if (e instanceof ApiRequestError && e.validationErrors) {
        for (const { field, message } of e.validationErrors) {
          const key = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof AddressValues;
          if (ADDRESS_FIELDS.has(key)) form.setError(key, { message });
        }
      }
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
              <Field label="Full name" error={form.formState.errors.recipientName?.message} className="sm:col-span-2">
                <Input placeholder="Adaeze Okonkwo" {...form.register("recipientName")} />
              </Field>
              <Field label="Phone number" error={form.formState.errors.phoneNumber?.message}>
                <Input inputMode="tel" placeholder="0803 000 0000" {...form.register("phoneNumber")} />
              </Field>
              <Field label="City" error={form.formState.errors.city?.message}>
                <Input placeholder="Ikeja" {...form.register("city")} />
              </Field>
              <Field label="Street address" error={form.formState.errors.streetAddress?.message} className="sm:col-span-2">
                <Input placeholder="12 Allen Avenue" {...form.register("streetAddress")} />
              </Field>
              <Field label="Apartment, suite (optional)" className="sm:col-span-2">
                <Input placeholder="Flat 4B" {...form.register("apartmentSuite")} />
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
              <Field label="Landmark (optional)">
                <Input placeholder="Near First Bank" {...form.register("landmark")} />
              </Field>
              <Field label="Delivery instructions (optional)" className="sm:col-span-2">
                <Input placeholder="Gate code, preferred time…" {...form.register("deliveryInstructions")} />
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
                  <p className="font-semibold">{a.recipientName}</p>
                  {a.isDefault && <Badge variant="accent">Default</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.formattedAddress}</p>
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
