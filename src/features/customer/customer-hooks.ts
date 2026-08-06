"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { customerApi, type UpdatePreferencesRequest, type UpdateProfileRequest } from "./customer-api";
import type { NotificationPreferences } from "@/types/models";

export function useProfile() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.me, queryFn: () => customerApi.me(), enabled: isAuth });
}
export function useDashboard() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.customer.dashboard, queryFn: () => customerApi.dashboard(), enabled: isAuth });
}
export function useActivity(pageNumber = 1) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: qk.customer.activity,
    queryFn: () => customerApi.activity(pageNumber),
    enabled: isAuth,
  });
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
export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => customerApi.deletePicture(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.customer.me }); toast.success("Photo removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (body: UpdatePreferencesRequest) => customerApi.updatePreferences(body),
    onSuccess: () => toast.success("Preferences saved"),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationPreferences) => customerApi.updateNotificationPreferences(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.customer.me }); toast.success("Notification preferences saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
