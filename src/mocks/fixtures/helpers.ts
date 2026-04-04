import type { PaginatedResponse } from "@/lib/api/types";

/**
 * Create a paginated response wrapper for test fixtures.
 */
export function paginatedList<T>(
  items: T[],
  hasMore = false
): PaginatedResponse<T> {
  return {
    items,
    next_cursor: hasMore ? "01NEXTCURSOR000000000000" : null,
    has_more: hasMore,
  };
}
