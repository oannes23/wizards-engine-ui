"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getCharacterFeed } from "@/lib/api/services/feeds";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { FeedFilters } from "@/features/feeds/types";

interface UseCharacterFeedOptions {
  filters?: FeedFilters;
  activeSession?: boolean;
}

/**
 * useCharacterFeed — Infinite query for GET /characters/{id}/feed.
 *
 * Cursor-based pagination. Polls at 15s normally, 5s during active session.
 */
export function useCharacterFeed(
  characterId: string | null | undefined,
  { filters, activeSession = false }: UseCharacterFeedOptions = {}
) {
  const interval = activeSession ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.NORMAL;

  return useInfiniteQuery({
    queryKey: queryKeys.characters.feed(characterId ?? "", filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getCharacterFeed(characterId!, {
        ...filters,
        after: pageParam as string | undefined,
      }),
    enabled: !!characterId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}
