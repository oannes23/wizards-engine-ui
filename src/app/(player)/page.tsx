"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Star, Newspaper } from "lucide-react";
import { FeedList } from "@/features/feeds/components/FeedList";
import { MyStoriesSidebar } from "@/features/feeds/components/MyStoriesSidebar";
import { useFeed, useStarredFeed } from "@/features/feeds/hooks/useFeed";

// ── Tab Definitions ────────────────────────────────────────────────

type FeedTab = "all" | "starred";

// ── Page ──────────────────────────────────────────────────────────

/**
 * PlayerFeedPage — Player home page (/).
 *
 * Two tabs:
 *  - "All" — GET /me/feed (all visible events + story entries)
 *  - "Starred" — GET /me/feed/starred (filtered to starred objects)
 *
 * Layout:
 *  - Mobile: My Stories collapsible section + full-width feed
 *  - Desktop (lg): main feed column + sticky My Stories sidebar
 *
 * Polling: 10s normal, 5s during active session (handled in useFeed hooks).
 */
export default function PlayerFeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  const allFeed = useFeed();
  const starredFeed = useStarredFeed();

  const currentFeed = activeTab === "all" ? allFeed : starredFeed;

  // Count starred items from first page (for badge)
  const starredCount = starredFeed.data?.pages[0]?.items.length ?? 0;

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-8 lg:max-w-6xl">
        <div className="lg:flex lg:gap-8">
          {/* ── Main Feed Column ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Mobile: My Stories collapsible */}
            <div className="lg:hidden">
              <MyStoriesSidebar variant="collapsible" />
            </div>

            {/* Tab bar */}
            <Tabs.Root
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as FeedTab)}
            >
              <Tabs.List
                className="flex gap-1 mb-4 border-b border-border-default"
                aria-label="Feed filters"
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
                  value="starred"
                  className="
                    flex items-center gap-1.5 px-3 py-2
                    text-sm font-medium text-text-secondary
                    border-b-2 border-transparent -mb-px
                    hover:text-text-primary transition-colors
                    data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
                  "
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Starred
                  {starredCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-brand-teal/20 px-1.5 py-0.5 text-xs font-medium text-brand-teal">
                      {starredCount}
                    </span>
                  )}
                </Tabs.Trigger>
              </Tabs.List>

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

              <Tabs.Content value="starred" className="focus:outline-none">
                <FeedList
                  data={starredFeed.data}
                  isLoading={starredFeed.isLoading}
                  isFetchingNextPage={starredFeed.isFetchingNextPage}
                  hasNextPage={starredFeed.hasNextPage}
                  fetchNextPage={starredFeed.fetchNextPage}
                  isError={starredFeed.isError}
                />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          {/* ── Desktop Sidebar ───────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <MyStoriesSidebar variant="sidebar" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
