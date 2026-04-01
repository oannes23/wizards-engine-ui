# Events & Feeds

> Status: Deepened
> Last verified: 2026-03-27
> Related: [stories.md](stories.md), [../api/contract.md#events](../api/contract.md#events), [../api/contract.md#feeds](../api/contract.md#feeds)

## Events

Events are immutable log entries recording state changes. Created automatically when proposals are approved, GM actions execute, sessions change state, etc.

### Key Properties

- **type**: String like `"proposal.approved"`, `"character.updated"`, `"session.started"` — `{domain}.{action}` convention, not a closed enum
- **visibility**: Visibility level controlling who sees the event
- **actor_type**: `"player"`, `"gm"`, or `"system"`
- **targets**: Array of `{type, id, is_primary}` — the Game Objects affected
- **changes**: Keyed change records (`{entity_type}.{ulid}.{field}` → `{old, new}`)
- **changes_summary**: Server-generated human-readable summary (e.g., "Stress: 3 → 5, Plot: 5 → 3")
- **narrative**: Optional narrative text from the actor
- **proposal_id**: Links to the proposal that caused this event (if any)
- **parent_event_id**: Links to parent event for rider events
- **session_id**: Links to the active session when the event occurred

GM can override event visibility via `PATCH /events/{id}/visibility`.

### Silent Events

Events with `visibility: "silent"` are excluded from all normal feeds. They appear only in the GM's silent feed (`GET /me/feed/silent`) — an audit log of behind-the-scenes changes.

## Feeds

Feeds merge Events and Story entries into a single chronological stream. They are the primary content delivery mechanism for both players and GMs.

### Feed Response Shape (Discriminated Union)

```typescript
type FeedItemResponse =
  | {
      type: 'event'
      id: string
      event_type: string
      timestamp: string
      narrative: string | null
      visibility: VisibilityLevel
      targets: Array<{ type: GameObjectType; id: string; is_primary: boolean }>
      is_own: boolean
    }
  | {
      type: 'story_entry'
      id: string
      story_id: string
      story_name: string
      text: string
      timestamp: string
      author_id: string
    }
```

The renderer must switch on `item.type` to choose the correct sub-component.

### Feed Endpoints

| Endpoint | Scope | Notes |
|----------|-------|-------|
| `GET /me/feed` | All visible events + story entries for current user | Player's main feed |
| `GET /me/feed/starred` | Feed filtered to starred Game Objects only | Player's starred tab |
| `GET /me/feed/silent` | Silent events only | GM audit log |
| `GET /characters/{id}/feed` | Events targeting this character | Character sheet feed tab |
| `GET /groups/{id}/feed` | Events targeting this group | Group detail feed |
| `GET /locations/{id}/feed` | Events targeting this location | Location detail feed |

All share the same filters: `type?`, `target_type?`, `target_id?`, `actor_type?`, `session_id?`, `since?`, `until?`, `after?`, `limit?`

## Starred Objects

Users can star Game Objects to create a personalized feed:

- `GET /me/starred` — list starred objects `[{type, id, name}]`
- `POST /me/starred` — star (idempotent, 200 if already starred)
- `DELETE /me/starred/{type}/{id}` — unstar (idempotent, 204)

The starred feed (`GET /me/feed/starred`) shows events/entries only for starred objects.

---

## Interrogation Decisions

### Event Display

- **Decision**: Show `changes_summary` by default. Add an expandable "Details" section on event cards that renders raw `changes` as before/after key-value pairs. Both in MVP.
- **Rationale**: Summary is quick to scan. Raw details serve GM auditing and player curiosity without cluttering the default view.

### Event Card: Compact with Expandable Detail

- **Decision**: Each event renders as a compact card with: event type icon + human-readable label, narrative text (primary content), `changes_summary` as secondary line, target entity links, relative timestamp. Own events (`is_own: true`) get a subtle highlight (e.g., tinted left border). Expandable to show full `changes` detail. Story entries render with story name link, entry text, author character name, and timestamp.
- **Rationale**: Compact cards maximize the number of items visible. Narrative-first display keeps the game fiction prominent. Expandable detail available for mechanical inspection.
- **Implications**: Two sub-components: `EventCard` and `StoryEntryCard`, switched by `item.type`. Expand/collapse state is per-item, ephemeral.

### Event Type Labels: Icon + Label Map

- **Decision**: Client-side map from event type strings to `{icon, label, color}`. e.g., `proposal.approved` → {✔, "Proposal Approved", teal}. Unknown/unmapped types fall back to a generic icon (○) + the raw type string. Map covers all documented event types (~40).
- **Rationale**: Human-readable labels are essential for usability. A client-side map is simple, fast, and future-proof (unknown types degrade gracefully). Icons provide quick visual scanning.
- **Implications**: Constant map in a `eventTypeConfig.ts` file. Icons from Lucide. Color maps to the brand palette.

### Rider Events: Collapsed Under Parent

- **Decision**: Rider events (identified by `parent_event_id`) are shown as an indented sub-item under the parent approval event, with the rider's `changes_summary` visible. Collapsible. If the parent event is not in the current feed page, the rider renders as a standalone item with a "part of [parent event]" link.
- **Rationale**: Riders are contextually tied to their parent approval. Collapsing preserves the parent context while keeping the feed clean. The standalone fallback handles pagination edge cases.
- **Implications**: Feed rendering groups items by `parent_event_id`. Indentation via CSS margin. Collapse state is per-group.

### Player Feed: Feed + Sidebar

- **Decision**: Desktop: main feed column with All/Starred tabs + right sidebar with My Stories compact card list. Mobile: My Stories as a collapsible section at the top (collapsed by default), then All/Starred tabs with the feed below. Feed is the primary content area.
- **Rationale**: The feed is what players check most often. My Stories in the sidebar gives quick access without competing for vertical space. On mobile, collapsing it prioritizes the feed.
- **Implications**: Responsive layout: 2-column at desktop breakpoint (768px+), stacked on mobile. Sidebar position is `sticky` on desktop. My Stories fetches from `GET /stories` filtered by owner.

### GM Feed: Feed + Filters + Silent Tab

- **Decision**: Same feed layout as player but with advanced filter controls and three tabs: All (full GM visibility), Silent (audit log of behind-the-scenes events), and Filter mode (opens filter panel). Filters: event type multi-select, target type, actor type, session selector, date range pickers. Filters apply to the All tab query params.
- **Rationale**: The GM needs analytical access to events for debugging and narrative management. Filters let them drill into specific areas. The Silent tab surfaces events players never see.
- **Implications**: Filter state stored in URL query params for shareability/bookmarking. Filter panel is collapsible. Silent tab uses `GET /me/feed/silent`.

### New Item Polling: Banner + Prepend

- **Decision**: New items detected by polling are prepended silently if the user is at the scroll top. If the user has scrolled down, show a "[N new items ↑]" banner fixed at the top of the feed. Clicking the banner scrolls to top and reveals new items. Scroll position is never jumped.
- **Rationale**: The banner pattern (used by Twitter/social feeds) is the gold standard for "new items available without disrupting reading". Silent prepend at top avoids unnecessary banners when the user is already looking at the latest.
- **Implications**: Track scroll position. Compare poll results to current feed to detect new items. Banner component with count. `scrollTo({ top: 0, behavior: 'smooth' })` on click.

### Star UX: Icon on Cards and Headers

- **Decision**: Star icon (☆/★) on entity cards in the World Browser list and on entity detail page headers. Toggle on click — idempotent `POST /me/starred` to star, `DELETE /me/starred/{type}/{id}` to unstar. Optimistic update (toggle immediately, revert on error). Starred feed tab on the Player Feed page shows the count in the tab label.
- **Rationale**: Star-on-card is the most discoverable pattern. Optimistic toggle is instant. Starred count in the tab label hints at the feature.
- **Implications**: Star state needs to be available on entity cards. Fetch `GET /me/starred` at app load (small, rarely changes, long staleTime). Star icon component shared between list cards and detail headers.

### Feed Pagination: Bottom "Load Older" Button

- **Decision**: "Load older" button at the bottom of the feed. Loads the next page via cursor and appends below existing items. Initial load: 20 items. Standard cursor-based pagination using the `after` param.
- **Rationale**: Button pagination is simpler and more predictable than infinite scroll, especially with polling active. "Load older" direction is clear (feeds are newest-first).
- **Implications**: `after` cursor stored in component state. Button disabled while loading. Show "No more items" when `has_more === false`.

---

## UI Responsibilities

### FeedItem Components

**EventCard**:
- Event type icon + label (from map)
- Narrative text (primary)
- `changes_summary` (secondary, muted)
- Target entity links (clickable → detail page)
- Relative timestamp
- `is_own` subtle left-border highlight
- Expandable: full `changes` detail view
- Rider events: indented sub-item with collapse

**StoryEntryCard**:
- Story name (linked → story detail)
- Entry text
- Author character name
- Relative timestamp

### Player Feed Page (`/`)

- Desktop: feed column + My Stories sidebar (sticky)
- Mobile: collapsible My Stories section + feed
- Feed tabs: All, Starred (with count)
- Feed: compact cards, "Load older" pagination, new item banner
- Polling: 10s normal, 5s active session

### GM Event Feed (`/gm/feed`)

- Feed with advanced filters (type, target, actor, session, date range)
- Tabs: All, Silent, Filter mode
- Same card rendering as player feed
- Polling: 15s normal, 5s active session

### Entity Feeds (Character, Group, Location, Session)

- Embedded feed sections on detail pages
- Entity-scoped: `GET /{entity_type}/{id}/feed`
- Same FeedItem components
- "Load older" pagination
- Polling: follows data-fetching spec intervals

### Star Interaction

- ☆/★ toggle on World Browser cards and entity detail headers
- Optimistic update on click
- Starred list fetched at app load, long staleTime
- Starred count shown in feed tab label

### Polling

| Feed | Normal | Active Session |
|------|--------|----------------|
| Player personal feed | 10s | 5s |
| GM event feed | 15s | 5s |
| Character/entity feeds | 20s | 5s |
| Session timeline | 10s | 5s |
