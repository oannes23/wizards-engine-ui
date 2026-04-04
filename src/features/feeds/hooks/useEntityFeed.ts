"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getGroupFeed, getLocationFeed } from "@/lib/api/services/feeds";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { FeedFilters } from "../types";

// ── Shared options interface ──────────────────────────────────────────

interface UseEntityFeedOptions {
  filters?: FeedFilters;
  activeSession?: boolean;
}

// ── Group Feed ────────────────────────────────────────────────────────

/**
 * useGroupFeed — Infinite query for GET /groups/{id}/feed.
 *
 * Polls at 15s normally, 5s during active session.
 * Disabled when groupId is falsy.
 */
export function useGroupFeed(
  groupId: string | null | undefined,
  { filters, activeSession = false }: UseEntityFeedOptions = {}
) {
  const interval = activeSession
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.NORMAL;

  return useInfiniteQuery({
    queryKey: queryKeys.groups.feed(groupId ?? "", filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getGroupFeed(groupId!, {
        ...filters,
        after: pageParam as string | undefined,
      }),
    enabled: !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

// ── Location Feed ─────────────────────────────────────────────────────

/**
 * useLocationFeed — Infinite query for GET /locations/{id}/feed.
 *
 * Polls at 15s normally, 5s during active session.
 * Disabled when locationId is falsy.
 */
export function useLocationFeed(
  locationId: string | null | undefined,
  { filters, activeSession = false }: UseEntityFeedOptions = {}
) {
  const interval = activeSession
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.NORMAL;

  return useInfiniteQuery({
    queryKey: queryKeys.locations.feed(locationId ?? "", filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getLocationFeed(locationId!, {
        ...filters,
        after: pageParam as string | undefined,
      }),
    enabled: !!locationId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}
