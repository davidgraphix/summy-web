/** Centralised, validated access to public environment variables. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    // Fail loudly in dev; fall back to a relative base in the browser so a
    // reverse-proxy setup (API_PROXY_TARGET) still works.
    if (typeof window === "undefined") {
      console.warn(`[env] ${name} is not set.`);
    }
    return value ?? "";
  }
  return value;
}

export const env = {
  /** API origin, WITHOUT the /api/v1 suffix (the client appends it). */
  apiBaseUrl: required("NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL),
  cloudinaryCloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
};

/** Full REST root, e.g. https://host/api/v1 */
export const API_ROOT = `${env.apiBaseUrl}/api/v1`;
