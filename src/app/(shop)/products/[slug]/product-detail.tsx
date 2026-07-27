"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Heart, Package, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/shared/rating";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { ProductCard } from "@/features/products/components/product-card";
import { productImage } from "@/features/products/product-image";
import { formatNaira, discountPercent } from "@/lib/format";
import { useProduct, useProducts } from "@/features/products/products-hooks";
import { useCart } from "@/features/cart/use-cart";
import { cld } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";

export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const cart = useCart();

  const related = useProducts(
    product ? { categoryId: product.category?.id, pageSize: 4 } : { pageSize: 0 }
  );

  if (isLoading) return <LoadingState label="Loading product…" />;
  if (isError || !product) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorState onRetry={() => refetch()} /></div>;

  // Variants are configured in the admin dashboard; when present the customer
  // picks one and its price/stock override the base product values.
  const variants = product.variants ?? [];
  const selectedVariant = variants.find((v) => (v.id ?? v.name) === variantId) ?? null;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const variantStock = selectedVariant?.stockQuantity;

  const gallery = product.images?.length ? product.images : (product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : []);
  const heroUrl = gallery[activeImg]?.url ? cld.detail(gallery[activeImg]!.url) : "";
  const off = discountPercent(effectivePrice, product.compareAtPrice);
  const inStock = selectedVariant ? (variantStock ?? 0) > 0 : (product.inStock ?? true);
  const brand = product.brand?.name ?? product.brandName;
  const specs = Array.isArray(product.specifications)
    ? product.specifications
    : product.specifications ? Object.entries(product.specifications).map(([name, value]) => ({ name, value })) : [];

  const addToCart = () => cart.add({
    productId: product.id,
    name: selectedVariant?.name ? `${product.name} — ${selectedVariant.name}` : product.name,
    slug: product.slug,
    unitPrice: effectivePrice,
    quantity: qty,
    lineTotal: effectivePrice * qty,
    imageUrl: productImage(product, "thumb"),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <button onClick={() => router.back()} className="mb-5 flex items-center gap-1 text-sm font-medium text-primary">
        <ChevronLeft size={16} /> Back to products
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-border bg-muted text-muted-foreground/30">
            {heroUrl ? <Image src={heroUrl} alt={product.name} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
                     : <Package size={92} strokeWidth={1} />}
            {off > 0 && <Badge variant="destructive" className="absolute left-4 top-4">-{off}%</Badge>}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${i === activeImg ? "border-primary" : "border-border"}`}>
                  <img src={cld.thumb(g.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {brand && <span className="text-xs font-semibold uppercase tracking-wide text-primary">{brand}</span>}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{product.name}</h1>
          <div className="mt-2"><Rating value={product.rating ?? 0} count={product.reviewCount} size={16} /></div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatNaira(effectivePrice)}</span>
            {off > 0 && <span className="text-muted-foreground line-through">{formatNaira(product.compareAtPrice!)}</span>}
          </div>
          <p className={`mt-1 text-sm font-medium ${inStock ? "text-success" : "text-destructive"}`}>
            {inStock ? "✓ In stock — ready to ship" : "Out of stock"}
          </p>

          {product.description && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const key = v.id ?? v.name ?? "";
                  const active = variantId === key;
                  const soldOut = typeof v.stockQuantity === "number" && v.stockQuantity <= 0;
                  return (
                    <button key={key} type="button" disabled={soldOut}
                      onClick={() => setVariantId(active ? null : key)}
                      aria-pressed={active}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}>
                      {v.name}
                      {typeof v.price === "number" && v.price !== product.price && (
                        <span className="ml-1.5 opacity-80">{formatNaira(v.price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {soldOutHint(variants, selectedVariant)}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} />
            <Button className="h-12 flex-1" disabled={!inStock || cart.pending} onClick={addToCart}>
              <ShoppingCart size={18} /> Add to cart
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" aria-label="Wishlist"><Heart size={18} /></Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[[Truck, "Nationwide delivery"], [ShieldCheck, "Genuine + warranty"]].map(([Icon, label], i) => {
              const I = Icon as typeof Truck;
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                  <I size={18} className="text-accent" /> {label as string}
                </div>
              );
            })}
          </div>

          {specs.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Specifications</h2>
              <dl className="divide-y divide-border rounded-xl border border-border bg-card">
                {specs.map((s, i) => (
                  <div key={i} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{s.name}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {(related.data?.items?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">Related products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.data!.items.filter((r) => r.id !== product.id).slice(0, 4).map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Nudge shown when the chosen variant is running low. */
function soldOutHint(
  variants: NonNullable<import("@/types/models").Product["variants"]>,
  selected: (typeof variants)[number] | null
) {
  if (!selected || typeof selected.stockQuantity !== "number") return null;
  if (selected.stockQuantity <= 0) {
    return <p className="mt-2 text-sm font-medium text-destructive">This option is out of stock.</p>;
  }
  if (selected.stockQuantity <= 5) {
    return <p className="mt-2 text-sm font-medium text-amber-600">Only {selected.stockQuantity} left in this option.</p>;
  }
  return null;
}
