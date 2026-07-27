import { api } from "@/lib/api-client";
import type { Category, CategoryNode } from "@/types/models";

export const categoriesApi = {
  list: (signal?: AbortSignal) => api.get<Category[]>("/categories", { auth: false, signal }),
  tree: (signal?: AbortSignal) => api.get<CategoryNode[]>("/categories/tree", { auth: false, signal }),
};
