# Testing Strategy

> Status: Draft
> Last verified: 2026-03-23

## Test Layer Stack

| Layer | Framework | Target | Location |
|-------|-----------|--------|----------|
| Unit | Vitest | Pure logic: sacrifice math, dice pools, constants | `src/__tests__/unit/` |
| Component | Vitest + React Testing Library | Isolated component rendering and interaction | `src/__tests__/components/` |
| Integration | Vitest + RTL + MSW | Full page rendering with mocked API | `src/__tests__/integration/` |
| E2E | Playwright | Browser-level user journeys | `e2e/` |
| Accessibility | axe-core (integrated) | ARIA compliance, keyboard navigation | Within component and E2E layers |

## MSW (Mock Service Worker) Setup

### Handler Organization

```
src/mocks/
  handlers/
    auth.ts, characters.ts, proposals.ts, sessions.ts,
    groups.ts, locations.ts, stories.ts, events.ts,
    feeds.ts, gm.ts, clocks.ts, traitTemplates.ts
  browser.ts         # setupWorker (dev)
  node.ts            # setupServer (tests)
  fixtures/
    users.ts, characters.ts, proposals.ts, sessions.ts,
    bonds.ts, clocks.ts
```

### Handler Requirements

- Every handler must verify `credentials: 'include'` (return 401 if cookie absent)
- Paginated endpoints must return `{items, next_cursor, has_more}`
- Error handlers must return the exact error envelope: `{error: {code, message, details}}`
- Handlers are overridable per-test via `server.use()`

### Pagination Helper

```typescript
function paginatedList<T>(items: T[], hasMore = false): PaginatedResponse<T> {
  return { items, next_cursor: hasMore ? '01NEXTCURSOR000000000' : null, has_more: hasMore }
}
```

## Critical Test Scenarios

### Priority 1: Auth Flows

- `GET /me` unauthenticated → redirect to `/login`
- `POST /auth/login` with valid user code → cookie set, redirect by role
- `POST /auth/login` with invite code → empty response `{}` → show join form
- `POST /auth/login` with unknown code → 404 → error message
- `POST /game/join` → creates user+character → redirect to feed
- `POST /setup` when GM exists → 409 → "already set up"
- Player visiting GM route → redirect
- GM accessing player routes → allowed

### Priority 2: Proposal State Machine

- Submit valid `use_skill` → status `pending`, `calculated_effect` returned
- GM approves → status `approved`, effects applied, event created
- GM rejects with note → status `rejected`, note visible to player
- Player edits rejected proposal → recalculates
- Approve already-approved → 409 `proposal_not_pending`
- System `resolve_trauma` auto-generated on stress max

### Priority 3: Role-Based Visibility

- Player sees only own proposals
- Player cannot see silent/gm_only events
- GM sees all proposals and events
- `POST /gm/actions` returns 403 for players
- Invite endpoints return 403 for players

### Priority 4: Character Mutations

- Find time: succeeds when plot >= 3, fails with `insufficient_resources` when < 3
- Recharge trait: succeeds when FT >= 1 and charge < 5
- Maintain bond: restores to effective max (5 - degradation_count)
- Use effect at 0 charges: fails
- Stress increment to effective max: triggers resolve_trauma

## Edge Cases

### Trauma & Stress

- Stress at `effective_stress_max - 1` → one more increment triggers trauma
- MeterBar renders effective_max (not hardcoded 9)
- Character with multiple traumas: effective max shrinks correctly

### Bond Degradation

- Bond at 1 charge → strain → charges reset to effective max, degradation increments
- Bond at degradation_count = 5 → effective max = 0
- ChargeDots renders three visual states (filled, empty, degraded)
- Maintain bond on a bond already at effective max — confirm behavior

### Magic Sacrifice Math

- Tiered formula: 3 dice costs 6 (3+2+1), 4 dice costs 10 (4+3+2+1)
- Stress sacrifice: 1 stress = 2 gnosis equivalent
- FT sacrifice: 1 FT = (3 + lowest_magic_stat) gnosis equivalent
- Mixed sacrifices: total computed correctly
- Bond sacrifice: 10 gnosis equivalent, bond retires

### Session Lifecycle

- Start when another session active → 409
- End an ended session → 400
- Delete active session → 400
- `additional_contribution` update after start → 400

### Pagination

- Last page: `has_more: false` → "Load More" disappears
- Empty list: `items: []` → empty state, not spinner
- `limit` > 100 → 400

## Accessibility Requirements

### Meter Bars

- `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax` (dynamic for stress)
- `aria-label="Stress: 5 of 8"` — includes name and values
- Color alone must not be the only signal

### Charge Dots

- Wrapping `role="group"` with `aria-label="Trait charges: 3 of 5"`
- Individual dots are `aria-hidden="true"`

### Clock SVG

- `role="img"` with `aria-label="Clock: [name]. Progress: 3 of 8 segments"`

### Proposal Wizard

- Step indicator uses `aria-current="step"` on active step
- All form fields have associated labels
- Error messages use `aria-describedby`
- Submit button has `aria-disabled="true"` during submission
- Full keyboard navigation: Tab through fields, Enter to advance

### Navigation Badges

- `aria-label="Pending proposals: 3"` not just the number

### Toasts

- `aria-live="polite"` (success) or `aria-live="assertive"` (error)
- Auto-dismiss pauses on focus/hover

### axe-core Integration

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

const { container } = render(<MeterBar ... />)
expect(await axe(container)).toHaveNoViolations()
```

## Cross-Role Test Matrix

| Feature | Player Can | Player Cannot | GM Can |
|---------|-----------|---------------|--------|
| View own proposals | All statuses | — | — |
| View others' proposals | — | Access at all | See all |
| Approve/reject | — | 403 | Full |
| See silent events | — | See in feed | Silent feed |
| GM actions | — | 403 | Full |
| Generate invites | — | 403 | Full |
| Create game objects | — | 403 on mutations | Full |
| Player routes | Full | — | Full (GM can also) |
| GM routes | — | Redirect | Full |

## Test Data Factory

### Canonical Personas

```
GM:           { id: "01GM...", role: "gm", display_name: "The GM", character_id: null }
GM+Character: { id: "01GM...", role: "gm", display_name: "GM-Player", character_id: "01CH_GM..." }
Player A:     { id: "01PL...", role: "player", display_name: "Alice", character_id: "01CH_A..." }
Player B:     { id: "01PL...", role: "player", display_name: "Bob", character_id: "01CH_B..." }
```

### Key Fixtures

- **characterFull**: Healthy PC — stress: 3, FT: 10, plot: 2, gnosis: 15, mixed traits/bonds/effects
- **characterStressed**: PC near trauma — stress: 7, effective_stress_max: 8
- **characterMaxEffects**: PC at 9/9 active effects
- **characterSimplified**: NPC — no meters, skills, magic stats
- **proposalPending**: use_skill, status: pending
- **proposalApproved**: approved with event_id
- **proposalRejected**: rejected with gm_notes
- **proposalSystem**: resolve_trauma, origin: system
- **sessionDraft/Active/Ended**: One fixture per lifecycle state
- **bondHealthy/Degraded/AtZero/Trauma**: Bonds in various states
- **clockInProgress/NearComplete/Completed**: Clocks in various states

All fixtures use deterministic hardcoded ULIDs (not random) for readable, reproducible tests.
