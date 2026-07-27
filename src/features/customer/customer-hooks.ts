"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { customerApi, type UpdateProfileRequest } from "./customer-api";

export function useProfile() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.me, queryFn: () => customerApi.me(), enabled: isAuth });
}
export function useDashboard() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.dashboard, queryFn: () => customerApi.dashboard(), enabled: isAuth });
}
export function useActivity() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.activity, queryFn: () => customerApi.activity(), enabled: isAuth });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => customerApi.updateMe(body),
    onSuccess: (p) => { qc.setQueryData(qk.customer.me, p); toast.success("Profile updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => customerApi.uploadPicture(file),
    onSuccess: (p) => { qc.setQueryData(qk.customer.me, p); toast.success("Photo updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
