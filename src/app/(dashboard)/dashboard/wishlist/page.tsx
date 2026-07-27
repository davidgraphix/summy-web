"use client";

import Link from "next/link";
import { Heart, Package, ShoppingCart, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { formatNaira } from "@/lib/format";
import { productImage } from "@/features/products/product-image";
import { useWishlist, useWishlistMutations } from "@/features/wishlist/wishlist-hooks";
import { useCartMutations } from "@/features/cart/cart-hooks";

export default function WishlistPage() {
  const { data: items, isLoading, isError, refetch } = useWishlist();
  const wishlist = useWishlistMutations();
  const cart = useCartMutations();

  if (isLoading) return <LoadingState label="Loading your wishlist…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Wishlist</h1>
        <p className="text-sm text-muted-foreground">
          {items?.length ? `${items.length} saved ${items.length === 1 ? "item" : "items"}` : "Items you save for later"}
        </p>
      </div>

      {!items?.length ? (
        <Card><CardContent className="p-5">
          <EmptyState
            icon={<Heart size={28} />}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here."
            action={<Link href="/" className={buttonVariants()}>Browse products</Link>}
          />
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const p = item.product;
            const img = p ? productImage(p, "thumb") : "";
            return (
              <Card key={item.productId}>
                <CardContent className="flex gap-4 p-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground/40">
                    {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package size={28} />}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    {p?.slug ? (
                      <Link href={`/products/${p.slug}`} className="line-clamp-2 font-medium hover:text-primary">
                        {p.name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 font-medium">{p?.name ?? "Saved product"}</p>
                    )}
                    {typeof p?.price === "number" && (
                      <p className="mt-0.5 font-extrabold">{formatNaira(p.price)}</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      {/* Uses POST /cart/from-wishlist/{productId} */}
                      <Button size="sm" onClick={() => cart.addFromWishlist.mutate(item.productId)}
                        disabled={cart.addFromWishlist.isPending || p?.inStock === false}>
                        <ShoppingCart size={15} />
                        {p?.inStock === false ? "Out of stock" : "Move to cart"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => wishlist.remove.mutate(item.productId)}
                        disabled={wishlist.remove.isPending}>
                        <Trash2 size={15} /> Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
