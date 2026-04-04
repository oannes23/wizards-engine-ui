"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { listGroups, getGroup, type GroupListFilters } from "@/lib/api/services/groups";
import { getGroupFeed } from "@/lib/api/services/feeds";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { FeedFilters } from "@/features/feeds/types";

/**
 * useGroups — Infinite query for GET /groups (paginated list).
 * 60s staleTime per groups.md spec.
 */
export function useGroups(filters?: GroupListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.groups.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      listGroups({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 60_000,
  });
}

/**
 * useGroup — Query for GET /groups/{id} (group detail).
 * 60s staleTime per groups.md spec.
 */
export function useGroup(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id ?? ""),
    queryFn: () => getGroup(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * useGroupFeed — Infinite query for GET /groups/{id}/feed.
 * Polls per feed conventions.
 */
export function useGroupFeed(
  groupId: string | null | undefined,
  { filters, activeSession = false }: { filters?: FeedFilters; activeSession?: boolean } = {}
) {
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.SLOW;

  return useInfiniteQuery({
    queryKey: queryKeys.groups.feed(groupId ?? "", filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getGroupFeed(groupId!, { ...filters, after: pageParam as string | undefined }),
    enabled: !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}
