// ── Feed Feature Types ────────────────────────────────────────────
// Extends and re-exports types from the API layer for use in feed components.
// Source of truth: spec/api/response-shapes.md (Feed Item section)

import type {
  FeedItemResponse,
  EventResponse,
  VisibilityLevel,
} from "@/lib/api/types";

export type { FeedItemResponse, EventResponse };

// Re-export types that originated here but now live in the API layer.
export type {
  StarredObject,
  StarredObjectsResponse,
  FeedFilters,
} from "@/lib/api/types";

// ── Feed Item Discriminated Branches ──────────────────────────────

export type FeedEventItem = Extract<FeedItemResponse, { type: "event" }>;
export type FeedStoryEntryItem = Extract<
  FeedItemResponse,
  { type: "story_entry" }
>;

// ── Story Summary (for My Stories sidebar) ────────────────────────

export interface StorySummary {
  id: string;
  name: string;
  status: "active" | "completed" | "abandoned";
  tags: string[];
  visibility_level: VisibilityLevel;
}
