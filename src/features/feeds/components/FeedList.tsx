"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, Newspaper, ArrowUp } from "lucide-react";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedItem } from "./FeedItem";
import type {
  FeedItemResponse,
  FeedEventItem,
} from "../types";
import type { InfiniteData } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/lib/api/types";

// ── Types ──────────────────────────────────────────────────────────

interface FeedListProps {
  /**
   * TanStack infinite query result for the feed.
   * Accepts the result from useFeed() or useStarredFeed().
   */
  data: InfiniteData<PaginatedResponse<FeedItemResponse>> | undefined;
  /** Whether the initial load is in progress. */
  isLoading: boolean;
  /** Whether a "load more" fetch is in progress. */
  isFetchingNextPage: boolean;
  /** Whether there are more pages to load. */
  hasNextPage: boolean;
  /** Callback to fetch the next page. */
  fetchNextPage: () => void;
  /** Whether the query encountered an error. */
  isError?: boolean;
}

// ── Feed Skeleton ──────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading feed">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border-default bg-bg-surface px-4 py-3 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-24 rounded-full bg-bg-elevated" />
            <div className="h-4 w-16 rounded bg-bg-elevated ml-auto" />
          </div>
          <div className="h-4 w-3/4 rounded bg-bg-elevated mb-1" />
          <div className="h-4 w-1/2 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}

// ── New Items Banner ───────────────────────────────────────────────

interface NewItemsBannerProps {
  count: number;
  onPrepend: () => void;
}

function NewItemsBanner({ count, onPrepend }: NewItemsBannerProps) {
  return (
    <button
      onClick={onPrepend}
      className="
        w-full flex items-center justify-center gap-2
        rounded-md bg-brand-teal/10 border border-brand-teal/30
        text-brand-teal text-sm font-medium
        py-2 px-4 hover:bg-brand-teal/20 transition-colors
      "
      aria-live="polite"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      {count} new item{count === 1 ? "" : "s"} — tap to show
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────

/**
 * FeedList — Paginated, polling-aware chronological feed renderer.
 *
 * Features:
 * - Renders FeedItem for each item in the infinite query data
 * - Groups rider events under their parent events
 * - "Load more" button at the bottom for cursor pagination
 * - Loading skeleton on initial load
 * - EmptyState when no items
 * - "New items" banner when polling detects new items (prepend on click)
 */
export function FeedList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  isError = false,
}: FeedListProps) {
  // Track the IDs we have seen to detect new items arriving via polling
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [newItemIds, setNewItemIds] = useState<FeedItemResponse[]>([]);
  const [prependedItems, setPrependedItems] = useState<FeedItemResponse[]>([]);
  const isFirstLoad = useRef(true);

  // Flatten all pages into a single items array
  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // Detect new items from polling (not initial load)
  useEffect(() => {
    if (!data) return;

    const currentIds = new Set(allItems.map((item) => item.id));

    if (isFirstLoad.current) {
      // First load — seed the seen set, no banner
      seenIdsRef.current = currentIds;
      isFirstLoad.current = false;
      return;
    }

    // Find IDs not in seen set — these arrived via polling
    const unseen: FeedItemResponse[] = allItems.filter(
      (item) => !seenIdsRef.current.has(item.id)
    );

    if (unseen.length > 0) {
      setNewItemIds((prev) => {
        // Merge, deduplicate by id
        const existing = new Set(prev.map((i) => i.id));
        const merged = [...prev, ...unseen.filter((i) => !existing.has(i.id))];
        return merged;
      });
    }

    // Update seen IDs
    seenIdsRef.current = currentIds;
  }, [allItems, data]);

  // Items to display: prepended new items + previously loaded items
  const displayItems = useMemo(() => {
    const prependedIds = new Set(prependedItems.map((i) => i.id));
    const rest = allItems.filter((item) => !prependedIds.has(item.id));
    return [...prependedItems, ...rest];
  }, [prependedItems, allItems]);

  // Build a map of event_id → rider items for grouping
  const riderMap = useMemo(() => {
    const map = new Map<string, FeedEventItem[]>();
    for (const item of displayItems) {
      if (item.type === "event") {
        // Rider events are identified by parent_event_id — but FeedItemResponse
        // does not expose parent_event_id. We rely on FeedItem's riderItems prop
        // which would need the full EventResponse. For MVP, we render items flat.
        // The EventCard itself handles the expand toggle for its own rider sub-items
        // when full event data is available.
        // See: spec/domains/events-and-feeds.md for rider event handling.
      }
    }
    return map;
  }, [displayItems]);

  // Suppress unused variable warning — riderMap is future-use
  void riderMap;

  function handlePrepend() {
    setPrependedItems((prev) => {
      const existing = new Set(prev.map((i) => i.id));
      return [...newItemIds.filter((i) => !existing.has(i.id)), ...prev];
    });
    setNewItemIds([]);
  }

  // ── Render ──────────────────────────────────────────────────────

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load feed"
        description="There was a problem fetching your feed. Please try again."
      />
    );
  }

  if (displayItems.length === 0 && newItemIds.length === 0) {
    return (
      <EmptyState
        icon={<Newspaper className="h-10 w-10" aria-hidden="true" />}
        title="No events in your feed yet"
        description="Events from your bonds and connections will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* New items banner */}
      {newItemIds.length > 0 && (
        <NewItemsBanner count={newItemIds.length} onPrepend={handlePrepend} />
      )}

      {/* Feed items */}
      <ol className="space-y-2 list-none" aria-label="Feed">
        {displayItems.map((item) => (
          <li key={item.id}>
            <FeedItem item={item} />
          </li>
        ))}
      </ol>

      {/* Load more */}
      <div className="pt-2">
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-text-secondary" aria-label="Loading more" />
          </div>
        )}
        <LoadMoreButton
          onClick={fetchNextPage}
          isLoading={isFetchingNextPage}
          hasMore={hasNextPage}
        />
      </div>
    </div>
  );
}
