"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/time";
import type { FeedStoryEntryItem } from "../types";

interface StoryEntryCardProps {
  /** The story entry feed item to display. */
  item: FeedStoryEntryItem;
  /** Optional display name for the author (resolved from author_id). */
  authorName?: string;
}

/**
 * StoryEntryCard — Displays a single story entry feed item.
 *
 * Shows:
 * - Story name as a link to the story detail page
 * - Entry text (NOTE: field is `entry_text` on server response, mapped to `text` in FeedItemResponse)
 * - Author name
 * - Timestamp
 *
 * Discrepancy D1: The backend uses `entry_text` on story entries but the
 * FeedItemResponse type in spec/api/response-shapes.md uses `text`.
 * This component uses `item.text` as defined in the FeedItemResponse type.
 */
export function StoryEntryCard({ item, authorName }: StoryEntryCardProps) {
  return (
    <article
      className="rounded-lg border border-border-default bg-bg-surface px-4 py-3"
      aria-label={`Story entry in ${item.story_name}`}
    >
      {/* Story link header */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href={`/world/stories/${item.story_id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal hover:text-brand-teal-light transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {item.story_name}
        </Link>
      </div>

      {/* Entry text — leading narrative content */}
      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {item.text}
      </p>

      {/* Footer: author + timestamp */}
      <div className="flex items-center justify-between gap-2">
        {authorName && (
          <span className="text-xs text-text-secondary">
            {authorName}
          </span>
        )}
        <time
          dateTime={item.timestamp}
          className="text-xs text-text-secondary ml-auto"
          title={new Date(item.timestamp).toLocaleString()}
        >
          {formatRelativeTime(item.timestamp)}
        </time>
      </div>
    </article>
  );
}

