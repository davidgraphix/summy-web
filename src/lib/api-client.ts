import { API_ROOT, env } from "./env";
import type { ApiEnvelope, ApiError } from "@/types/api";
import { useAuthStore } from "@/features/auth/auth-store";
import type { AuthenticationResponse } from "@/features/auth/auth-types";

/** Thrown for any non-successful envelope or transport failure. */
export class ApiRequestError extends Error {
  status: number;
  error: ApiError | null;
  correlationId?: string;
  constructor(message: string, status: number, error: ApiError | null, correlationId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.error = error;
    this.correlationId = correlationId;
  }
  /** Field-keyed validation messages if the backend supplied them. */
  get validationErrors() {
    return this.error?.validationErrors ?? null;
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the bearer token and enable refresh-on-401. Default true. */
  auth?: boolean;
  /** Any plain query-param object — values are stringified, arrays repeat the key, null/undefined are dropped. */
  params?: object;
  signal?: AbortSignal;
  /** Send FormData as-is (avatar upload). */
  formData?: FormData;
  /** Extra headers for this call (e.g. X-Cart-Key for the guest cart). */
  headers?: Record<string, string>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const full = `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`;

  // `env.apiBaseUrl` can be intentionally empty in the browser (relative
  // requests through the local-dev rewrite proxy, see next.config.ts) — in
  // that case `full` is a relative path, and `new URL()` needs a base to
  // resolve it against, so pass the current origin. There is no equivalent
  // fallback on the server: a relative path with no base throws a bare,
  // unhelpful "Failed to construct 'URL': Invalid URL", so fail with a
  // message that actually says what's missing.
  const base = typeof window !== "undefined" ? window.location.origin : undefined;
  if (!env.apiBaseUrl && !base) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured — the API has no target host to send requests to."
    );
  }

  const url = new URL(full, base);
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, QueryValue | QueryValue[]>)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) value.forEach((v) => v != null && url.searchParams.append(key, String(v)));
      else url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Outcome of a refresh attempt. The distinction matters: only `rejected` means
 * the session is genuinely finished.
 *
 * - `refreshed`   — new tokens are in the store, replay the original request.
 * - `rejected`    — the server actively refused the refresh token (401/403).
 *                   The session is dead; clear it.
 * - `unavailable` — we could not get an answer: offline, DNS failure, request
 *                   timeout, a 5xx, a 429, or a Render cold-start 502.
 *
 * Treating `unavailable` as `rejected` is what was signing customers out at
 * random. A dropped mobile connection or one cold start on the API host is not
 * evidence that a session has expired, and destroying tokens on that basis
 * makes a recoverable blip permanent — the tokens are gone, so the retry that
 * would have worked can never happen.
 */
type RefreshOutcome = "refreshed" | "rejected" | "unavailable";

// Single-flight refresh so a burst of 401s triggers one refresh call.
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Wall-clock time of the last `unavailable` refresh. A failing refresh endpoint
 * must not be hammered once per 401 while a page full of queries retries, but
 * the block has to be short enough that recovery is invisible to the customer.
 */
let refreshUnavailableUntil = 0;
const REFRESH_BACKOFF_MS = 5_000;

async function refreshTokens(): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;
  if (Date.now() < refreshUnavailableUntil) return "unavailable";

  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;

    // No token at all is a real "not signed in", not a transient failure.
    if (!refreshToken) return "rejected";

    let res: Response;
    try {
      res = await fetch(`${API_ROOT}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Transport never completed — offline, DNS, aborted, CORS. Says nothing
      // about whether the token is still valid, so keep the session.
      return "unavailable";
    }

    // 401/403 are the only answers that mean "this token is finished":
    // expired, revoked, reused (the backend revokes the whole session set on
    // reuse detection), or the account is no longer permitted to sign in.
    if (res.status === 401 || res.status === 403) return "rejected";

    if (!res.ok) return "unavailable";

    const json = (await res.json().catch(() => null)) as ApiEnvelope<AuthenticationResponse> | null;

    // A 2xx that carries no session is a malformed response from an
    // intermediary, not a rejection.
    if (!json?.success || !json.data) return "unavailable";

    store.setSession(json.data);
    return "refreshed";
  })();

  try {
    const outcome = await refreshInFlight;
    if (outcome === "rejected") useAuthStore.getState().clear();
    if (outcome === "unavailable") refreshUnavailableUntil = Date.now() + REFRESH_BACKOFF_MS;
    return outcome;
  } finally {
    refreshInFlight = null;
  }
}

async function execute<T>(path: string, options: RequestOptions, isRetry = false): Promise<T> {
  const { method = "GET", body, auth = true, params, signal, formData } = options;

  const headers: Record<string, string> = { ...options.headers };

  // Only when there is actually a body to describe.
  //
  // This was set on every request including GETs, where it describes nothing —
  // and `Content-Type: application/json` is not a CORS-safelisted value, so it
  // forced a preflight OPTIONS in front of every anonymous read. The storefront's
  // hot path (products, brands, categories, settings) is exactly those reads, so
  // the browsing experience was paying two cross-origin round trips per request
  // instead of one. Authenticated calls still preflight because of the
  // Authorization header; those are now cached by the API's preflight max-age.
  if (!formData && body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const { accessToken, refreshToken } = useAuthStore.getState();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    // Lets the backend identify "this device" on /account/sessions and
    // /account/logout-other-devices (see AccountController.ResolveCurrentRefreshHash).
    // Harmless on every other endpoint, which simply ignores it.
    if (refreshToken) headers["X-Refresh-Token"] = refreshToken;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiRequestError(
      e instanceof Error ? e.message : "Network request failed",
      0,
      { code: "network_error", message: "Unable to reach the server. Check your connection.", validationErrors: [] }
    );
  }

  // 401 → try one refresh, then replay the original request. A refresh that
  // could not be reached leaves the session intact and lets this 401 surface as
  // an ordinary error, so the customer stays signed in and the next request
  // (or React Query's retry) can succeed once the network recovers.
  if (res.status === 401 && auth && !isRetry) {
    if ((await refreshTokens()) === "refreshed") return execute<T>(path, options, true);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!json) {
    throw new ApiRequestError(`Unexpected response (${res.status})`, res.status, null);
  }
  if (!res.ok || !json.success) {
    throw new ApiRequestError(
      json.error?.message ?? `Request failed (${res.status})`,
      res.status,
      json.error,
      json.correlationId
    );
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    execute<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    execute<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    execute<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    execute<T>(path, { ...opts, method: "PATCH", body }),
  /** `body` is rare on DELETE but required by a couple of bulk-delete endpoints. */
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method">) =>
    execute<T>(path, { ...opts, method: "DELETE" }),
  postForm: <T>(path: string, formData: FormData, opts?: Omit<RequestOptions, "method" | "body" | "formData">) =>
    execute<T>(path, { ...opts, method: "POST", formData }),
};

/**
 * Downloads a file from an authenticated endpoint (e.g. invoice/receipt PDFs)
 * and saves it via the browser. Plain `<a href>` tags can't attach the bearer
 * token, so those endpoints 401 unless fetched like this.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), { headers });

  // A failed download still carries the API's normal error envelope, and that
  // message is the only thing that explains *why*. "This order has no invoice
  // until it is paid" is actionable; "Download failed (409)" is not. Parsing it
  // here means every caller reports the real reason instead of inventing a
  // generic one.
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiEnvelope<unknown> | null;

    throw new ApiRequestError(
      json?.error?.message ?? `Download failed (${res.status})`,
      res.status,
      json?.error ?? null,
      json?.correlationId
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Fetches an authenticated file and returns an object URL for it.
 *
 * Used for previewing/printing a PDF the backend generated. A plain
 * `window.open` on the API path cannot work: the endpoint needs a bearer token,
 * and a new tab carries none — so it would 401. Fetching first and handing the
 * browser a blob URL keeps the request authenticated while still letting the
 * native PDF viewer (and its print button) do the work.
 *
 * The caller owns the returned URL and must revoke it.
 */
export async function fetchFileUrl(path: string): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), { headers });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiEnvelope<unknown> | null;

    throw new ApiRequestError(
      json?.error?.message ?? `Could not open the file (${res.status})`,
      res.status,
      json?.error ?? null,
      json?.correlationId
    );
  }

  return URL.createObjectURL(await res.blob());
}
