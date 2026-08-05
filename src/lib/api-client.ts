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
  params?: Record<string, QueryValue | QueryValue[]>;
  signal?: AbortSignal;
  /** Send FormData as-is (avatar upload). */
  formData?: FormData;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
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

  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
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
      { code: "network_error", message: "Unable to reach the server. Check your connection." }
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
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    execute<T>(path, { ...opts, method: "DELETE" }),
  postForm: <T>(path: string, formData: FormData, opts?: Omit<RequestOptions, "method" | "body" | "formData">) =>
    execute<T>(path, { ...opts, method: "POST", formData }),
};
