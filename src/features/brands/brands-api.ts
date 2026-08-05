import { api } from "@/lib/api-client";
import { asArray } from "@/lib/utils";
import type { Brand } from "@/types/models";

export const brandsApi = {
  list: async (signal?: AbortSignal) =>
    asArray<Brand>(await api.get<Brand[]>("/brands", { auth: false, signal })),
};