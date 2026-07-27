import type { Metadata } from "next";
import { productsApi } from "@/features/products/products-api";
import { ProductDetail } from "./product-detail";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await productsApi.bySlug(slug);
    // SEO fields set in the admin dashboard take precedence over the defaults.
    const title = p.metaTitle?.trim() || p.name;
    const description =
      p.metaDescription?.trim() || p.description?.slice(0, 160) || `Buy ${p.name} on Summy`;
    return {
      title,
      description,
      openGraph: { title, description, images: p.primaryImageUrl ? [p.primaryImageUrl] : [] },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
