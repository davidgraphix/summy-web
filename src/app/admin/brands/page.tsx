"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Image as ImageIcon, ImageOff, MoreHorizontal, Pencil, Plus, Tag, Trash2,
} from "lucide-react";
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

/**
 * Whether the brand is live on the storefront. The API models this as a status
 * string rather than a boolean, so the comparison lives in one place instead of
 * being spelled out at every call site.
 */
const isPublished = (brand: Brand) => brand.status === "Active";

/** Logo tile with the initial-letter fallback the storefront also uses. */
function BrandLogo({ brand }: { brand: Brand }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-sm font-bold text-muted-foreground">
      {brand.logoUrl
        ? <img src={brand.logoUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-1" />
        : brand.name.charAt(0)}
    </div>
  );
}

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

  // The brand whose logo is being replaced. Held here rather than per-card so a
  // single hidden file input serves the whole grid.
  const [logoTarget, setLogoTarget] = useState<Brand | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logoTarget) fileRef.current?.click();
  }, [logoTarget]);

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = logoTarget;

    // Reset immediately so picking the same file twice still fires a change
    // event, and so a cancelled dialog does not leave the card armed.
    e.target.value = "";
    setLogoTarget(null);

    if (file && target) await m.uploadLogo.mutateAsync({ id: target.id, file });
  };

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
                  <BrandLogo brand={b} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{b.slug}</p>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isPublished(b) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {isPublished(b) ? "Published" : "Unpublished"}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${b.name}`}>
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(b)}><Pencil size={14} /> Edit</DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setLogoTarget(b)}>
                        <ImageIcon size={14} /> {b.logoUrl ? "Change logo" : "Upload logo"}
                      </DropdownMenuItem>

                      {b.logoUrl && (
                        <DropdownMenuItem onClick={() => m.removeLogo.mutate(b.id)}>
                          <ImageOff size={14} /> Remove logo
                        </DropdownMenuItem>
                      )}

                      {/*
                        Unpublishing is refused by the API while the brand still
                        has published products — it returns the count and what to
                        do about it, which is surfaced verbatim as a toast. The
                        control stays enabled deliberately: a disabled button with
                        no explanation is worse than an action that tells you why
                        it cannot happen.
                      */}
                      <DropdownMenuItem
                        onClick={() => m.setStatus.mutate({ id: b.id, isActive: !isPublished(b) })}
                      >
                        {isPublished(b) ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                      </DropdownMenuItem>

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

      {/*
        One shared file input for the whole grid. Accept list mirrors the API's
        Media:AllowedContentTypes, so an unsupported file is rejected by the
        picker rather than after a round trip.
      */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFilePicked}
        className="hidden"
      />

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
