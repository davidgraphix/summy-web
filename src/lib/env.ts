/** Centralised, validated access to public environment variables. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    // An empty apiBaseUrl is only ever safe in the browser, where buildUrl()
    // resolves requests against the current origin — the local-dev proxy
    // workflow (API_PROXY_TARGET in next.config.ts) depends on that. There is
    // no such fallback during SSR, so warn loudly there; buildUrl() itself
    // throws a descriptive error if a request is actually attempted server-
    // side with this unset, rather than letting `new URL()` fail cryptically.
    if (typeof window === "undefined") {
      console.warn(`[env] ${name} is not set. Server-side API requests will fail until it is.`);
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
