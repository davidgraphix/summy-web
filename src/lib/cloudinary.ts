/**
 * Helpers for Cloudinary-hosted media. Media URLs come fully-formed from the
 * backend; this only applies on-the-fly transforms when we have a raw URL.
 */
export function cldTransform(url: string | null | undefined, transform = "f_auto,q_auto"): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** Sensible default sizes for product imagery. */
export const cld = {
  thumb: (u?: string | null) => cldTransform(u, "f_auto,q_auto,w_200,h_200,c_fill"),
  card: (u?: string | null) => cldTransform(u, "f_auto,q_auto,w_500,h_500,c_fill"),
  detail: (u?: string | null) => cldTransform(u, "f_auto,q_auto,w_1000,c_limit"),
};
