// ── Feeds Feature Module ──────────────────────────────────────────
// Public API of the feeds feature. Import from here, not from sub-paths.

// Components
export { FeedItem } from "./components/FeedItem";
export { FeedList } from "./components/FeedList";
export { EventCard } from "./components/EventCard";
export { StoryEntryCard } from "./components/StoryEntryCard";
export { MyStoriesSidebar } from "./components/MyStoriesSidebar";
export { StarToggle } from "./components/StarToggle";
export { SessionTimelineFeed } from "./components/SessionTimelineFeed";

// Hooks
export { useFeed, useStarredFeed, useSilentFeed } from "./hooks/useFeed";
export { useGroupFeed, useLocationFeed } from "./hooks/useEntityFeed";
export { useActiveSession } from "./hooks/useActiveSession";
export { useStarredObjects, useStarToggle, useIsStarred } from "./hooks/useStarredObjects";

// Types
export type {
  FeedItemResponse,
  FeedEventItem,
  FeedStoryEntryItem,
  StarredObject,
  StarredObjectsResponse,
  StorySummary,
  FeedFilters,
} from "./types";
