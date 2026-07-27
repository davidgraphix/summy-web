import { api } from "@/lib/api-client";
import type { Brand } from "@/types/models";

export const brandsApi = {
  list: (signal?: AbortSignal) => api.get<Brand[]>("/brands", { auth: false, signal }),
};
