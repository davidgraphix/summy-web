import { api } from "@/lib/api-client";
import type { Address, CreateAddressRequest, UpdateAddressRequest } from "@/types/models";

export const addressesApi = {
  list: (activeOnly = false) => api.get<Address[]>("/customers/me/addresses", { params: { activeOnly } }),
  byId: (id: string) => api.get<Address>(`/customers/me/addresses/${id}`),
  create: (body: CreateAddressRequest) => api.post<Address>("/customers/me/addresses", body),
  update: (id: string, body: UpdateAddressRequest) => api.put<Address>(`/customers/me/addresses/${id}`, body),
  remove: (id: string) => api.delete<void>(`/customers/me/addresses/${id}`),
  setDefault: (id: string) => api.patch<void>(`/customers/me/addresses/${id}/default`),
};
