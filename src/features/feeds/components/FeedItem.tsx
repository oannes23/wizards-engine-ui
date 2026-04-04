"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EventCard } from "./EventCard";
import { StoryEntryCard } from "./StoryEntryCard";
import type { FeedItemResponse } from "../types";

interface FeedItemProps {
  /** The discriminated union feed item to render. */
  item: FeedItemResponse;
  /**
   * Child rider events (only relevant when item.type === 'event').
   * Rider events have a parent_event_id pointing to this item.
   */
  riderItems?: Array<Extract<FeedItemResponse, { type: "event" }>>;
}

/**
 * FeedItem — Top-level discriminated union renderer for feed items.
 *
 * Routes to EventCard or StoryEntryCard based on item.type.
 *
 * Rider events (child events with a parent_event_id) are collapsed
 * under their parent approval event with an expand toggle.
 */
export function FeedItem({ item, riderItems = [] }: FeedItemProps) {
  const [ridersExpanded, setRidersExpanded] = useState(false);
  const hasRiders = riderItems.length > 0;

  if (item.type === "event") {
    return (
      <div className="space-y-1">
        <EventCard item={item} />

        {/* Rider events */}
        {hasRiders && (
          <div>
            <button
              onClick={() => setRidersExpanded(!ridersExpanded)}
              className="
                flex items-center gap-1 text-xs text-text-secondary
                hover:text-text-primary transition-colors ml-4 py-1
              "
              aria-expanded={ridersExpanded}
              aria-label={`${ridersExpanded ? "Hide" : "Show"} ${riderItems.length} rider event${riderItems.length === 1 ? "" : "s"}`}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  ridersExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
              {ridersExpanded
                ? "Hide rider events"
                : `${riderItems.length} rider event${riderItems.length === 1 ? "" : "s"}`}
            </button>

            {ridersExpanded && (
              <div className="space-y-1 mt-1">
                {riderItems.map((rider) => (
                  <EventCard key={rider.id} item={rider} isRider />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (item.type === "story_entry") {
    return <StoryEntryCard item={item} />;
  }

  // Exhaustive union check — TypeScript will catch unhandled cases
  return null;
}
