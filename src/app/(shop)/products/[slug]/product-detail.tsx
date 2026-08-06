"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Heart, Package, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { ProductCard } from "@/features/products/components/product-card";
import { useProduct, useProducts } from "@/features/products/products-hooks";
import { useCart } from "@/features/cart/use-cart";
import { useWishlistMutations } from "@/features/wishlist/wishlist-hooks";
import { useAuthStore } from "@/features/auth/auth-store";
import { cld } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import type { ProductVariant } from "@/types/models";

export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const cart = useCart();
  const wishlist = useWishlistMutations();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const related = useProducts(
    product ? { categoryId: product.category?.id, pageSize: 4 } : { pageSize: 0 }
  );

  if (isLoading) return <LoadingState label="Loading product…" />;
  if (isError || !product) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorState onRetry={() => refetch()} /></div>;

  // Variants are configured in the admin dashboard; when present the customer
  // picks one and its price/stock override the base product values.
  const variants = product.variants;
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const effectivePriceFormatted = selectedVariant?.price?.formatted ?? product.effectivePrice.formatted;
  const variantStock = selectedVariant?.availableQuantity;

  const gallery = product.images.length ? product.images : [];
  const heroUrl = gallery[activeImg] ? cld.detail(gallery[activeImg]!.secureUrl) : "";
  const inStock = selectedVariant ? (variantStock ?? 0) > 0 : product.isPurchasable;
  const brand = product.brand?.name;

  const addToCart = () => cart.add({ productId: product.id, quantity: qty });

  const onWish = () => {
    if (!isAuth) { window.location.href = "/login?redirect=/"; return; }
    wishlist.add.mutate(product.id);
  };

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
            {product.discountPercentage > 0 && (
              <Badge variant="destructive" className="absolute left-4 top-4">-{product.discountPercentage}%</Badge>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((g, i) => (
                <button key={g.id} onClick={() => setActiveImg(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${i === activeImg ? "border-primary" : "border-border"}`}>
                  <img src={cld.thumb(g.secureUrl)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {brand && <span className="text-xs font-semibold uppercase tracking-wide text-primary">{brand}</span>}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{effectivePriceFormatted}</span>
            {product.isOnSale && <span className="text-muted-foreground line-through">{product.price.formatted}</span>}
          </div>
          <p className={`mt-1 text-sm font-medium ${inStock ? "text-success" : "text-destructive"}`}>
            {inStock ? "✓ In stock — ready to ship" : "Out of stock"}
          </p>

          {product.fullDescription && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.fullDescription}</p>}

          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = variantId === v.id;
                  const soldOut = v.availableQuantity <= 0;
                  return (
                    <button key={v.id} type="button" disabled={soldOut}
                      onClick={() => setVariantId(active ? null : v.id)}
                      aria-pressed={active}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}>
                      {v.name}
                      {v.price && <span className="ml-1.5 opacity-80">{v.price.formatted}</span>}
                    </button>
                  );
                })}
              </div>
              {soldOutHint(selectedVariant)}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} />
            <Button className="h-12 flex-1" disabled={!inStock || cart.pending} onClick={addToCart}>
              <ShoppingCart size={18} /> Add to cart
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" aria-label="Wishlist"
              onClick={onWish} disabled={wishlist.add.isPending}>
              <Heart size={18} />
            </Button>
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

          {product.specifications.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Specifications</h2>
              <dl className="divide-y divide-border rounded-xl border border-border bg-card">
                {product.specifications.map((s, i) => (
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
function soldOutHint(selected: ProductVariant | null) {
  if (!selected) return null;
  if (selected.availableQuantity <= 0) {
    return <p className="mt-2 text-sm font-medium text-destructive">This option is out of stock.</p>;
  }
  if (selected.availableQuantity <= 5) {
    return <p className="mt-2 text-sm font-medium text-amber-600">Only {selected.availableQuantity} left in this option.</p>;
  }
  return null;
}
