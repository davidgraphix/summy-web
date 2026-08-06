import type { Metadata } from "next";
import { productsApi } from "@/features/products/products-api";
import { ProductDetail } from "./product-detail";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await productsApi.bySlug(slug);
    // SEO fields set in the admin dashboard take precedence over the defaults.
    const title = p.seo.metaTitle?.trim() || p.name;
    const description =
      p.seo.metaDescription?.trim() || p.shortDescription?.slice(0, 160) || `Buy ${p.name} on Summy`;
    const image = p.images.find((i) => i.isFeatured)?.secureUrl ?? p.images[0]?.secureUrl;
    return {
      title,
      description,
      openGraph: { title, description, images: image ? [image] : [] },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
