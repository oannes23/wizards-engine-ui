# Data Fetching & Cache Strategy

> Status: Draft
> Last verified: 2026-03-23
> Related: [api-client.md](api-client.md), [../api/contract.md](../api/contract.md)

## TanStack Query as Primary State Manager

All server data flows through TanStack Query v5 hooks. No separate client-side store.

## Query Key Hierarchy

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

### Moderate Cache (staleTime: 30–60s, background refetch)

| Data | Rationale |
|------|-----------|
| Non-current character detail | Changes via GM actions, not frequent |
| Session list | New sessions created by GM only |
| Story list/detail | Entries added by any player, moderate frequency |
| Clock list/detail | Advances only on proposal approval or GM action |
| Location/group detail | GM-managed, infrequent changes |

### Active Polling (refetchInterval, pauses when tab hidden)

| Endpoint | View | Interval | Notes |
|----------|------|----------|-------|
| `GET /proposals?status=pending` | GM Queue | 10–15s | New proposals arrive during sessions |
| `GET /gm/dashboard` | GM Queue header | 15–20s | PC summaries, stress alerts |
| `GET /characters/{id}` (own) | Character Sheet | 15–20s | GM may apply changes |
| `GET /proposals?character_id=X` | Player Proposals | 15–20s | Status changes |
| `GET /me/feed` | Player Feed | 20–30s | New events |
| `GET /characters/{id}/feed` | Character Feed tab | 20–30s | New events |
| `GET /characters/summary` | GM Dashboard | 15–20s | PC meter changes |

All polling uses `refetchIntervalInBackground: false` (TanStack Query default).

Intervals should be shortened when an active session exists (`session.status === 'active'`).

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

### Recommended (low risk, deterministic outcome)

| Mutation | Optimistic Update |
|----------|------------------|
| Star/unstar | Toggle in `['starred']` list |
| Find time | Decrement plot by 3, increment FT by 1 in character cache |
| Use effect | Decrement `charges_current` by 1 |
| Retire effect | Set `is_active = false` |
| Recharge trait | Set `charge = 5`, decrement FT by 1 |
| Maintain bond | Set charges to effective max, decrement FT by 1 |
| Delete pending proposal | Remove from list |

### Not Recommended (server-authoritative, complex side effects)

| Mutation | Reason |
|----------|--------|
| Approve proposal | Server applies cascading effects |
| GM actions | 14 action types with arbitrary changes |
| Session start | FT/Plot distribution formula is server-side |
| Session end | Plot clamping is server-side |
| Submit proposal | Server computes `calculated_effect` |

## Pagination Pattern

Use TanStack Query's `useInfiniteQuery` for all paginated endpoints. The API's `{items, next_cursor, has_more}` shape maps directly to `getNextPageParam`:

```typescript
getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.next_cursor : undefined
```

UI renders a "Load more" button that calls `fetchNextPage()`.
