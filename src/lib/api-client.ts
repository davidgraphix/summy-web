import { API_ROOT } from "./env";
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
  const url = new URL(`${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, QueryValue | QueryValue[]>)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) value.forEach((v) => v != null && url.searchParams.append(key, String(v)));
      else url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// Single-flight refresh so a burst of 401s triggers one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_ROOT}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const json = (await res.json().catch(() => null)) as ApiEnvelope<AuthenticationResponse> | null;
      if (!res.ok || !json?.success || !json.data) {
        store.clear();
        return false;
      }
      store.setSession(json.data);
      return true;
    } catch {
      store.clear();
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function execute<T>(path: string, options: RequestOptions, isRetry = false): Promise<T> {
  const { method = "GET", body, auth = true, params, signal, formData } = options;

  const headers: Record<string, string> = { ...options.headers };
  if (!formData) headers["Content-Type"] = "application/json";
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

  // 401 → try one refresh, then replay the original request.
  if (res.status === 401 && auth && !isRetry) {
    const ok = await refreshTokens();
    if (ok) return execute<T>(path, options, true);
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
  if (!res.ok) {
    throw new ApiRequestError(`Download failed (${res.status})`, res.status, null);
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
