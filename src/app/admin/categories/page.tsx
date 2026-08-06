"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layers, MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { PageHeader } from "@/features/admin/components/page-header";
import { useCategories } from "@/features/categories/categories-hooks";
import { useCategoryMutations } from "@/features/admin/admin-hooks";
import type { Category } from "@/types/models";

const NONE = "__none";
const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const m = useCategoryMutations();
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", slug: "", description: "", parentId: "" } });

  const openNew = () => { form.reset({ name: "", slug: "", description: "", parentId: "" }); setEditing("new"); };
  const openEdit = (c: Category) => {
    form.reset({ name: c.name, slug: c.slug ?? "", description: "", parentId: c.parentId ?? "" });
    setEditing(c);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const body = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      parentId: values.parentId || null,
    };
    if (editing === "new") await m.create.mutateAsync(body);
    else if (editing) await m.update.mutateAsync({ id: editing.id, body });
    setEditing(null);
  });

  const saving = m.create.isPending || m.update.isPending;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories drive storefront navigation and product filtering."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Categories" }]}
        actions={<Button size="sm" onClick={openNew}><Plus size={15} /> New category</Button>}
      />

      {isLoading ? <LoadingState label="Loading categories…" />
        : isError ? <ErrorState onRetry={() => refetch()} />
        : !categories?.length ? (
          <Card><CardContent className="p-5">
            <EmptyState icon={<Layers size={26} />} title="No categories yet"
              description="Create your first category to organise the catalogue."
              action={<Button onClick={openNew}><Plus size={15} /> New category</Button>} />
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">/{c.slug ?? c.id.slice(0, 8)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}><Pencil size={14} /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => m.setStatus.mutate({ id: c.id, isActive: c.status !== "Active" })}>
                          <Power size={14} /> Toggle status
                        </DropdownMenuItem>
                        <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()} asChild>
                          <ConfirmDialog
                            trigger={<button className="flex w-full items-center gap-2"><Trash2 size={14} /> Delete</button>}
                            title={`Delete “${c.name}”?`}
                            description="Products in this category won't be deleted, but they'll lose their category. You can restore it from Restore."
                            actionLabel="Delete category"
                            pending={m.remove.isPending}
                            onConfirm={() => m.remove.mutateAsync(c.id)}
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {typeof c.productCount === "number" && (
                    <p className="mt-3 text-xs text-muted-foreground">{c.productCount} products</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New category" : "Edit category"}</DialogTitle>
            <DialogDescription>Changes appear in storefront navigation immediately.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Name" error={form.formState.errors.name?.message}>
              <Input autoFocus placeholder="Televisions" {...form.register("name")} />
            </Field>
            <Field label="Slug (optional)" error={form.formState.errors.slug?.message}>
              <Input placeholder="televisions" {...form.register("slug")} />
            </Field>
            <Field label="Parent category (optional)">
              <Select value={form.watch("parentId") || NONE}
                onValueChange={(v) => form.setValue("parentId", v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Top level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Top level</SelectItem>
                  {categories?.filter((c) => editing === "new" || c.id !== editing?.id)
                    .map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description (optional)">
              <Textarea rows={3} {...form.register("description")} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner className="h-4 w-4" /> Saving…</> : "Save category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
