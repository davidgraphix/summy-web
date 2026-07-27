import { api } from "@/lib/api-client";
import type {
  AuthResult, AuthUser, LoginRequest, RegisterRequest, RefreshRequest,
  VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest,
} from "./auth-types";

export const authApi = {
  register: (body: RegisterRequest) => api.post<AuthResult>("/auth/register", body, { auth: false }),
  login: (body: LoginRequest) => api.post<AuthResult>("/auth/login", body, { auth: false }),
  refresh: (body: RefreshRequest) => api.post<AuthResult>("/auth/refresh", body, { auth: false }),
  logout: () => api.post<void>("/auth/logout"),
  verifyEmail: (body: VerifyEmailRequest) => api.post<void>("/auth/verify-email", body, { auth: false }),
  resendVerification: (body: ResendVerificationRequest) =>
    api.post<void>("/auth/resend-verification", body, { auth: false }),
  forgotPassword: (body: ForgotPasswordRequest) => api.post<void>("/auth/forgot-password", body, { auth: false }),
  resetPassword: (body: ResetPasswordRequest) => api.post<void>("/auth/reset-password", body, { auth: false }),
  // Convenience: many apps also fetch the profile right after login.
  me: () => api.get<AuthUser>("/customers/me"),
};
