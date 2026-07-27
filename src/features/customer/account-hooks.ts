"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { accountApi, type ChangePasswordRequest } from "./account-api";

export function useSessions() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.account.sessions, queryFn: () => accountApi.sessions(), enabled: isAuth });
}
export function useLoginHistory() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.account.loginHistory, queryFn: () => accountApi.loginHistory(), enabled: isAuth });
}
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => accountApi.changePassword(body),
    onSuccess: () => toast.success("Password changed"),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useSessionMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.account.sessions });
  return {
    revoke: useMutation({ mutationFn: (id: string) => accountApi.revokeSession(id),
      onSuccess: () => { invalidate(); toast.success("Session revoked"); }, onError: (e: Error) => toast.error(e.message) }),
    logoutOthers: useMutation({ mutationFn: () => accountApi.logoutOthers(),
      onSuccess: () => { invalidate(); toast.success("Signed out other devices"); }, onError: (e: Error) => toast.error(e.message) }),
  };
}
