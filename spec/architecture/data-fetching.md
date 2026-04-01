# Data Fetching & Cache Strategy

> Status: Deepened
> Last verified: 2026-03-26
> Related: [api-client.md](api-client.md), [../api/contract.md](../api/contract.md)

## TanStack Query as Primary State Manager

All server data flows through TanStack Query v5 hooks. No separate client-side store.

## Query Key Hierarchy

> **This table is the source of truth** for `src/lib/hooks/query-keys.ts`. The code implements this hierarchy exactly. Key changes are proposed here first.

```
['me']                                    # GET /me
['players']                               # GET /players
['characters', 'list', filters]           # GET /characters
['characters', 'summary']                 # GET /characters/summary
['characters', id]                        # GET /characters/{id}
['characters', id, 'feed', filters]       # GET /characters/{id}/feed
['proposals', 'list', filters]            # GET /proposals
['proposals', id]                         # GET /proposals/{id}
['sessions', 'list']                      # GET /sessions
['sessions', id]                          # GET /sessions/{id}
['sessions', id, 'timeline', filters]     # GET /sessions/{id}/timeline
['groups', 'list', filters]               # GET /groups
['groups', id]                            # GET /groups/{id}
['groups', id, 'feed', filters]           # GET /groups/{id}/feed
['locations', 'list', filters]            # GET /locations
['locations', id]                         # GET /locations/{id}
['locations', id, 'feed', filters]        # GET /locations/{id}/feed
['stories', 'list', filters]             # GET /stories
['stories', id]                           # GET /stories/{id}
['events', filters]                       # GET /events
['feed', 'me', filters]                   # GET /me/feed
['feed', 'me', 'starred', filters]        # GET /me/feed/starred
['feed', 'me', 'silent', filters]         # GET /me/feed/silent
['clocks', 'list', filters]              # GET /clocks
['clocks', id]                            # GET /clocks/{id}
['trait-templates', 'list', filters]      # GET /trait-templates
['starred']                               # GET /me/starred
['gm', 'dashboard']                       # GET /gm/dashboard
['gm', 'queue-summary']                   # GET /gm/queue-summary
['invites']                               # GET /game/invites
```

## Cache Tiers

### Aggressive Cache (staleTime: Infinity, manual invalidation)

| Data | Rationale |
|------|-----------|
| Trait templates | GM-managed catalog, changes are rare |
| Player list | Small fixed group, changes on invite redemption only |
| User `/me` | Identity stable during session |
| Starred objects | Changes only on explicit star/unstar |

### Moderate Cache (background refetch)

| Data | staleTime | Rationale |
|------|-----------|-----------|
| Story list/detail | 30s | Entries added by any player, moderate frequency |
| Clock list/detail | 30s | Advances only on proposal approval or GM action |
| Non-current character detail | 60s | Changes via GM actions, not frequent |
| Session list | 60s | New sessions created by GM only |
| Location/group detail | 60s | GM-managed, infrequent changes |

### Active Polling (refetchInterval, pauses when tab hidden)

| Endpoint | View | Normal | Active Session | Notes |
|----------|------|--------|----------------|-------|
| `GET /proposals?status=pending` | GM Queue | 10s | 5s | New proposals arrive during sessions |
| `GET /gm/dashboard` | GM Queue header | 15s | 5s | PC summaries, stress alerts |
| `GET /characters/{id}` (own) | Character Sheet | 15s | 5s | GM may apply changes |
| `GET /proposals?character_id=X` | Player Proposals | 15s | 5s | Status changes |
| `GET /me/feed` | Player Feed | 20s | 5s | New events |
| `GET /characters/{id}/feed` | Character Feed tab | 20s | 5s | New events |
| `GET /characters/summary` | GM Dashboard | 15s | 5s | PC meter changes |

All polling uses `refetchIntervalInBackground: false` (TanStack Query default).

**Active session boost**: When any session has `status === 'active'`, all polling intervals drop to a fixed **5 seconds**. Detected via `useActiveSession()` hook (see Interrogation Decisions below).

## Cache Invalidation Ripple Map

### On Proposal Approval

Always invalidate:
- `['proposals', id]` — status changed
- `['proposals', 'list']` — remove from pending
- `['characters', characterId]` — meters/traits/bonds/effects may have changed
- `['characters', 'summary']` — PC summary meters
- `['gm', 'dashboard']` — pending count, stress proximity
- `['gm', 'queue-summary']` — queue cards
- `['feed', 'me']` — new event created
- `['characters', characterId, 'feed']`

Additionally by action_type:
- `new_bond` → `['groups', targetId]` (if group target), `['locations', targetId]`
- `work_on_project` → `['clocks', clockId]`, `['stories', storyId]`
- `resolve_trauma` → `['characters', characterId]` (bonds restructured)

### On GM Action

- `['characters', targetId]`, `['groups', targetId]`, or `['locations', targetId]` depending on target
- `['feed', 'me']`, `['events']`

### On Session Start/End

- `['sessions', id]` — status changed
- `['characters']` (all) — FT/Plot distributed (start) or Plot clamped (end)

## Optimistic Updates

### Scope: Direct Actions Only

Optimistic updates are limited to non-proposal mutations where the outcome is deterministic and locally computable. All proposal-driven and GM-action-driven changes are server-authoritative — wait for the response and refetch.

### Applied (direct, deterministic)

| Mutation | Optimistic Update |
|----------|------------------|
| Star/unstar | Toggle in `['starred']` list |
| Delete pending proposal | Remove from `['proposals', 'list']` |

### Not Applied (server-authoritative)

| Mutation | Reason |
|----------|--------|
| Approve proposal | Server applies cascading effects |
| GM actions | 14 action types with arbitrary changes |
| Session start/end | FT/Plot distribution formula is server-side |
| Submit proposal | Server computes `calculated_effect` |
| All downtime actions | Go through proposal flow — server is authoritative |

## Pagination Pattern

Use TanStack Query's `useInfiniteQuery` for all paginated endpoints. The API's `{items, next_cursor, has_more}` shape maps directly to `getNextPageParam`:

```typescript
getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.next_cursor : undefined
```

UI renders a "Load more" button that calls `fetchNextPage()`. No infinite scroll — user controls when to load more.

---

## Interrogation Decisions (2026-03-26)

### Query Key Hierarchy is Source of Truth

- **Decision**: The key hierarchy table in this spec is the authoritative contract for `query-keys.ts`
- **Rationale**: Keeps the spec and code in sync. Key changes are proposed in the spec first, then implemented.
- **Implications**: Added note above the hierarchy table

### Pinned Polling Intervals

- **Decision**: Exact values instead of ranges. Normal: 10s/15s/20s tiers. Active session: fixed 5s for all.
- **Rationale**: Removes implementation ambiguity. Easier to test and debug. Values can be tuned later.
- **Implications**: Updated polling table above with Normal and Active Session columns

### Active Session Detection: useActiveSession() Hook

- **Decision**: A query-based hook that checks for `status=active` sessions
- **Rationale**: Works for both GM and player. Lightweight query with aggressive cache (60s staleTime). All polling hooks consume this to determine interval.
- **Pattern**:
  ```typescript
  function useActiveSession() {
    return useQuery({
      queryKey: queryKeys.sessions.active,
      queryFn: () => api.get<PaginatedResponse<Session>>('/sessions', {
        params: { status: 'active', limit: 1 },
      }),
      staleTime: 60_000,
      select: (data) => data.items[0] ?? null,
    })
  }

  // In any polling hook:
  const { data: activeSession } = useActiveSession()
  const interval = activeSession ? 5_000 : NORMAL_INTERVAL
  ```
- **Implications**: Adds `sessions.active` to query key hierarchy. All polling hooks depend on this.

### Optimistic Updates: Direct Actions Only

- **Decision**: Only apply optimistic updates for star/unstar and delete pending proposal
- **Rationale**: All other mutations are either proposal-driven (server-authoritative) or GM actions (complex side effects). Keeping the scope narrow avoids rollback complexity for MVP.
- **Implications**: Reduced the optimistic updates table from 7 items to 2. All proposal-driven changes refetch on mutation success.

### Pagination UX: Load More Button

- **Decision**: "Load more" button, no infinite scroll
- **Rationale**: User controls when to fetch. Predictable, accessible, no scroll-jank. Works well for feeds where users might want to stop at a certain point.
- **Implications**: All paginated lists render a "Load more" button when `has_more` is true. Button calls `fetchNextPage()` from `useInfiniteQuery`.

### Pinned Moderate Cache staleTime Values

- **Decision**: 30s for stories/clocks (moderate change frequency), 60s for locations/groups/sessions (low change frequency)
- **Rationale**: Specific numbers for deterministic implementation and testing
- **Implications**: Updated moderate cache table above

### Pagination Gaps

- **Decision**: Accept cursor-stale-after-mutation as a known MVP limitation. ULID cursors may skip or duplicate items if entities are inserted/deleted between pages. No deduplication logic.
- **Rationale**: Acceptable for small-campaign usage. Feed prepend via polling already handles the "new items at top" case.

### Session Polling Transitions

- **Decision**: When active session ends, `useActiveSession()` detects the status change on the next poll cycle and intervals return to normal (10/15/20s) immediately. No transition delay.
- **Rationale**: The hook reads session status from the query cache. Status change → re-render → new interval values take effect in the same cycle.

### 201 Cache Updates

- **Decision**: Use 201 POST response data to update TanStack Query cache directly (avoiding a refetch). All 201 responses return the full entity in the same shape as the corresponding GET.
- **Rationale**: Confirmed by backend. Saves a round-trip on every create operation.
