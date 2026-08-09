import { z } from "zod";

/**
 * Mirrors the backend's password rule exactly — FluentValidation's
 * `Password()`/`StrongPassword()` extensions (Summy.Application, both bodies
 * identical: 8-128 chars, at least one uppercase, one lowercase, one digit,
 * one non-alphanumeric character). Every password field in the app should use
 * this, so the client never accepts something the API is guaranteed to 422.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one digit")
  .regex(/[^a-zA-Z0-9]/, "Include at least one symbol (e.g. ! @ # ?)");
