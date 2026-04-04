"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getFeed, getStarredFeed, getSilentFeed } from "@/lib/api/services/feeds";
import { useActiveSession } from "./useActiveSession";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { FeedFilters } from "../types";

/**
 * useFeed — Infinite query for GET /me/feed with polling.
 *
 * - Cursor-based pagination via useInfiniteQuery
 * - Polls at 10s normally, 5s during active session
 * - Pauses when tab is hidden (refetchIntervalInBackground: false default)
 */
export function useFeed(filters?: FeedFilters) {
  const { data: activeSession } = useActiveSession();
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.FAST;

  return useInfiniteQuery({
    queryKey: queryKeys.feed.me(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getFeed({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

/**
 * useStarredFeed — Infinite query for GET /me/feed/starred with polling.
 */
export function useStarredFeed(filters?: FeedFilters) {
  const { data: activeSession } = useActiveSession();
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.FAST;

  return useInfiniteQuery({
    queryKey: queryKeys.feed.starred(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getStarredFeed({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

/**
 * useSilentFeed — Infinite query for GET /me/feed/silent (GM audit log).
 *
 * Polls at 15s normally, 5s during active session.
 */
export function useSilentFeed(filters?: FeedFilters) {
  const { data: activeSession } = useActiveSession();
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.NORMAL;

  return useInfiniteQuery({
    queryKey: queryKeys.feed.silent(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getSilentFeed({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}
