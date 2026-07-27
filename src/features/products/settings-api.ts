import { api } from "@/lib/api-client";
import type { StorefrontSettings } from "@/types/models";

export const settingsApi = {
  get: (signal?: AbortSignal) => api.get<StorefrontSettings>("/storefront/settings", { auth: false, signal }),
};
