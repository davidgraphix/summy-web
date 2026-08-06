import { cld } from "@/lib/cloudinary";
import type { Product, ProductSummary } from "@/types/models";

type ImageSource =
  | Pick<ProductSummary, "primaryImageUrl" | "thumbnailUrl">
  | Pick<Product, "images">;

export function productImage(p: ImageSource, kind: "card" | "detail" | "thumb" = "card") {
  const raw =
    ("primaryImageUrl" in p ? p.primaryImageUrl ?? p.thumbnailUrl : null) ??
    ("images" in p ? p.images.find((i) => i.isFeatured)?.secureUrl ?? p.images[0]?.secureUrl : null) ??
    "";
  return cld[kind](raw);
}
