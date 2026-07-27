import { api } from "@/lib/api-client";
import type { Address, AddressInput } from "@/types/models";

export const addressesApi = {
  list: () => api.get<Address[]>("/customers/me/addresses"),
  create: (body: AddressInput) => api.post<Address>("/customers/me/addresses", body),
  update: (id: string, body: AddressInput) => api.put<Address>(`/customers/me/addresses/${id}`, body),
  remove: (id: string) => api.delete<void>(`/customers/me/addresses/${id}`),
  setDefault: (id: string) => api.patch<Address>(`/customers/me/addresses/${id}/default`),
};
