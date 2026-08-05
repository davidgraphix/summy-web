"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "./auth-api";
import { useAuthStore } from "./auth-store";
import { useMergeGuestCartOnLogin } from "@/features/cart/use-cart";
import type {
  AuthenticationResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest,
  ResetPasswordRequest, VerifyEmailRequest,
} from "./auth-types";

function applySession(session: AuthenticationResponse) {
  useAuthStore.getState().setSession(session);
}

export function useLogin() {
  const mergeCart = useMergeGuestCartOnLogin();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: async (session) => {
      applySession(session);
      await mergeCart();
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Login failed"),
  });
}

export function useRegister() {
  return useMutation({
    // Registration never issues a session — the account must be email-verified first.
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onError: (e: Error) => toast.error(e.message || "Registration failed"),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return Promise.resolve();
      return authApi.logout({ refreshToken }).catch(() => undefined);
    },
    onSettled: () => {
      useAuthStore.getState().clear();
      qc.clear();
    },
  });
}

export function useVerifyEmail() {
  const mergeCart = useMergeGuestCartOnLogin();
  return useMutation({
    mutationFn: (body: VerifyEmailRequest) => authApi.verifyEmail(body),
    onSuccess: async (result) => {
      if (result.autoLoggedIn && result.session) {
        applySession(result.session);
        await mergeCart();
      }
    },
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
