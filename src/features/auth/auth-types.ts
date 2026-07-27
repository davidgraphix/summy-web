/**
 * Auth DTOs. The contract confirms JWT access + refresh tokens but not the
 * exact field names on the token/user payloads. Known/likely fields are typed;
 * unconfirmed ones are marked TODO.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  // TODO: confirm — expiresIn / accessTokenExpiresAt / tokenType may be present.
  expiresIn?: number;
  accessTokenExpiresAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  // TODO: confirm user fields returned on login (firstName/lastName/emailVerified/roles).
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailVerified?: boolean;
}

/** Some backends return tokens + user together on login/register. TODO confirm. */
export interface AuthResult extends AuthTokens {
  user?: AuthUser;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // TODO: confirm — phoneNumber / referralCode may be accepted.
  phoneNumber?: string;
  referralCode?: string;
}
export interface RefreshRequest { refreshToken: string; }
export interface VerifyEmailRequest { token: string; email?: string; }
export interface ResendVerificationRequest { email: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; email?: string; newPassword: string; }
