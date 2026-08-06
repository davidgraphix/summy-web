"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { useBrands } from "@/features/brands/brands-hooks";
import { useBrandMutations } from "@/features/admin/admin-hooks";
import type { Brand } from "@/types/models";

const schema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export default function AdminBrandsPage() {
  const { data: brands, isLoading, isError, refetch } = useBrands();
  const m = useBrandMutations();
  const [editing, setEditing] = useState<Brand | "new" | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", slug: "", description: "", websiteUrl: "" } });

  const openNew = () => { form.reset({ name: "", slug: "", description: "", websiteUrl: "" }); setEditing("new"); };
  const openEdit = (b: Brand) => {
    form.reset({ name: b.name, slug: b.slug, description: b.description ?? "", websiteUrl: b.websiteUrl ?? "" });
    setEditing(b);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const body = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      websiteUrl: values.websiteUrl || undefined,
    };
    if (editing === "new") await m.create.mutateAsync(body);
    else if (editing) await m.update.mutateAsync({ id: editing.id, body });
    setEditing(null);
  });

  const saving = m.create.isPending || m.update.isPending;

  return (
    <>
      <PageHeader
        title="Brands"
        description="Brands power the storefront filter strip."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Brands" }]}
        actions={<Button size="sm" onClick={openNew}><Plus size={15} /> New brand</Button>}
      />

      {isLoading ? <LoadingState label="Loading brands…" />
        : isError ? <ErrorState onRetry={() => refetch()} />
        : !brands?.length ? (
          <Card><CardContent className="p-5">
            <EmptyState icon={<Tag size={26} />} title="No brands yet"
              description="Add the manufacturers you stock."
              action={<Button onClick={openNew}><Plus size={15} /> New brand</Button>} />
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                    {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-full w-full object-contain" /> : b.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{b.slug}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${b.name}`}>
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(b)}><Pencil size={14} /> Edit</DropdownMenuItem>
                      <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()} asChild>
                        <ConfirmDialog
                          trigger={<button className="flex w-full items-center gap-2"><Trash2 size={14} /> Delete</button>}
                          title={`Delete “${b.name}”?`}
                          description="Products keep their data but lose this brand, and it disappears from storefront filters."
                          actionLabel="Delete brand"
                          pending={m.remove.isPending}
                          onConfirm={() => m.remove.mutateAsync(b.id)}
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New brand" : "Edit brand"}</DialogTitle>
            <DialogDescription>Brand changes update storefront filters immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Name" error={form.formState.errors.name?.message}>
              <Input autoFocus placeholder="Samsung" {...form.register("name")} />
            </Field>
            <Field label="Slug (optional)"><Input placeholder="samsung" {...form.register("slug")} /></Field>
            <Field label="Website (optional)" error={form.formState.errors.websiteUrl?.message}>
              <Input placeholder="https://www.samsung.com" {...form.register("websiteUrl")} />
            </Field>
            <Field label="Description (optional)"><Textarea rows={3} {...form.register("description")} /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
