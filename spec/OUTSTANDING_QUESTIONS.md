# Outstanding Questions

> Status: Active
> Created: 2026-03-27
> Purpose: Implementation gaps, ambiguities, and edge cases discovered during comprehensive spec review. Resolve via `/interrogate` per category before writing epics/stories.

---

## Summary

| Status | Count |
|--------|-------|
| **Resolved** | 65 |
| **Open** | 0 |
| **Deferred** | 4 |
| **Total** | **69** |

### Change Requests from Backend Review

The backend questionnaire revealed these gaps requiring code changes:

| CR | Description | Source | Status |
|----|-------------|--------|--------|
| Logout endpoint | `POST /auth/logout` clears the httpOnly cookie | BQ-11 | **Implemented** |
| Pydantic 422 normalization | All Pydantic errors now use standard `{error: {code, message, details}}` envelope | BQ-20 | **Implemented** (2026-03-29) |
| 0-participant session validation | `POST /sessions/{id}/start` rejects with `no_participants` if empty | BV-10 | **Implemented** |
| Proposal optimistic locking | Add `updated_at`-based concurrency control on `PATCH /proposals/{id}` | BQ-10 / BV-05 | **Deferred** (re-validation-on-approval covers the dangerous race) |

### Key Corrections from Backend

| Topic | Our Assumption | Actual Behavior |
|-------|---------------|-----------------|
| work_on_project + clocks | Auto-increments targeted clock | Does NOT touch clocks. Clock advancement is always a separate GM `modify_clock` action |
| Clock is_completed | Stored boolean flag | Computed on read from `progress >= segments` |
| Narrative optionality | Always optional | Required for downtime + direct actions, optional for session actions |
| Effective stress max = 0 | Possible via 9 traumas | Minimum = 1 (max 8 traumas due to 8 bond slots) |
| 0-participant session start | Blocked by API | ~~API allows it~~ **Resolved**: API now rejects with `no_participants` error (BV-10 implemented) |
| Bond-graph entity access | Players can't see filtered entities | Bond-graph applies to feeds/events AND entity detail access. Players see full detail only for entities within 3 hops; beyond that, name + description only (CR-013 implemented). All entities remain browsable. |
| 422 error shape | Single envelope format | ~~Two shapes~~ **Resolved**: All 422 errors now use standard `{error: {...}}` envelope (BQ-20 implemented 2026-03-29) |
| 201 responses | May be partial | Always full entity, same shape as GET |

### Original Priority Breakdown (for reference)

| # | Category | P0 | P1 | P2 | P3 | Total |
|---|----------|----|----|----|----|-------|
| 1 | Game Object Lifecycle & Deletion | 5 | 0 | 0 | 0 | 5 |
| 2 | Bond Graph Traversal | 2 | 0 | 0 | 0 | 2 |
| 3 | Proposal Wizard Edge Cases | 0 | 6 | 1 | 0 | 7 |
| 4 | Magic System Limits | 0 | 3 | 0 | 0 | 3 |
| 5 | Character Meters & Stress | 0 | 2 | 2 | 0 | 4 |
| 6 | Session Mechanics | 0 | 5 | 0 | 0 | 5 |
| 7 | Feeds & Events | 0 | 5 | 1 | 0 | 6 |
| 8 | GM Queue & Actions | 1 | 3 | 1 | 0 | 5 |
| 9 | UI/UX Gaps | 0 | 2 | 2 | 2 | 6 |
| 10 | Auth & Cookies | 0 | 3 | 1 | 0 | 4 |
| 11 | Data Fetching & Caching | 0 | 0 | 4 | 0 | 4 |
| 12 | Clocks (Missing Domain Spec) | 4 | 0 | 0 | 0 | 4 |
| 13 | Testing Strategy | 0 | 0 | 3 | 2 | 5 |
| 14 | Visibility & Permissions | 0 | 5 | 0 | 0 | 5 |
| 15 | Form Validation & Error Recovery | 0 | 0 | 3 | 1 | 4 |

### Resolution Workflow

Resolve questions via `/interrogate` sessions grouped by category. Update the `Status` column as decisions are made:
- **Open** — Not yet addressed
- **Resolved** — Decision made, spec updated
- **Pending Backend** — Sent to backend team via [BACKEND_QUESTIONNAIRE.md](api/BACKEND_QUESTIONNAIRE.md)
- **Deferred** — Explicitly deferred to a later phase

---

## P0 — Blocks Epic/Story Writing

### Category 12: Clocks (Missing Domain Spec)

No `spec/domains/clocks.md` exists, yet clocks are referenced in 5 spec files with 6 API endpoints in [contract.md](api/contract.md). A dedicated `/interrogate` session is needed to create this domain spec.

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-001 | No clock domain spec exists. What is the clock lifecycle (creation, progression, completion, resolution)? Who creates clocks — GM only? How are they associated with groups vs standalone? | Resolved | [groups.md](domains/groups.md), [proposals.md](domains/proposals.md), [contract.md](api/contract.md), [response-shapes.md](api/response-shapes.md) |
| Q-002 | How do clocks progress? Is a clock tick always +1? Can players tick clocks via `work_on_project` proposals, or only the GM via `modify_clock`? What triggers the `resolve_clock` system proposal — automatic on completion or GM-initiated? | Resolved | [contract.md](api/contract.md) (GM actions), [proposals.md](domains/proposals.md) (work_on_project) |
| Q-003 | What are the `resolve_clock` mechanics? Does the GM choose the outcome, or does the clock have a pre-defined outcome? Is the clock archived/soft-deleted after resolution? | Resolved | [proposals.md](domains/proposals.md), [response-shapes.md](api/response-shapes.md) |
| Q-004 | ClockBar interaction model: are segments configurable per clock? Does the GM click segments to advance, or always via GM actions? What are hover/click states? The component spec lists `segments`, `progress`, `isCompleted?`, `size?` but no interaction model. | Resolved | [components.md](ui/components.md), [gm-views.md](ui/gm-views.md) |

### Category 1: Game Object Lifecycle & Deletion

The API uses soft-delete (`is_deleted: true`) but no spec addresses cascade behavior when game objects are deleted. This affects every feature that renders relationships between entities.

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-005 | What happens when a character is soft-deleted but has active bonds? Do bonded characters see a "[Deleted]" placeholder? Is the bond also soft-deleted? Do bond-graph visibility calculations exclude deleted characters? | Resolved | [bonds.md](domains/bonds.md), [characters.md](domains/characters.md), [response-shapes.md](api/response-shapes.md) |
| Q-006 | What happens to a deleted character's pending proposals, session participation, story entries, and trauma bonds? Are proposals auto-rejected? Is the session participant removed? Do story entries remain attributed? | Resolved | [proposals.md](domains/proposals.md), [sessions.md](domains/sessions.md), [stories.md](domains/stories.md) |
| Q-007 | If a location's parent is soft-deleted, what happens to the breadcrumb? Does the child become top-level (`parent_id: null`)? Or does the breadcrumb show a "[Deleted]" ancestor? | Resolved | [locations.md](domains/locations.md) |
| Q-008 | Story entry author deleted — what shows in the entries list? The entry has `author_id` and `character_id`. Does the API return a placeholder name, null, or the original name frozen at write time? | Resolved | [stories.md](domains/stories.md), [response-shapes.md](api/response-shapes.md) |
| Q-009 | Does bond retirement cascade to group membership? Groups derive members from bonds. If a character's bond to a group moves to `past`, does the character disappear from `members[]`? Is this server-side or does the frontend need to filter? | Resolved | [groups.md](domains/groups.md), [bonds.md](domains/bonds.md) |

### Category 2: Bond Graph Traversal

The traversal rule in [bonds.md](domains/bonds.md) and [glossary.md](glossary.md) states "after a non-Character node, the next hop must go through a Character" but provides no examples. The answer determines visibility tier correctness across the entire app.

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-010 | The traversal rule needs explicit valid/invalid hop sequence examples. Is `Character -> Location -> Group -> Character` valid? Or does each non-Character hop require an immediate return through a Character node? | Resolved | [glossary.md](glossary.md), [bonds.md](domains/bonds.md), [locations.md](domains/locations.md) |
| Q-011 | Is `Character -> Group -> Location` a valid 2-hop path? Location is not a Character, so by the rule this seems invalid — but it represents a real-world relationship (a character's guild holds a location). The answer determines what presence tiers show on location detail pages. | Resolved | [glossary.md](glossary.md), [locations.md](domains/locations.md), [groups.md](domains/groups.md) |

### Category 8: GM Queue & Actions (P0 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-012 | Batch mode (1-50 actions) semantics: is it atomic/transactional (all-or-nothing) or partial success? [contract.md](api/contract.md) says "atomically" but [gm-views.md](ui/gm-views.md) says "validation errors map to specific action indices." These are contradictory. | Resolved | [contract.md](api/contract.md), [gm-views.md](ui/gm-views.md) |

---

## P1 — Blocks Implementation

### Category 3: Proposal Wizard Edge Cases

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-013 | Error handling when `POST /proposals/calculate` returns 422 — how does the wizard respond? Show field-level errors and navigate back to step 2? Or show a generic error banner on step 3? | Resolved | [proposals.md](domains/proposals.md), [response-shapes.md](api/response-shapes.md) |
| Q-014 | Session expiry mid-wizard — should we auto-save the draft? Auth spec says redirect+toast on 401. If a player has complex magic sacrifice selections in progress, all state is lost. Is browser sessionStorage sufficient, or do we need server-side draft persistence? | Resolved | [auth.md](architecture/auth.md), [proposals.md](domains/proposals.md) |
| Q-015 | Player editing a pending proposal while GM is reviewing it — race condition handling? If a player PATCHes a proposal at the moment the GM approves it, what happens? Does the API return 409? Does the edit silently fail? | Resolved | [proposals.md](domains/proposals.md), [contract.md](api/contract.md) |
| Q-016 | GM approves a stale version of a proposal the player just edited. The GM queue polls at 10s. If the player edits in that window, the GM sees stale `calculated_effect`. Is there a version/etag mechanism, or is this an accepted race? | Resolved | [proposals.md](domains/proposals.md), [data-fetching.md](architecture/data-fetching.md) |
| Q-017 | Validation rules per action type — which selections are required vs optional for each of the 12 types? For example, `work_on_project` has `story_id?` and `clock_id?` both optional, but the spec says "at least one should be selected." Is this server-enforced or client-only? | Resolved | [contract.md](api/contract.md), [proposals.md](domains/proposals.md) |
| Q-018 | Narrative field: required for downtime actions in the calculate endpoint, or only on final submit? If the player calls `/proposals/calculate` without a narrative, does it 422? | Resolved | [proposals.md](domains/proposals.md), [response-shapes.md](api/response-shapes.md) |

### Category 4: Magic System Limits

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-019 | 9 active effect limit — how does the UI prevent the 10th? Disable `use_magic` action type when at 9 effects, or let the API reject with a specific error code? What error code? | Resolved | [magic.md](domains/magic.md), [proposals.md](domains/proposals.md) |
| Q-020 | Can a player sacrifice a bond/trait in the same proposal where it's also used as a modifier? Same entity, dual-use. The sacrifice builder and modifier picker are separate UI sections — nothing prevents selecting the same bond in both. | Resolved | [magic.md](domains/magic.md), [proposals.md](domains/proposals.md) |
| Q-021 | Sacrifice builder edge case: what if `lowest_magic_stat` is 0? FT sacrifice rate = `3 + lowest_magic_stat` = 3 FT per sacrifice die. Is 0 a valid lowest stat? What if all magic stats are 0 (new character)? | Resolved | [magic.md](domains/magic.md) |

### Category 5: Character Meters & Stress (P1 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-022 | Can `effective_stress_max` be reduced to 0 or negative? If `trauma_count >= STRESS_MAX (9)`, effective max is 0. Can a character accumulate that many traumas? What does the UI show — a fully disabled meter? | Resolved | [characters.md](domains/characters.md), [glossary.md](glossary.md) |
| Q-023 | Trauma auto-proposal timing relative to meter animation. When stress hits effective max, server creates a `resolve_trauma` system proposal. Does the meter animation complete before the system proposal appears, or are they concurrent? Should there be a visual trauma indicator on the meter? | Resolved | [characters.md](domains/characters.md), [proposals.md](domains/proposals.md) |

### Category 6: Session Mechanics

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-024 | FT distribution formula: frontend can't display predicted FT gain without knowing the formula. Start confirmation modal shows a time_now delta, but how does it translate to FT? Does the API provide a preview, or is the modal generic ("FT will be distributed")? | Resolved | [sessions.md](domains/sessions.md), [gm-views.md](ui/gm-views.md) |
| Q-025 | Can a player join a session, leave, then re-join? The API has POST and DELETE for participants. Does the `already_registered` 409 error prevent re-join after leaving? | Resolved | [sessions.md](domains/sessions.md), [response-shapes.md](api/response-shapes.md) |
| Q-026 | Session with 0 participants — can the GM start it? Start confirmation modal shows participants and predicted gains. If empty, is the start button disabled, or does the API allow starting with nobody? | Resolved | [sessions.md](domains/sessions.md), [gm-views.md](ui/gm-views.md) |
| Q-027 | `time_now` semantics: min/max bounds? The spec says "abstract integer representing campaign time passage." Can it be 0? Negative? Is there a maximum? Must it strictly increase across sessions? | Resolved | [sessions.md](domains/sessions.md), [response-shapes.md](api/response-shapes.md) |
| Q-028 | `additional_contribution` toggle: what is the mechanical effect beyond +2 Plot? Is there a narrative meaning (e.g., "player brought snacks") or purely mechanical? What does the tooltip say? | Resolved | [sessions.md](domains/sessions.md), [gm-views.md](ui/gm-views.md) |

### Category 7: Feeds & Events (P1 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-029 | Event type catalog: convention-based strings (`{domain}.{action}`) or closed enum? The spec lists known types but says "convention string." If open-ended, tests can't enumerate all types and the icon/label map can't be exhaustive. What's the full list? | Resolved | [response-shapes.md](api/response-shapes.md), [events-and-feeds.md](domains/events-and-feeds.md) |
| Q-030 | Rider event semantics: what event types are allowed as riders? Can a rider be any event type (e.g., `character.stress_changed` as a rider on a proposal approval)? Are there validation rules limiting rider types? | Resolved | [response-shapes.md](api/response-shapes.md), [proposals.md](domains/proposals.md) |
| Q-031 | Session timeline visibility: are events filtered by bond-graph rules, or all-visible to session participants? The feed spec defines bond-graph visibility, but session timelines might override this for participants. | Resolved | [events-and-feeds.md](domains/events-and-feeds.md), [sessions.md](domains/sessions.md) |
| Q-032 | Rejected proposals in feed: visible to the player who submitted them? Rejection creates no approval event. Are rejected proposals only visible on the proposals list page, never in feeds? | Resolved | [events-and-feeds.md](domains/events-and-feeds.md), [proposals.md](domains/proposals.md) |
| Q-033 | `changes` vs `changes_summary` on events: when does the frontend use which? Spec says "use `changes_summary` as default." Is raw `changes` (with before/after values) ever rendered in the UI, or reserved for future use? | Resolved | [response-shapes.md](api/response-shapes.md) |

### Category 8: GM Queue & Actions (P1 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-034 | Sort order for "priority-sorted" queue — what is the actual sort key? System proposals pinned at top is clear. For player proposals: creation time (newest-first) only, or urgency weighting (e.g., stress-near-max characters first)? | Resolved | [proposals.md](domains/proposals.md), [gm-views.md](ui/gm-views.md) |
| Q-035 | System proposals (`resolve_clock`, `resolve_trauma`) have `null` calculated_effect. What does the GM queue show instead of the CalculatedEffectCard? Just the inline resolution form (bond selector / narrative textarea)? | Resolved | [response-shapes.md](api/response-shapes.md), [gm-views.md](ui/gm-views.md) |
| Q-036 | The 14 GM action types: is the valid changes field list in [response-shapes.md](api/response-shapes.md) exhaustive? The table lists 7 action types with valid fields, but the remaining 7 (`create_bond`, `retire_bond`, `create_trait`, `retire_trait`, `create_effect`, `retire_effect`, `award_xp`) have no documented valid changes fields. | Resolved | [response-shapes.md](api/response-shapes.md), [contract.md](api/contract.md) |

### Category 10: Auth & Cookies

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-037 | No explicit logout endpoint is documented. Users authenticate via magic-link cookies. How do users invalidate their session? Is `POST /me/refresh-link` (which rotates the code) the de facto logout? Or is there no logout — users just clear cookies? | Resolved | [auth.md](architecture/auth.md), [contract.md](api/contract.md) |
| Q-038 | Auth retry on `GET /me` failure: max retries, backoff strategy, UX when recovery repeatedly fails? The spec says "show offline error page + retry button" but no retry limits or backoff. Could the user see an infinite retry loop? | Resolved | [api-client.md](architecture/api-client.md), [auth.md](architecture/auth.md) |
| Q-039 | Login code format: length, case-sensitivity, input masking? The login page has a code input form but the code format is undefined. Is it a UUID, a short alphanumeric string, a word-based phrase? This affects input field UX (width, keyboard type, paste handling). | Resolved | [auth.md](architecture/auth.md), [routing.md](architecture/routing.md) |

### Category 9: UI/UX Gaps (P1 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-040 | Mobile nav: GM has 7+ items but spec says 5-item bottom nav. Does the 5th item navigate to a "More" page, or open a sub-menu overlay? Which 5 items are primary for GM on mobile? | Resolved | [routing.md](architecture/routing.md), [gm-views.md](ui/gm-views.md) |
| Q-041 | Bidirectional bond display: clicking a bond from either character sheet navigates where? To the other character's detail page? To a bond detail page (which doesn't exist in the route inventory)? | Resolved | [bonds.md](domains/bonds.md), [routing.md](architecture/routing.md) |

### Category 14: Visibility & Permissions

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-042 | Player clicks entity link to an object filtered by bond-graph visibility — does the API return 404 or a minimal/sanitized response? This determines whether the frontend needs a "you don't have access" state vs a standard 404 page. | Resolved | [bonds.md](domains/bonds.md), [routing.md](architecture/routing.md) |
| Q-043 | Can a player see another character's feed/skills/stats in the world browser? Detail pages are shared with `isGm` controlling edit buttons. But does the API return full data for characters outside bond-graph range, or only characters the player can "see"? | Resolved | [player-views.md](ui/player-views.md), [response-shapes.md](api/response-shapes.md) |
| Q-044 | GM character duality: can a GM submit proposals as their own character AND approve them? The GM has a character page and can own a character. Do they review their own proposals in the queue, or are GM proposals auto-approved? | Resolved | [routing.md](architecture/routing.md), [proposals.md](domains/proposals.md) |
| Q-045 | Visibility overrides on stories: `visibility_overrides: unknown[]` in response-shapes.md. What is the shape of each override? How do players opt in? Is it a list of character IDs, user IDs, or role-based rules? | Resolved | [response-shapes.md](api/response-shapes.md), [stories.md](domains/stories.md) |
| Q-046 | Duplicate bonds: can a character create 2 bonds to the same target? The bond spec defines max 8 PC bond slots but doesn't address uniqueness per target. If a player proposes `new_bond` to an already-bonded character, does the API reject? | Resolved | [bonds.md](domains/bonds.md), [contract.md](api/contract.md) |

---

## P2 — Resolve During Implementation

### Category 3: Proposal Wizard Edge Cases (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-047 | `charge_magic` MVP scope: the magic spec says "charged-only MVP." Is the wizard step 2 form for charge_magic designed to be extensible for future `power_boost` on permanent effects, or hardcoded for charged effects only? | Resolved | [magic.md](domains/magic.md) |

### Category 5: Character Meters & Stress (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-048 | Should meter animations be disabled during 5s active-session polling? Rapid polling could trigger frequent small animations. Is there a debounce/threshold — only animate if the value actually changed? | Resolved | [characters.md](domains/characters.md), [data-fetching.md](architecture/data-fetching.md) |
| Q-049 | GM override of stress during proposal approval — does the meter animation still run from the player's perspective? The player doesn't know about the override. Should animation behavior be identical regardless? | Resolved | [characters.md](domains/characters.md), [proposals.md](domains/proposals.md) |

### Category 7: Feeds & Events (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-050 | Silent events: can the GM retroactively make a public event silent via `PATCH /events/{id}/visibility`? Making a public event silent removes it from all player feeds. What's the cache invalidation strategy? | Resolved | [events-and-feeds.md](domains/events-and-feeds.md), [data-fetching.md](architecture/data-fetching.md) |

### Category 8: GM Queue & Actions (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-051 | Can a GM action in a batch include a rider event? Or are riders exclusively tied to proposal approvals? The rider spec ties them to approvals, but batch GM actions might want similar "secondary effect" capability. | Resolved | [response-shapes.md](api/response-shapes.md), [gm-views.md](ui/gm-views.md) |

### Category 9: UI/UX Gaps (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-052 | Location presence tier labels: server-generated strings or frontend-hardcoded? The location spec says "use API-provided strings" but the response shape doesn't include labels in the presence tier structure. Are they `{common, familiar, known}` keys that the frontend maps to display labels? | Resolved | [locations.md](domains/locations.md), [response-shapes.md](api/response-shapes.md) |
| Q-053 | Empty states: should each empty state have unique copy per context ("No proposals yet — create one!", "No events in this feed", "No bonds — propose one!"), or is generic copy acceptable for MVP? | Resolved | [components.md](ui/components.md) |

### Category 10: Auth & Cookies (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-054 | Cookie max-age: the auth spec states 1 year. Is this confirmed by the backend implementation? If the backend uses a shorter max-age, session-expiry handling needs adjustment. | Resolved | [auth.md](architecture/auth.md) |

### Category 11: Data Fetching & Caching

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-055 | Active Session Boost: what if multiple sessions are somehow active (backend bug)? Does `useActiveSession()` pick the first, throw, or handle gracefully? The session spec says 409 prevents it, but defensive coding may be needed. | Resolved | [data-fetching.md](architecture/data-fetching.md), [sessions.md](domains/sessions.md) |
| Q-056 | Cache invalidation: can we use response data from 201 POST responses to update the cache directly (avoiding an extra GET), or must we always refetch? TanStack Query supports mutation response cache updates. | Resolved | [data-fetching.md](architecture/data-fetching.md) |
| Q-057 | Pagination: ULID-based cursors are lexicographic. If items are inserted or deleted between pages, the cursor might skip or duplicate items. Is this acceptable for MVP, or do we need deduplication? | Resolved | [data-fetching.md](architecture/data-fetching.md), [glossary.md](glossary.md) |
| Q-058 | Polling transition when session ends: do intervals jump back to normal (10/15/20s) immediately on the next refetch, or is there a transition delay? Does `useActiveSession()` detect the status change and update intervals in the same render cycle? | Resolved | [data-fetching.md](architecture/data-fetching.md) |

### Category 13: Testing Strategy (P2 portion)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-059 | Polling in tests: disable polling in the test environment, or use MSW with fake timers? Polling during component tests could cause flaky async behavior. The testing spec doesn't address this. | Resolved | [strategy.md](testing/strategy.md) |
| Q-060 | Vitest DOM environment: jsdom or happy-dom? happy-dom is faster but less compatible. The testing spec doesn't declare a preference. | Resolved | [strategy.md](testing/strategy.md) |
| Q-061 | Coverage targets: no minimum thresholds defined. Should there be per-layer targets (e.g., 80% unit, 60% component, critical-path-only E2E)? | Resolved | [strategy.md](testing/strategy.md) |

### Category 15: Form Validation & Error Recovery

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-062 | 422 response with no `details.fields` — fallback behavior? The error envelope has optional `details`. If absent, does the frontend show a generic "Validation failed" message, or attempt to parse the `message` string? | Resolved | [response-shapes.md](api/response-shapes.md), [api-client.md](architecture/api-client.md) |
| Q-063 | Retry logic: which operations are retryable? The api-client spec says "no middleware/retries." Is the MVP truly zero-retry for all operations, including safe reads? | Resolved | [api-client.md](architecture/api-client.md) |
| Q-064 | Form validation rules per action type are spread across [proposals.md](domains/proposals.md), [contract.md](api/contract.md), and [response-shapes.md](api/response-shapes.md). Should they be centralized into a single validation reference before implementation? | Resolved | [proposals.md](domains/proposals.md), [contract.md](api/contract.md), [response-shapes.md](api/response-shapes.md) |

---

## P3 — Enhancement / Future

### Category 9: UI/UX Gaps (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-065 | Deep linking into proposal wizard with pre-filled state (e.g., `/proposals/new?action=use_magic&stat=being`). Useful for shortcuts from character sheet. Worth supporting in MVP? | Deferred | [proposals.md](domains/proposals.md), [routing.md](architecture/routing.md) |
| Q-066 | Tablet responsive behavior (768-1024px) not specified. The spec defines mobile (<768px) and desktop (>=768px). Content layouts may need a middle ground at tablet sizes. | Resolved | [routing.md](architecture/routing.md), [design-system.md](ui/design-system.md) |

### Category 13: Testing Strategy (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-067 | E2E test coverage missing for: world browser, GM actions, clocks, templates, invites. The testing spec says "critical-paths-only E2E" — are these considered non-critical for MVP? | Deferred | [strategy.md](testing/strategy.md) |
| Q-068 | Accessibility automation gaps: no color contrast checks, no keyboard trap detection, axe-core in component tests only. Should WCAG AA compliance be a hard requirement, or best-effort for MVP? | Deferred | [strategy.md](testing/strategy.md), [design-system.md](ui/design-system.md) |

### Category 15: Form Validation & Error Recovery (continued)

| ID | Question | Status | Refs |
|----|----------|--------|------|
| Q-069 | Offline handling not specified. No service worker, no optimistic offline queue. Should the app detect offline state and show a banner, or is this out of scope for MVP? | Deferred | [overview.md](architecture/overview.md), [data-fetching.md](architecture/data-fetching.md) |
