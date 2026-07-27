import { z } from "zod";

/**
 * Write model for POST/PUT /products. Optional fields stay optional so the
 * form never sends keys the backend doesn't expect.
 */
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price can't be negative"),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(70, "Keep under 70 characters for search results").optional(),
  metaDescription: z.string().max(160, "Keep under 160 characters for search results").optional(),
  tagsText: z.string().optional(),
  specifications: z.array(z.object({
    name: z.string().min(1, "Required"),
    value: z.string().min(1, "Required"),
  })).optional(),
  variants: z.array(z.object({
    name: z.string().min(1, "Required"),
    sku: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    stockQuantity: z.coerce.number().int().min(0).optional(),
  })).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Turns the comma-separated tag field into the array the API expects. */
export function parseTags(text?: string): string[] | undefined {
  if (!text?.trim()) return undefined;
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}
