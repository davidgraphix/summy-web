import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";

/**
 * Admin writes change what customers see. Product, category, brand and stock
 * mutations all invalidate the public storefront caches so the shop reflects
 * the change without a reload.
 *
 * Note on scope: this synchronises *this* browser tab. Customers on other
 * devices pick changes up on their next fetch (storefront queries use a 60s
 * staleTime), and server-rendered product metadata is revalidated separately —
 * see revalidateProduct() below.
 */
export function invalidateStorefront(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.products.all });
  qc.invalidateQueries({ queryKey: qk.products.featured });
  qc.invalidateQueries({ queryKey: qk.categories.all });
  qc.invalidateQueries({ queryKey: qk.categories.tree });
  qc.invalidateQueries({ queryKey: qk.brands.all });
  qc.invalidateQueries({ queryKey: qk.settings });
}

/** Narrower variant when only one product changed. */
export function invalidateProduct(qc: QueryClient, slug?: string) {
  qc.invalidateQueries({ queryKey: qk.products.all });
  qc.invalidateQueries({ queryKey: qk.products.featured });
  if (slug) qc.invalidateQueries({ queryKey: qk.products.bySlug(slug) });
}

/**
 * Ask the Next server to drop its cached render of a storefront product page.
 * The product detail route generates metadata server-side, so an in-memory
 * query invalidation alone wouldn't refresh SEO tags for other visitors.
 */
export async function revalidateProduct(slug?: string) {
  if (!slug) return;
  try {
    await fetch(`/api/revalidate?slug=${encodeURIComponent(slug)}`, { method: "POST" });
  } catch {
    // Non-fatal: the page still refreshes on its next natural revalidation.
  }
}
