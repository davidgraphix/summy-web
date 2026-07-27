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

/**
 * Error payload. Exact field names are not documented in the contract.
 * TODO: confirm the real ApiError DTO (code/message/validationErrors names).
 */
export interface ApiError {
  code?: string;
  message?: string;
  details?: string;
  /** Field-keyed validation messages, e.g. { email: ["Required"] }. TODO confirm. */
  validationErrors?: Record<string, string[]>;
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
