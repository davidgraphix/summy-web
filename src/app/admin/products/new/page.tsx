"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/components/page-header";
import { ProductForm, toProductRequest } from "@/features/admin/components/product-form";
import { useProductMutations } from "@/features/admin/admin-hooks";
import type { ProductFormValues } from "@/features/admin/product-schema";

export default function NewProductPage() {
  const router = useRouter();
  const { create } = useProductMutations();

  const onSubmit = async (values: ProductFormValues) => {
    const product = await create.mutateAsync(toProductRequest(values));
    // Land on the edit page so images and inventory can be added right away.
    if (product?.id) router.push(`/admin/products/${product.id}`);
    else router.push("/admin/products");
  };

  return (
    <>
      <PageHeader
        title="New product"
        description="Products are created as drafts — publish when you're ready for customers to see it."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Products", href: "/admin/products" }, { label: "New" }]}
      />
      <ProductForm
        onSubmit={onSubmit}
        submitting={create.isPending}
        footer={<Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>Cancel</Link>}
      />
    </>
  );
}
