import { z } from "zod";

/**
 * Write model for POST/PUT /products. Mirrors CreateProductRequest /
 * UpdateProductRequest — the two are identical except UpdateProductRequest has
 * no `stockQuantity` (stock is only ever set on create; afterwards it's
 * managed exclusively through the Inventory endpoints, which keep an audit
 * trail). Variants have no create/update DTO at all yet — the API only reads
 * them back — so there's no variants field here.
 */
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  price: z.coerce.number().min(0, "Price can't be negative"),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  /** Create-only — ignored by the form when editing. */
  stockQuantity: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  barcode: z.string().optional(),
  weightGrams: z.coerce.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(70, "Keep under 70 characters for search results").optional(),
  metaDescription: z.string().max(160, "Keep under 160 characters for search results").optional(),
  tagsText: z.string().optional(),
  specifications: z.array(z.object({
    name: z.string().min(1, "Required"),
    value: z.string().min(1, "Required"),
  })).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Turns the comma-separated tag field into the array the API expects. */
export function parseTags(text?: string): string[] | undefined {
  if (!text?.trim()) return undefined;
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}
