"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getFeed } from "@/lib/api/services/feeds";
import { POLLING_INTERVALS } from "@/lib/constants";
import { FeedList } from "./FeedList";
import type { FeedFilters } from "../types";

// ── Hook ──────────────────────────────────────────────────────────────

interface UseSessionTimelineFeedOptions {
  filters?: Omit<FeedFilters, "session_id">;
  activeSession?: boolean;
}

/**
 * useSessionTimelineFeed — Infinite query for the feed filtered to a session.
 *
 * Passes session_id as a filter to GET /me/feed so only events from
 * that session are returned. Polls at 15s normally, 5s during active session.
 */
function useSessionTimelineFeed(
  sessionId: string,
  { filters, activeSession = false }: UseSessionTimelineFeedOptions = {}
) {
  const interval = activeSession
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.NORMAL;

  const mergedFilters: FeedFilters = { ...filters, session_id: sessionId };

  return useInfiniteQuery({
    queryKey: queryKeys.sessions.timeline(sessionId, mergedFilters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      getFeed({ ...mergedFilters, after: pageParam as string | undefined }),
    enabled: !!sessionId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

// ── Component ─────────────────────────────────────────────────────────

interface SessionTimelineFeedProps {
  /** The session ID whose events to display. */
  sessionId: string;
  /** Whether this session is currently active (tightens polling to 5s). */
  isActiveSession?: boolean;
  /** Optional additional feed filters (session_id is always overridden). */
  filters?: Omit<FeedFilters, "session_id">;
}

/**
 * SessionTimelineFeed — Chronological event feed for a specific session.
 *
 * Reuses FeedList and the standard FeedItem/EventCard renderers.
 * Consumes the main feed endpoint filtered by session_id.
 *
 * Intended for consumption by the session detail page.
 */
export function SessionTimelineFeed({
  sessionId,
  isActiveSession = false,
  filters,
}: SessionTimelineFeedProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError } =
    useSessionTimelineFeed(sessionId, { filters, activeSession: isActiveSession });

  return (
    <section aria-label="Session timeline">
      <FeedList
        data={data}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isError={isError}
      />
    </section>
  );
}
