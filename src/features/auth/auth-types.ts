/**
 * Auth DTOs. Mirrors Summy.Application.Features.Authentication.Dtos exactly.
 */

/** Mirrors UserDto. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  status: string;
  emailConfirmed: boolean;
  referralCode: string;
  roles: string[];
}

/** Mirrors AuthenticationResponse. */
export interface AuthenticationResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  user: AuthUser;
}

/** Mirrors RegistrationResponse — register never issues a session; email verification is required first. */
export interface RegistrationResponse {
  userId: string;
  email: string;
  requiresEmailVerification: boolean;
  message: string;
}

/** Mirrors EmailVerificationResult. */
export interface EmailVerificationResult {
  autoLoggedIn: boolean;
  message: string;
  session: AuthenticationResponse | null;
}

/** Mirrors MessageResponse. */
export interface MessageResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
