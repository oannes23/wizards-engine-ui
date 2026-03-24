# Epic 2.3 — Feeds & Events

> Phase: 2
> Status: Not Started
> Depends on: Epic 0.1

## Goal

Build the feed system that merges events and story entries into chronological streams — the primary content delivery mechanism for both players and GMs.

## Stories

### 2.3.1 — FeedItem Component

**As a** user, **I want** feed entries to render correctly **so that** I can read what happened in the game world.

**Files to create:**
- `src/features/feed/FeedItem.tsx`
- `src/features/feed/EventFeedItem.tsx`
- `src/features/feed/StoryEntryFeedItem.tsx`

**Acceptance criteria:**
- [ ] Discriminated union renderer: switches on `item.type`
- [ ] Event variant: event type badge, narrative text, timestamp, target links, `is_own` indicator
- [ ] Story entry variant: story name link, entry text, author, timestamp
- [ ] Accessible: proper semantic HTML, readable timestamps

### 2.3.2 — FeedList Component

**As a** user, **I want** paginated feeds **so that** I can browse history without loading everything at once.

**Files to create:**
- `src/features/feed/FeedList.tsx`
- `src/lib/hooks/useFeed.ts`

**Acceptance criteria:**
- [ ] Cursor-based pagination with "Load more" button
- [ ] Uses `useInfiniteQuery` with `getNextPageParam` from `next_cursor`
- [ ] Does not lose scroll position on poll refresh
- [ ] Empty state when no items
- [ ] Loading state on initial fetch and on "Load more"

### 2.3.3 — Player Feed Page

**As a** player, **I want** a main feed **so that** I can see what's happening in the game world.

**Files to create:**
- `src/app/(player)/page.tsx`

**Acceptance criteria:**
- [ ] Tabs: All | Starred
- [ ] All tab: `GET /me/feed`
- [ ] Starred tab: `GET /me/feed/starred`
- [ ] Polling at 20–30s
- [ ] Tab state persisted during session

### 2.3.4 — Starred Objects Management

**As a** player, **I want** to star/unstar game objects **so that** I can curate my feed.

**Files to create:**
- `src/lib/hooks/useStarred.ts`
- `src/lib/api/services/starred.ts`

**Acceptance criteria:**
- [ ] Star/unstar buttons on game object detail pages
- [ ] `POST /me/starred` and `DELETE /me/starred/{type}/{id}`
- [ ] Optimistic updates (toggle immediately, revert on error)
- [ ] Starred list on profile page with unstar buttons

### 2.3.5 — GM Event Feed

**As a** GM, **I want** to see all events **so that** I have full visibility into game state changes.

**Files to create:**
- `src/app/(gm)/feed/page.tsx`
- `src/lib/api/services/events.ts`

**Acceptance criteria:**
- [ ] Tabs: All | Silent
- [ ] All tab: `GET /events` with DataTable (sortable, filterable)
- [ ] Silent tab: `GET /me/feed/silent` — audit log of hidden events
- [ ] Filters: event type, target type/id, actor type, session, date range
- [ ] Polling at 30s

### 2.3.6 — Session Timeline Feed

**As a** user, **I want** to see events from a specific session **so that** I can review what happened during play.

**Acceptance criteria:**
- [ ] `GET /sessions/{id}/timeline` rendered as FeedList
- [ ] Embedded in session detail page
- [ ] Visibility-filtered (players see only what they're allowed)

### 2.3.7 — Entity-Scoped Feeds

**As a** user, **I want** feeds on entity detail pages **so that** I can see history for a specific character/group/location.

**Acceptance criteria:**
- [ ] Character feed: `GET /characters/{id}/feed` (used in character sheet)
- [ ] Group feed: `GET /groups/{id}/feed` (used in group detail)
- [ ] Location feed: `GET /locations/{id}/feed` (used in location detail)
- [ ] All use shared FeedList component
