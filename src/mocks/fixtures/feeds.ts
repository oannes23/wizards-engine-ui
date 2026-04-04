import type { FeedItemResponse } from "@/lib/api/types";

/**
 * Factory for a feed event item.
 */
export function makeFeedEvent(
  overrides?: Partial<Extract<FeedItemResponse, { type: "event" }>>
): Extract<FeedItemResponse, { type: "event" }> {
  return {
    type: "event",
    id: "01EVTITEM00000000000000000",
    event_type: "proposal.approved",
    timestamp: new Date().toISOString(),
    narrative: "A proposal was approved.",
    visibility: "public",
    targets: [
      {
        type: "character",
        id: "01CHAR000000000000000000",
        is_primary: true,
      },
    ],
    is_own: false,
    ...overrides,
  };
}

/**
 * Factory for a feed story entry item.
 */
export function makeFeedStoryEntry(
  overrides?: Partial<Extract<FeedItemResponse, { type: "story_entry" }>>
): Extract<FeedItemResponse, { type: "story_entry" }> {
  return {
    type: "story_entry",
    id: "01ENTRY000000000000000000",
    story_id: "01STORY000000000000000000",
    story_name: "The Heist",
    text: "In the shadows of the vault, she waited.",
    timestamp: new Date().toISOString(),
    author_id: "01PL_A0000000000000000000",
    ...overrides,
  };
}
