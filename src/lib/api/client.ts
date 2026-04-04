import { ApiError, parseApiError } from "./errors";
import type { PaginatedResponse } from "./types";

export type { PaginatedResponse };

/**
 * Base API URL from environment, falling back to localhost.
 * The /api/v1/ prefix is hardcoded (not configurable per environment).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = `${API_BASE}/api/v1`;

/**
 * Pagination query parameters.
 */
export interface PaginationParams {
  after?: string;
  limit?: number;
}

/**
 * Build a query string from a params object, omitting undefined/null values.
 */
function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }
  return `?${searchParams.toString()}`;
}

/**
 * Core fetch wrapper. All API requests go through this function.
 *
 * - Prepends the API base URL
 * - Includes credentials for cross-origin cookie auth
 * - Parses JSON responses
 * - Throws ApiError on non-2xx responses
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & {
    params?: Record<string, string | number | boolean | null | undefined>;
  }
): Promise<T> {
  const { params, ...fetchInit } = init ?? {};
  const queryString = buildQueryString(params);
  const url = `${API_PREFIX}${path}${queryString}`;

  const response = await fetch(url, {
    ...fetchInit,
    credentials: "include",
    headers: {
      ...(fetchInit.headers ?? {}),
      ...(fetchInit.body && typeof fetchInit.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError("parse_error", "Failed to parse response", null, response.status);
    }
    return undefined as T;
  }

  if (!response.ok) {
    throw parseApiError(response.status, body);
  }

  return body as T;
}

/**
 * Convenience methods for common HTTP verbs.
 */
export const api = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<T> {
    return apiFetch<T>(path, { method: "GET", params });
  },

  post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<T> {
    return apiFetch<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      params,
    });
  },

  patch<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<T> {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      params,
    });
  },

  del<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<T> {
    return apiFetch<T>(path, { method: "DELETE", params });
  },
};

/**
 * Paginated fetch helper for cursor-based pagination endpoints.
 */
export async function apiFetchPaginated<T>(
  path: string,
  params?: PaginationParams & Record<string, string | number | boolean | null | undefined>
): Promise<PaginatedResponse<T>> {
  const { after, limit = 50, ...rest } = params ?? {};
  return apiFetch<PaginatedResponse<T>>(path, {
    params: { after, limit, ...rest },
  });
}
