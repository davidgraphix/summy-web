import { api } from "@/lib/api-client";
import { asArray } from "@/lib/utils";
import type { Category, CategoryNode } from "@/types/models";

export const categoriesApi = {
  list: async (signal?: AbortSignal) =>
    asArray<Category>(await api.get<Category[]>("/categories", { auth: false, signal })),
  tree: async (signal?: AbortSignal) =>
    asArray<CategoryNode>(await api.get<CategoryNode[]>("/categories/tree", { auth: false, signal })),
};