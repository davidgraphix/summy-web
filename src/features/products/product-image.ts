import { cld } from "@/lib/cloudinary";
import type { Product } from "@/types/models";

export function productImage(p: Pick<Product, "primaryImageUrl" | "images">, kind: "card" | "detail" | "thumb" = "card") {
  const raw = p.primaryImageUrl ?? p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? "";
  return cld[kind](raw);
}
