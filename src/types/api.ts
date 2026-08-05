/**
 * Transport-level contracts shared by every endpoint.
 * Shapes come directly from the backend API contract.
 */

/** Every endpoint returns this envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  correlationId: string;
  timestamp: string;
}

/** A single field-level validation failure, as returned by ApiError.ValidationErrors. */
export interface ApiValidationError {
  field: string;
  message: string;
}

/** Error payload. Mirrors Summy.Shared.Wrappers.ApiError. */
export interface ApiError {
  code: string;
  message: string;
  validationErrors: ApiValidationError[];
}

/** All paginated endpoints return this envelope shape (inside `data`). */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageQuery {
  pageNumber?: number;
  pageSize?: number;
}
