# Events & Feeds

> Status: Draft
> Last verified: 2026-03-23
> Related: [stories.md](stories.md), [../api/contract.md#events](../api/contract.md#events), [../api/contract.md#feeds](../api/contract.md#feeds)

## Events

Events are immutable log entries recording state changes. Created automatically when proposals are approved, GM actions execute, sessions change state, etc.

### Key Properties

- **type**: String like `"proposal.approved"`, `"character.updated"`, `"session.started"`
- **visibility**: Visibility level controlling who sees the event
- **actor_type**: `"player"`, `"gm"`, or `"system"`
- **targets**: Array of `{type, id, is_primary}` — the Game Objects affected
- **payload**: Free-form JSON with the changes made
- **proposal_id**: Links to the proposal that caused this event (if any)
- **session_id**: Links to the active session when the event occurred

GM can override event visibility via `PATCH /events/{id}/visibility`.

### Silent Events

Events with `visibility: "silent"` are excluded from all normal feeds. They appear only in the GM's silent feed (`GET /me/feed/silent`) — an audit log of behind-the-scenes changes.

## Feeds

Feeds merge Events and Story entries into a single chronological stream. They are the primary content delivery mechanism for both players and GMs.

### Feed Response Shape (Discriminated Union)

```typescript
type FeedItem =
  | { type: 'event'; id; event_type; timestamp; narrative; visibility; targets; is_own }
  | { type: 'story_entry'; id; story_id; story_name; text; timestamp; author_id }
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

## UI Responsibilities

### FeedItem Component

Two rendering variants:
- **Event variant**: Event type badge, narrative text, timestamp, target links, `is_own` indicator
- **Story entry variant**: Story name link, entry text, author, timestamp

### FeedList Component

- Cursor-based pagination with "Load more" button
- Polling-aware: refetch first page at intervals (20–30s)
- Must not lose scroll position on poll refresh

### Feed Views

- **Player Feed** (`/`): Tabs for All and Starred
- **GM Event Feed** (`/gm/feed`): Tabs for All and Silent. DataTable with column filtering for event type, target, actor, session, date range
- **Character Sheet**: Embedded feed tab
- **Session Detail**: Timeline feed (`GET /sessions/{id}/timeline`)
- **Entity Detail Pages**: Entity-scoped feed sections

## Starred Objects

Users can star Game Objects to create a personalized feed:

- `GET /me/starred` — list starred objects `[{type, id, name}]`
- `POST /me/starred` — star (idempotent, 200 if already starred)
- `DELETE /me/starred/{type}/{id}` — unstar (idempotent, 204)

The starred feed (`GET /me/feed/starred`) shows events/entries only for starred objects.
