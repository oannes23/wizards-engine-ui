"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { listLocations, getLocation, type LocationListFilters } from "@/lib/api/services/locations";
import { getLocationFeed } from "@/lib/api/services/feeds";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { FeedFilters } from "@/features/feeds/types";

/**
 * useLocations — Infinite query for GET /locations (paginated list).
 * 60s staleTime per locations.md spec.
 */
export function useLocations(filters?: LocationListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.locations.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      listLocations({ ...filters, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 60_000,
  });
}

/**
 * useLocation — Query for GET /locations/{id} (location detail).
 * 60s staleTime per locations.md spec.
 */
export function useLocation(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.detail(id ?? ""),
    queryFn: () => getLocation(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * useLocationFeed — Infinite query for GET /locations/{id}/feed.
 * Polls per feed conventions.
 */
export function useLocationFeed(
  locationId: string | null | undefined,
  { filters, activeSession = false }: { filters?: FeedFilters; activeSession?: boolean } = {}
) {
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.SLOW;

  return useInfiniteQuery({
    queryKey: queryKeys.locations.feed(locationId ?? "", filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getLocationFeed(locationId!, { ...filters, after: pageParam as string | undefined }),
    enabled: !!locationId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}
