import { api } from "@/lib/api-client";
import type {
  AuthenticationResponse, EmailVerificationResult, ForgotPasswordRequest, LoginRequest,
  LogoutRequest, MessageResponse, RefreshRequest, RegisterRequest, RegistrationResponse,
  ResendVerificationRequest, ResetPasswordRequest, VerifyEmailRequest,
} from "./auth-types";

export const authApi = {
  register: (body: RegisterRequest) => api.post<RegistrationResponse>("/auth/register", body, { auth: false }),
  login: (body: LoginRequest) => api.post<AuthenticationResponse>("/auth/login", body, { auth: false }),
  refresh: (body: RefreshRequest) => api.post<AuthenticationResponse>("/auth/refresh", body, { auth: false }),
  logout: (body: LogoutRequest) => api.post<void>("/auth/logout", body),
  verifyEmail: (body: VerifyEmailRequest) => api.post<EmailVerificationResult>("/auth/verify-email", body, { auth: false }),
  resendVerification: (body: ResendVerificationRequest) =>
    api.post<MessageResponse>("/auth/resend-verification", body, { auth: false }),
  forgotPassword: (body: ForgotPasswordRequest) => api.post<MessageResponse>("/auth/forgot-password", body, { auth: false }),
  resetPassword: (body: ResetPasswordRequest) => api.post<MessageResponse>("/auth/reset-password", body, { auth: false }),
};
