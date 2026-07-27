import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry auth/validation/not-found; retry transient errors twice.
          if (error instanceof ApiRequestError) {
            if ([400, 401, 403, 404, 422].includes(error.status)) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}
