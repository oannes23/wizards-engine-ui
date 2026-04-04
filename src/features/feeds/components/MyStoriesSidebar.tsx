"use client";

import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getMyStories } from "@/lib/api/services/stories";
import type { StoryDetailResponse } from "@/lib/api/types";

/**
 * MyStoriesSidebar — Compact list of active stories where the player's
 * character is an owner.
 *
 * Desktop: sticky sidebar column.
 * Mobile: collapsible section rendered above the feed.
 *
 * NOTE: The backend visibility-filters stories. We fetch active stories
 * and display those visible to the current user.
 */

function StoryCard({ story }: { story: StoryDetailResponse }) {
  return (
    <Link
      href={`/world/stories/${story.id}`}
      className="
        block rounded-md border border-border-default bg-bg-muted
        px-3 py-2 hover:bg-bg-elevated hover:border-brand-teal/30
        transition-colors group
      "
    >
      <div className="flex items-start gap-2">
        <BookOpen
          className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-teal"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary group-hover:text-brand-teal transition-colors truncate">
            {story.name}
          </p>
          {story.tags.length > 0 && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {story.tags.slice(0, 3).join(", ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

interface MyStoriesSidebarProps {
  /** On mobile, renders as a collapsible section instead of a sticky sidebar. */
  variant?: "sidebar" | "collapsible";
}

export function MyStoriesSidebar({ variant = "sidebar" }: MyStoriesSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.stories.list({ status: "active" }),
    queryFn: getMyStories,
    staleTime: 30_000,
  });

  const stories = data?.items ?? [];

  if (isLoading) {
    return (
      <div className={variant === "sidebar" ? "w-full" : "mb-4"}>
        <div className="h-5 w-32 rounded bg-bg-elevated animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 rounded-md bg-bg-elevated animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  if (variant === "collapsible") {
    return (
      <div className="mb-4 border border-border-default rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full flex items-center justify-between
            px-4 py-3 bg-bg-surface
            hover:bg-bg-elevated transition-colors text-left
          "
          aria-expanded={isOpen}
        >
          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-teal" aria-hidden="true" />
            My Stories
            <span className="inline-flex items-center rounded-full bg-brand-teal/20 px-2 py-0.5 text-xs font-medium text-brand-teal">
              {stories.length}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        {isOpen && (
          <div className="px-4 py-3 bg-bg-page space-y-2">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-brand-teal" aria-hidden="true" />
        My Stories
      </h2>
      <div className="space-y-2">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
