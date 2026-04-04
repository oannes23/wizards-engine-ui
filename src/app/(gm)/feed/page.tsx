"use client";

import { useState, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Newspaper, EyeOff, Filter } from "lucide-react";
import { FeedList } from "@/features/feeds/components/FeedList";
import {
  GmFeedFilterPanel,
  hasActiveFilters,
  type GmFeedFilterState,
} from "@/features/feeds/components/GmFeedFilterPanel";
import { useFeed, useSilentFeed } from "@/features/feeds/hooks/useFeed";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { POLLING_INTERVALS } from "@/lib/constants";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getFeed } from "@/lib/api/services/feeds";
import type { FeedFilters } from "@/features/feeds/types";

// ── Tab type ──────────────────────────────────────────────────────────

type GmFeedTab = "all" | "silent" | "filter";

// ── Filter helpers ────────────────────────────────────────────────────

function filtersToFeedFilters(state: GmFeedFilterState): FeedFilters {
  const out: FeedFilters = {};
  if (state.type) out.type = state.type;
  if (state.target_type) out.target_type = state.target_type;
  if (state.actor_type) out.actor_type = state.actor_type;
  if (state.session_id) out.session_id = state.session_id;
  if (state.since) out.since = state.since;
  if (state.until) out.until = state.until;
  return out;
}

// ── Filtered feed hook ────────────────────────────────────────────────

function useFilteredFeed(filters: FeedFilters) {
  const { data: activeSession } = useActiveSession();
  const interval = activeSession
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.NORMAL;

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

// ── Page ──────────────────────────────────────────────────────────────

/**
 * GmFeedPage — GM event feed at /gm/feed.
 *
 * Three tabs:
 *  - All     — GET /me/feed (all events, GM-level visibility)
 *  - Silent  — GET /me/feed/silent (audit log, silent events only)
 *  - Filter  — Advanced filter panel + filtered GET /me/feed
 *
 * Polling: 15s normal, 5s during active session.
 */
export default function GmFeedPage() {
  const [activeTab, setActiveTab] = useState<GmFeedTab>("all");
  const [filterState, setFilterState] = useState<GmFeedFilterState>({});

  const allFeed = useFeed();
  const silentFeed = useSilentFeed();
  const filteredFeed = useFilteredFeed(filtersToFeedFilters(filterState));

  const handleResetFilters = useCallback(() => {
    setFilterState({});
  }, []);

  const activeFilters = hasActiveFilters(filterState);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-text-primary">Event Feed</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            All game events — GM visibility level
          </p>
        </div>

        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as GmFeedTab)}
        >
          {/* Tab bar */}
          <Tabs.List
            className="flex gap-1 mb-4 border-b border-border-default"
            aria-label="Feed tabs"
          >
            <Tabs.Trigger
              value="all"
              className="
                flex items-center gap-1.5 px-3 py-2
                text-sm font-medium text-text-secondary
                border-b-2 border-transparent -mb-px
                hover:text-text-primary transition-colors
                data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
              "
            >
              <Newspaper className="h-4 w-4" aria-hidden="true" />
              All
            </Tabs.Trigger>

            <Tabs.Trigger
              value="silent"
              className="
                flex items-center gap-1.5 px-3 py-2
                text-sm font-medium text-text-secondary
                border-b-2 border-transparent -mb-px
                hover:text-text-primary transition-colors
                data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
              "
            >
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              Silent
            </Tabs.Trigger>

            <Tabs.Trigger
              value="filter"
              className="
                flex items-center gap-1.5 px-3 py-2
                text-sm font-medium text-text-secondary
                border-b-2 border-transparent -mb-px
                hover:text-text-primary transition-colors
                data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
              "
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filter
              {activeFilters && (
                <span className="inline-flex items-center rounded-full bg-brand-teal/20 px-1.5 py-0.5 text-xs font-medium text-brand-teal">
                  On
                </span>
              )}
            </Tabs.Trigger>
          </Tabs.List>

          {/* All tab */}
          <Tabs.Content value="all" className="focus:outline-none">
            <FeedList
              data={allFeed.data}
              isLoading={allFeed.isLoading}
              isFetchingNextPage={allFeed.isFetchingNextPage}
              hasNextPage={allFeed.hasNextPage}
              fetchNextPage={allFeed.fetchNextPage}
              isError={allFeed.isError}
            />
          </Tabs.Content>

          {/* Silent tab — audit log */}
          <Tabs.Content value="silent" className="focus:outline-none">
            <div className="mb-3 flex items-center gap-2 rounded-md bg-bg-elevated px-3 py-2">
              <EyeOff className="h-4 w-4 text-text-secondary shrink-0" aria-hidden="true" />
              <p className="text-xs text-text-secondary">
                Silent events are not visible to players. This is the GM audit log.
              </p>
            </div>
            <FeedList
              data={silentFeed.data}
              isLoading={silentFeed.isLoading}
              isFetchingNextPage={silentFeed.isFetchingNextPage}
              hasNextPage={silentFeed.hasNextPage}
              fetchNextPage={silentFeed.fetchNextPage}
              isError={silentFeed.isError}
            />
          </Tabs.Content>

          {/* Filter tab */}
          <Tabs.Content value="filter" className="focus:outline-none">
            <GmFeedFilterPanel
              filters={filterState}
              onChange={setFilterState}
              onReset={handleResetFilters}
            />
            <FeedList
              data={filteredFeed.data}
              isLoading={filteredFeed.isLoading}
              isFetchingNextPage={filteredFeed.isFetchingNextPage}
              hasNextPage={filteredFeed.hasNextPage}
              fetchNextPage={filteredFeed.fetchNextPage}
              isError={filteredFeed.isError}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
