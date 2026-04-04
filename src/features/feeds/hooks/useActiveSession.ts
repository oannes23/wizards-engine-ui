"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { PaginatedResponse, SessionResponse } from "@/lib/api/types";

/**
 * useActiveSession — Returns the currently active session, if any.
 *
 * Uses a 60s stale time as specified in spec/architecture/data-fetching.md.
 * All polling hooks consume this to determine their interval (5s when active).
 *
 * Pattern from spec:
 *   GET /sessions?status=active&limit=1
 *   Returns the first (and only valid) active session or null.
 */
export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: () =>
      api.get<PaginatedResponse<SessionResponse>>("/sessions", {
        status: "active",
        limit: 1,
      }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    select: (data) => data.items[0] ?? null,
  });
}
