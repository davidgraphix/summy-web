"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Star, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/admin/components/page-header";
import { ProductForm, toProductRequest } from "@/features/admin/components/product-form";
import { MediaManager } from "@/features/admin/components/media-manager";
import { InventoryPanel } from "@/features/admin/components/inventory-panel";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/features/admin/components/status-badge";
import { useAdminProduct, useProductMutations } from "@/features/admin/admin-hooks";
import type { ProductFormValues } from "@/features/admin/product-schema";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useAdminProduct(id);
  const m = useProductMutations();
  const [dirty, setDirty] = useState(false);

  if (isLoading) return <LoadingState label="Loading product…" />;
  if (isError || !product) return <ErrorState onRetry={() => refetch()} />;

  const published = product.isPublished;

  const onSubmit = async (values: ProductFormValues) => {
    await m.update.mutateAsync({ id, body: toProductRequest(values, true) });
    setDirty(false);
  };

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        actions={
          <>
            <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink size={15} /> Preview
            </a>
            <Button size="sm" variant="outline"
              onClick={() => m.setFeatured.mutate({ id, isFeatured: !product.isFeatured, slug: product.slug })}>
              <Star size={15} /> {product.isFeatured ? "Unfeature" : "Feature"}
            </Button>
            {published ? (
              <Button size="sm" variant="outline" onClick={() => m.unpublish.mutate({ id, slug: product.slug })}>
                <EyeOff size={15} /> Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={() => m.publish.mutate({ id, slug: product.slug })}>
                <Eye size={15} /> Publish
              </Button>
            )}
            <ConfirmDialog
              trigger={<Button size="sm" variant="ghost" className="text-destructive"><Trash2 size={15} /></Button>}
              title={`Delete “${product.name}”?`}
              description="This removes it from the storefront. You can restore it later from Restore."
              actionLabel="Delete product" confirmText="DELETE"
              pending={m.remove.isPending}
              onConfirm={async () => { await m.remove.mutateAsync({ id, slug: product.slug }); router.push("/admin/products"); }}
            />
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={product.status} />
        {product.isFeatured && <Badge variant="accent">Featured</Badge>}
        {published
          ? <span className="text-xs text-muted-foreground">Live on the storefront</span>
          : <span className="text-xs text-muted-foreground">Not visible to customers</span>}
        {dirty && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <ProductForm
            product={product}
            onSubmit={onSubmit}
            submitting={m.update.isPending}
            onDirtyChange={setDirty}
            footer={<Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>Back to products</Link>}
          />
        </div>

        <div className="space-y-5">
          <MediaManager productId={id} slug={product.slug} />
          <InventoryPanel productId={id} slug={product.slug} />
        </div>
      </div>
    </>
  );
}
