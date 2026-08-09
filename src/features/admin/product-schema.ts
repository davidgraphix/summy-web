import { z } from "zod";

/**
 * `z.coerce.number()` runs *before* `.optional()` — so an empty input (`""`,
 * from a blank number field) coerces to `0` (a real, valid number) before Zod
 * ever gets a chance to treat it as absent. For an optional money field that
 * silently turns "no discount entered" into "an explicit ₦0 discount", which
 * the backend then (correctly, given that input) treats as a genuine 100%-off
 * sale price. Preprocessing blank/null to `undefined` *before* coercion is
 * what actually distinguishes "not supplied" from "supplied as zero".
 */
const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0, "Can't be negative").optional()
);

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
  // Required, so blank must fail validation rather than silently coerce to a
  // submittable ₦0 — the same underlying trap as the optional fields below,
  // just with a "required" error instead of treating it as absent.
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number({ invalid_type_error: "Price is required", required_error: "Price is required" })
      .min(0, "Price can't be negative")
  ),
  discountPrice: optionalMoney,
  costPrice: optionalMoney,
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
}).refine((v) => v.discountPrice === undefined || v.discountPrice <= v.price, {
  message: "Discount price cannot exceed the list price",
  path: ["discountPrice"],
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Turns the comma-separated tag field into the array the API expects. */
export function parseTags(text?: string): string[] | undefined {
  if (!text?.trim()) return undefined;
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}
