"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "./auth-api";
import { useAuthStore } from "./auth-store";
import { useMergeGuestCartOnLogin } from "@/features/cart/use-cart";
import type {
  AuthResult, ForgotPasswordRequest, LoginRequest, RegisterRequest,
  ResetPasswordRequest, VerifyEmailRequest,
} from "./auth-types";

function applySession(result: AuthResult) {
  useAuthStore.getState().setSession(
    { accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn },
    result.user ?? null
  );
}

export function useLogin() {
  const mergeCart = useMergeGuestCartOnLogin();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: async (result) => {
      applySession(result);
      await mergeCart();
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Login failed"),
  });
}

export function useRegister() {
  const mergeCart = useMergeGuestCartOnLogin();
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: async (result) => {
      // If the backend returns tokens on register, start the session; otherwise
      // the UI routes the user to email verification.
      if (result?.accessToken) {
        applySession(result);
        await mergeCart();
      }
    },
    onError: (e: Error) => toast.error(e.message || "Registration failed"),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: () => {
      useAuthStore.getState().clear();
      qc.clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (body: VerifyEmailRequest) => authApi.verifyEmail(body),
    onError: (e: Error) => toast.error(e.message || "Verification failed"),
  });
}
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
    onSuccess: () => toast.success("Verification email sent"),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) => authApi.forgotPassword(body),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useResetPassword() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => authApi.resetPassword(body),
    onError: (e: Error) => toast.error(e.message),
  });
}
