"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { addressesApi } from "./addresses-api";
import type { CreateAddressRequest, UpdateAddressRequest } from "@/types/models";

export function useAddresses() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.addresses, queryFn: () => addressesApi.list(), enabled: isAuth });
}
export function useAddressMutations() {
  const qc = useQueryClient();
  const done = (msg: string) => { qc.invalidateQueries({ queryKey: qk.customer.addresses }); toast.success(msg); };
  return {
    create: useMutation({ mutationFn: (b: CreateAddressRequest) => addressesApi.create(b),
      onSuccess: () => done("Address added"), onError: (e: Error) => toast.error(e.message) }),
    update: useMutation({ mutationFn: (p: { id: string; body: UpdateAddressRequest }) => addressesApi.update(p.id, p.body),
      onSuccess: () => done("Address updated"), onError: (e: Error) => toast.error(e.message) }),
    remove: useMutation({ mutationFn: (id: string) => addressesApi.remove(id),
      onSuccess: () => done("Address removed"), onError: (e: Error) => toast.error(e.message) }),
    setDefault: useMutation({ mutationFn: (id: string) => addressesApi.setDefault(id),
      onSuccess: () => done("Default address set"), onError: (e: Error) => toast.error(e.message) }),
  };
}
