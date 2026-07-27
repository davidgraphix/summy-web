"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/features/categories/categories-hooks";
import { useBrands } from "@/features/brands/brands-hooks";
import { productSchema, parseTags, type ProductFormValues } from "../product-schema";
import type { AdminProduct, ProductRequest } from "../admin-types";

const NONE = "__none";

/** Maps an existing product onto form defaults. */
function toDefaults(p?: AdminProduct): ProductFormValues {
  const specs = Array.isArray(p?.specifications)
    ? p!.specifications
    : p?.specifications
      ? Object.entries(p.specifications).map(([name, value]) => ({ name, value: String(value) }))
      : [];
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    sku: p?.sku ?? "",
    description: p?.description ?? "",
    price: p?.price ?? 0,
    compareAtPrice: p?.compareAtPrice ?? undefined,
    costPrice: p?.costPrice ?? undefined,
    categoryId: p?.category?.id ?? "",
    brandId: p?.brand?.id ?? "",
    stockQuantity: p?.stockQuantity ?? 0,
    isFeatured: p?.isFeatured ?? false,
    metaTitle: p?.metaTitle ?? "",
    metaDescription: p?.metaDescription ?? "",
    tagsText: p?.tags?.join(", ") ?? "",
    specifications: specs,
    variants: p?.variants?.map((v) => ({
      name: v.name ?? "", sku: v.sku ?? "", price: v.price ?? 0, stockQuantity: v.stockQuantity ?? 0,
    })) ?? [],
  };
}

/** Strips empty optional values so we never send blank keys to the API. */
export function toProductRequest(values: ProductFormValues): ProductRequest {
  const clean = <T,>(v: T | "" | undefined | null): T | undefined =>
    v === "" || v === undefined || v === null ? undefined : v;
  return {
    name: values.name,
    slug: clean(values.slug),
    sku: clean(values.sku),
    description: clean(values.description),
    price: values.price,
    compareAtPrice: clean(values.compareAtPrice),
    costPrice: clean(values.costPrice),
    categoryId: clean(values.categoryId),
    brandId: clean(values.brandId),
    stockQuantity: values.stockQuantity,
    isFeatured: values.isFeatured,
    metaTitle: clean(values.metaTitle),
    metaDescription: clean(values.metaDescription),
    tags: parseTags(values.tagsText),
    specifications: values.specifications?.filter((s) => s.name && s.value),
    variants: values.variants?.filter((v) => v.name),
  };
}

export function ProductForm({
  product, onSubmit, submitting, footer, onDirtyChange,
}: {
  product?: AdminProduct;
  onSubmit: (values: ProductFormValues) => void | Promise<unknown>;
  submitting?: boolean;
  footer?: React.ReactNode;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toDefaults(product),
  });

  // Re-seed once the product loads (edit page fetches after first render).
  useEffect(() => { if (product) form.reset(toDefaults(product)); }, [product, form]);
  useEffect(() => { onDirtyChange?.(form.formState.isDirty); }, [form.formState.isDirty, onDirtyChange]);

  const specs = useFieldArray({ control: form.control, name: "specifications" });
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const e = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; stock</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------------- General ---------------- */}
        <TabsContent value="general">
          <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Product name" error={e.name?.message} className="sm:col-span-2">
              <Input placeholder="LG 55&quot; UHD Smart TV" {...form.register("name")} />
            </Field>
            <Field label="URL slug (optional)" error={e.slug?.message}>
              <Input placeholder="lg-55-uhd-smart-tv" {...form.register("slug")} />
            </Field>
            <Field label="SKU (optional)" error={e.sku?.message}>
              <Input placeholder="LG-UHD-55" {...form.register("sku")} />
            </Field>

            <Field label="Category" className="sm:col-span-1">
              <Select value={form.watch("categoryId") || NONE}
                onValueChange={(v) => form.setValue("categoryId", v === NONE ? "" : v, { shouldDirty: true })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No category</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Brand">
              <Select value={form.watch("brandId") || NONE}
                onValueChange={(v) => form.setValue("brandId", v === NONE ? "" : v, { shouldDirty: true })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No brand</SelectItem>
                  {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Description" error={e.description?.message} className="sm:col-span-2">
              <Textarea rows={6} placeholder="What makes this product worth buying?" {...form.register("description")} />
            </Field>

            <Field label="Tags (comma separated)" error={e.tagsText?.message} className="sm:col-span-2">
              <Input placeholder="smart tv, 4k, living room" {...form.register("tagsText")} />
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 sm:col-span-2">
              <div>
                <Label>Featured product</Label>
                <p className="text-xs text-muted-foreground">Shows in the Featured section on the storefront.</p>
              </div>
              <Switch checked={!!form.watch("isFeatured")}
                onCheckedChange={(v) => form.setValue("isFeatured", v, { shouldDirty: true })} />
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* ---------------- Pricing ---------------- */}
        <TabsContent value="pricing">
          <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Price (₦)" error={e.price?.message}>
              <Input type="number" min={0} step="1" {...form.register("price")} />
            </Field>
            <Field label="Compare-at price (₦)" error={e.compareAtPrice?.message}>
              <Input type="number" min={0} step="1" placeholder="Optional" {...form.register("compareAtPrice")} />
            </Field>
            <Field label="Cost price (₦)" error={e.costPrice?.message}>
              <Input type="number" min={0} step="1" placeholder="Optional" {...form.register("costPrice")} />
            </Field>
            <Field label="Stock quantity" error={e.stockQuantity?.message}>
              <Input type="number" min={0} step="1" {...form.register("stockQuantity")} />
            </Field>
            <p className="text-xs text-muted-foreground sm:col-span-3">
              Setting a compare-at price above the price shows a discount badge on the storefront.
              For ongoing stock movements use the Inventory tab, which keeps an audit history.
            </p>
          </CardContent></Card>
        </TabsContent>

        {/* ---------------- Specifications ---------------- */}
        <TabsContent value="specs">
          <Card><CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              These appear in the Specifications table on the product page.
            </p>
            {specs.fields.length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                No specifications yet.
              </p>
            )}
            {specs.fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-start gap-2">
                <Input className="min-w-[140px] flex-1" placeholder="Screen size"
                  {...form.register(`specifications.${i}.name`)} />
                <Input className="min-w-[140px] flex-[2]" placeholder="55 inches"
                  {...form.register(`specifications.${i}.value`)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => specs.remove(i)}
                  aria-label="Remove specification" className="text-destructive"><Trash2 size={16} /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => specs.append({ name: "", value: "" })}>
              <Plus size={15} /> Add specification
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* ---------------- Variants ---------------- */}
        <TabsContent value="variants">
          <Card><CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Variants let customers choose between options such as size or colour.
            </p>
            {variants.fields.length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                No variants — this product is sold as a single option.
              </p>
            )}
            {variants.fields.map((f, i) => (
              <div key={f.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                <Input placeholder="Variant name" {...form.register(`variants.${i}.name`)} />
                <Input placeholder="SKU" {...form.register(`variants.${i}.sku`)} />
                <Input type="number" min={0} placeholder="Price" {...form.register(`variants.${i}.price`)} />
                <Input type="number" min={0} placeholder="Stock" {...form.register(`variants.${i}.stockQuantity`)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => variants.remove(i)}
                  aria-label="Remove variant" className="text-destructive"><Trash2 size={16} /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => variants.append({ name: "", sku: "", price: 0, stockQuantity: 0 })}>
              <Plus size={15} /> Add variant
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* ---------------- SEO ---------------- */}
        <TabsContent value="seo">
          <Card><CardContent className="grid gap-4 p-5">
            <Field label="Meta title" error={e.metaTitle?.message}>
              <Input placeholder="Defaults to the product name" {...form.register("metaTitle")} />
            </Field>
            <Field label="Meta description" error={e.metaDescription?.message}>
              <Textarea rows={3} placeholder="Defaults to the product description" {...form.register("metaDescription")} />
            </Field>

            {/* Search-result preview */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search preview</p>
              <p className="truncate text-sm font-medium text-primary">
                {form.watch("metaTitle") || form.watch("name") || "Product name"} · Summy
              </p>
              <p className="truncate text-xs text-success">
                summysolutions.com/products/{form.watch("slug") || "product-slug"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {form.watch("metaDescription") || form.watch("description") || "Add a description to control how this looks in search results."}
              </p>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        {footer}
      </div>
    </form>
  );
}
