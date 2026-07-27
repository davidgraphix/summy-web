"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/shared/rating";
import { formatNaira, discountPercent } from "@/lib/format";
import { productImage } from "@/features/products/product-image";
import { useCart } from "@/features/cart/use-cart";
import { useAuthStore } from "@/features/auth/auth-store";
import { useWishlistMutations } from "@/features/wishlist/wishlist-hooks";
import type { Product } from "@/types/models";

export function ProductCard({ product, wished }: { product: Product; wished?: boolean }) {
  const cart = useCart();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const wishlist = useWishlistMutations();
  const img = productImage(product, "card");
  const off = discountPercent(product.price, product.compareAtPrice);
  const brand = product.brand?.name ?? product.brandName;
  const inStock = product.inStock ?? true;

  const onWish = () => {
    if (!isAuth) { window.location.href = "/login?redirect=/"; return; }
    if (wished) wishlist.remove.mutate(product.id);
    else wishlist.add.mutate(product.id);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_12px_30px_-12px_rgba(46,28,196,0.28)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
        {img ? (
          <Image src={img} alt={product.name} fill sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-muted-foreground/40"><Package size={54} strokeWidth={1.2} /></span>
        )}
        {off > 0 && <Badge variant="destructive" className="absolute left-2 top-2">-{off}%</Badge>}
        {product.isFeatured && off === 0 && <Badge className="absolute left-2 top-2 bg-foreground">Featured</Badge>}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between">
          {brand && <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{brand}</span>}
          <button onClick={onWish} aria-label="Wishlist" className="ml-auto grid h-6 w-6 place-items-center">
            <Heart size={16} className={wished ? "fill-destructive stroke-destructive" : "stroke-muted-foreground"} />
          </button>
        </div>

        <Link href={`/products/${product.slug}`} className="line-clamp-2 min-h-[38px] text-sm font-medium leading-snug">
          {product.name}
        </Link>

        <Rating value={product.rating ?? 0} count={product.reviewCount} />

        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="font-extrabold">{formatNaira(product.price)}</span>
          {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatNaira(product.compareAtPrice!)}</span>}
        </div>

        <span className={`text-xs font-medium ${inStock ? "text-success" : "text-destructive"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </span>

        <Button size="sm" className="mt-2 h-9 w-full" disabled={!inStock || cart.pending}
          onClick={() => cart.add({
            productId: product.id, name: product.name, slug: product.slug,
            unitPrice: product.price, quantity: 1, lineTotal: product.price, imageUrl: img,
          })}>
          <ShoppingCart size={15} /> Add to cart
        </Button>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-9 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
