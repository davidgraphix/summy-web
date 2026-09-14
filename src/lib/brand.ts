/**
 * The one place the business is named.
 *
 * <p>
 * Created during the Summy Solutions → Mega Dealers migration. Before this,
 * the brand name was written out by hand in roughly a dozen places — page
 * metadata, the auth layout, the footer fallback, admin placeholders, the
 * product SEO preview — which is precisely why a rename touched so many files
 * and why any one of them could be missed. Renaming the business again is now a
 * change to this file.
 * </p>
 *
 * <p>
 * Note that the <em>authoritative</em> company name for customer documents is
 * not here: invoices and receipts read <code>SystemSettings.CompanyName</code>
 * from the database via Admin → Settings, so the business can correct it without
 * a deploy. The values below are the display brand and the fallbacks used when
 * that setting has not been filled in.
 * </p>
 */

/** Customer-facing brand. Short form, used almost everywhere. */
export const BRAND_NAME = "Mega Dealers";

/** Registered company name. Used where a legal entity must be named. */
export const LEGAL_NAME = "Mega Dealers Global Limited";

/** One-line positioning statement used in meta descriptions. */
export const BRAND_TAGLINE = "Shop electronics & appliances in Nigeria";

/**
 * Public site origin, e.g. `https://example.com`, without a trailing slash.
 *
 * <p>
 * Deliberately empty by default rather than carrying a guessed domain: the new
 * domain has not been purchased yet, and a hardcoded wrong one would silently
 * produce broken canonical URLs and SEO previews. Set
 * <code>NEXT_PUBLIC_SITE_URL</code> once the domain exists. Callers must handle
 * the empty case.
 * </p>
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/**
 * Host shown in the admin product form's SEO preview.
 *
 * <p>
 * Falls back to a neutral placeholder rather than the old domain, so the preview
 * never advertises a hostname the business no longer owns.
 * </p>
 */
export const SITE_HOST = SITE_URL ? SITE_URL.replace(/^https?:\/\//, "") : "your-domain.com";
