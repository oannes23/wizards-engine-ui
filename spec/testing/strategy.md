# Testing Strategy

> Status: Deepened
> Last verified: 2026-03-27

## Test Layer Stack

| Layer | Framework | Target | Location |
|-------|-----------|--------|----------|
| Unit | Vitest | Pure logic: sacrifice math, dice pools, constants | Colocated: `*.test.ts` next to source |
| Component | Vitest + React Testing Library | Isolated component rendering and interaction | Colocated: `*.test.tsx` next to source |
| Integration | Vitest + RTL + MSW | Full page rendering with mocked API | `src/__tests__/integration/` |
| E2E | Playwright | Browser-level user journeys (critical paths only) | `e2e/` |
| Accessibility | axe-core (integrated) | ARIA compliance, keyboard navigation | Within component and E2E layers |

## File Organization

```
src/
  components/ui/
    MeterBar.tsx
    MeterBar.test.tsx              ← component test (colocated)
  features/proposals/
    ProposalCard.tsx
    ProposalCard.test.tsx          ← component test (colocated)
    proposalMath.ts
    proposalMath.test.ts           ← unit test (colocated)
  __tests__/integration/
    auth-flow.test.tsx             ← integration tests (centralized)
    proposal-wizard.test.tsx
    session-lifecycle.test.tsx
    character-sheet.test.tsx
    gm-queue.test.tsx
  mocks/
    handlers/                      ← MSW handlers per domain
      auth.ts, characters.ts, proposals.ts, sessions.ts,
      groups.ts, locations.ts, stories.ts, events.ts,
      feeds.ts, gm.ts, clocks.ts, traitTemplates.ts
    fixtures/                      ← factory functions per domain
      users.ts, characters.ts, proposals.ts, sessions.ts,
      bonds.ts, clocks.ts, stories.ts, events.ts
    browser.ts                     ← setupWorker (dev mode)
    node.ts                        ← setupServer (tests)
e2e/
  auth-login.spec.ts               ← E2E critical paths
  proposal-flow.spec.ts
  session-flow.spec.ts
  a11y.spec.ts
```

## MSW (Mock Service Worker) Setup

### Dual Mode: Development + Testing

- **Development**: MSW runs in the browser via service worker. Activated by `NEXT_PUBLIC_MSW=true`. Full UI works without the real backend.
- **Testing**: MSW runs in Node via `setupServer`. All Vitest integration tests use MSW.
- **Production/real backend**: No MSW env var — real API calls.

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

## Test Fixtures: Factory Functions

Factory functions return complete typed objects with sensible defaults. Override any field via partial parameter. All use deterministic hardcoded ULIDs for readable, reproducible tests. One file per domain.

```typescript
// fixtures/characters.ts
export function makeCharacter(overrides?: Partial<CharacterDetailResponse>): CharacterDetailResponse {
  return {
    id: '01CHAR_DEFAULT',
    name: 'Test Character',
    detail_level: 'full',
    stress: 3,
    free_time: 10,
    plot: 2,
    gnosis: 15,
    // ... all required fields with sensible defaults
    ...overrides,
  }
}

// Usage:
makeCharacter({ stress: 8, name: 'Stressed PC' })
makeCharacter({ detail_level: 'simplified' })
```

### Canonical Personas

```
GM:           { id: "01GM...", role: "gm", display_name: "The GM", character_id: null }
GM+Character: { id: "01GM...", role: "gm", display_name: "GM-Player", character_id: "01CH_GM..." }
Player A:     { id: "01PL_A...", role: "player", display_name: "Alice", character_id: "01CH_A..." }
Player B:     { id: "01PL_B...", role: "player", display_name: "Bob", character_id: "01CH_B..." }
```

### Key Fixture Presets

- **characterFull**: Healthy PC — stress: 3, FT: 10, plot: 2, gnosis: 15, mixed traits/bonds/effects
- **characterStressed**: PC near trauma — stress: 7, effective_stress_max: 8
- **characterMaxEffects**: PC at 9/9 active effects
- **characterSimplified**: NPC — no meters, skills, magic stats
- **proposalPending**: use_skill, status: pending, with calculated_effect
- **proposalApproved**: approved with calculated_effect and costs applied
- **proposalRejected**: rejected with rejection_note
- **proposalSystem**: resolve_trauma, origin: system
- **sessionDraft/Active/Ended**: One fixture per lifecycle state
- **bondHealthy/Degraded/AtZero/Trauma**: Bonds in various states
- **clockInProgress/NearComplete/Completed**: Clocks in various states

## Integration Tests: Per-Page User Stories

One test file per page/feature. Each test describes a user story. Tests render the full page component with providers (TanStack Query, auth context) and MSW. Focus on user-visible behavior.

```typescript
// integration/proposal-wizard.test.tsx
describe('Proposal Wizard', () => {
  it('submits use_skill proposal', async () => {
    render(<ProposalWizardPage />, { wrapper: TestProviders })
    // Step 1: select use_skill
    // Step 2: fill skill, add modifier
    // Step 3: review and submit
    // Assert: success toast, redirect
  })

  it('shows rejection note when revising', ...)
  it('disables downtime actions when FT is 0', ...)
  it('disables session actions when no active session', ...)
})
```

## E2E Tests: Critical Paths Only

MVP E2E covers 3-4 critical user journeys plus an accessibility sweep:

| Test File | Scenarios |
|-----------|-----------|
| `auth-login.spec.ts` | Magic link login → feed; invite code → join flow |
| `proposal-flow.spec.ts` | Player submits use_skill → GM approves from queue |
| `session-flow.spec.ts` | GM creates + starts session → player joins via banner |
| `a11y.spec.ts` | axe-core scan on feed page, character sheet, GM queue |

E2E runs against MSW (no real backend needed). All tests in `e2e/` directory.

## Accessibility Testing: axe in Component Tests

- Dedicated a11y test per UI primitive: MeterBar, ChargeDots, ClockBar, Modal, etc.
- Dedicated a11y test per key composite: ProposalCard, FeedItem, NavBar
- E2E a11y sweep on critical pages (feed, character sheet, GM queue)
- Not in every test — one dedicated `it('passes axe check')` per component

```typescript
// MeterBar.test.tsx
it('passes axe accessibility check', async () => {
  const { container } = render(
    <MeterBar label="Stress" value={5} max={9} effectiveMax={8} color="meter-stress" />
  )
  expect(await axe(container)).toHaveNoViolations()
})
```

## CI Pipeline Layers

Spec the order and requirements; CI tool is implementation choice:

1. `pnpm lint && pnpm tsc --noEmit` — lint + type-check
2. `pnpm test:unit` — Vitest unit tests
3. `pnpm test:integ` — Vitest integration tests (+ MSW)
4. `pnpm test:e2e` — Playwright E2E (+ MSW)

All layers must pass. E2E uses MSW, no real backend needed in CI.

---

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
- `POST /proposals/calculate` returns effect without creating proposal
- GM approves → status `approved`, effects applied, event created
- GM rejects with note → status `rejected`, note visible to player
- Player edits rejected proposal → recalculates via PATCH
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
- Maintain bond: restores to effective max (5 - degradations)
- Use effect at 0 charges: fails
- Stress increment to effective max: triggers resolve_trauma

## Edge Cases

### Trauma & Stress
- Stress at `effective_stress_max - 1` → one more increment triggers trauma
- MeterBar renders effective_max (not hardcoded 9)
- Character with multiple traumas: effective max shrinks correctly

### Bond Degradation
- Bond at 1 charge → use → charges reset to effective max, degradation increments
- Bond at degradations = 5 → effective max = 0
- ChargeDots renders three visual states (filled, empty, degraded)

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
- Last page: `has_more: false` → "Load more" disappears
- Empty list: `items: []` → EmptyState component, not spinner
- `limit` > 100 → 400

## Accessibility Requirements

### Meter Bars
- `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax` (dynamic for stress)
- `aria-label="Stress: 5 of 8"` — includes name and values

### Charge Dots
- Wrapping `role="group"` with `aria-label="Trait charges: 3 of 5"`
- Individual dots are `aria-hidden="true"`

### Clock Bar
- `role="progressbar"` with `aria-valuenow`, `aria-valuemax`, `aria-label="Clock: [name]. Progress: 3 of 8"`

### Proposal Wizard
- Step indicator uses `aria-current="step"` on active step
- All form fields have associated labels
- Error messages use `aria-describedby`
- Full keyboard navigation: Tab through fields, Enter to advance

### Navigation Badges
- `aria-label="Pending proposals: 3"` not just the number

### Toasts
- `aria-live="polite"` (success) or `aria-live="assertive"` (error)
- Auto-dismiss pauses on focus/hover

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

---

## Interrogation Decisions

### Test Location: Colocated + E2E Separate

- **Decision**: Unit and component tests colocated next to source (`.test.ts`/`.test.tsx`). Integration tests centralized in `src/__tests__/integration/`. E2E in `e2e/`. Mocks/fixtures centralized in `src/mocks/`.
- **Rationale**: Colocated tests are discoverable — you see the test when you open the source file. Integration tests are cross-cutting (multiple components/pages) so centralized makes sense.
- **Implications**: Vitest config with `include: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**/*.test.{ts,tsx}']`.

### MSW: Dual Mode (Dev + Test)

- **Decision**: MSW runs in browser during development (`NEXT_PUBLIC_MSW=true`) and in Node for automated tests. Full UI development possible without the real backend.
- **Rationale**: Parallel development — frontend can be built and tested entirely offline. Dev mode catches API shape mismatches early.
- **Implications**: `browser.ts` registers service worker conditionally. App entry point checks env var. MSW handlers must be comprehensive enough for full-app dev mode.

### E2E Scope: Critical Paths Only

- **Decision**: MVP E2E covers 3-4 critical user journeys (auth, proposal flow, session flow) plus an accessibility sweep. Everything else covered by integration tests.
- **Rationale**: E2E tests are slow, brittle, and expensive to maintain. Integration tests with MSW provide sufficient confidence for most features. E2E reserved for the flows that cross many boundaries.
- **Implications**: ~4 E2E test files. E2E runs against MSW (no real backend in CI). Expand E2E coverage post-MVP as needed.

### Fixtures: Factory Functions

- **Decision**: Factory functions returning complete typed objects with sensible defaults. Override via partial parameter. Deterministic ULIDs. One file per domain.
- **Rationale**: Factory functions are the simplest approach that supports per-test customization. Deterministic IDs make tests readable and reproducible. Type safety catches fixture drift.
- **Implications**: `src/mocks/fixtures/` directory with `make*()` functions per entity type.

### Integration Tests: Per-Page User Stories

- **Decision**: One integration test file per page/feature. Tests describe user stories and render full page components with providers and MSW. Focus on user-visible behavior, not implementation details.
- **Rationale**: User-story-scoped tests are resilient to refactoring (test behavior, not implementation). Per-page scoping keeps files focused.
- **Implications**: Shared `TestProviders` wrapper with TanStack QueryClient and auth context. Each test file imports page components directly.

### CI: Spec Layers Only

- **Decision**: Spec the pipeline order (lint → unit → integration → E2E) and that all layers must pass. Don't specify CI tool.
- **Rationale**: CI tool is an infrastructure choice. The spec should define what runs, not how.
- **Implications**: `package.json` scripts: `test:unit`, `test:integ`, `test:e2e`. CI config is implementation-time.

### Accessibility: axe in Component Tests

- **Decision**: Dedicated a11y test per UI primitive and key composite. E2E a11y sweep on critical pages. Not in every test.
- **Rationale**: Component-level a11y catches issues at the source with fast feedback. E2E catches page-level integration issues. Running axe in every test is noisy and slow.
- **Implications**: `jest-axe` (or vitest-axe equivalent) in devDependencies. ARIA patterns defined per-component in the spec above.

### Polling in Tests

- **Decision**: Disable polling in test environment. Set `refetchInterval: false` and `staleTime: Infinity` in test QueryClient config. Tests control refetches explicitly.
- **Rationale**: Polling during component tests causes flaky async behavior. Explicit control is more reliable.

### DOM Environment

- **Decision**: Use happy-dom for Vitest. Switch to jsdom only if Radix UI compatibility issues arise.
- **Rationale**: happy-dom is faster. Most component tests don't need full jsdom fidelity.

### Coverage Targets

- **Decision**: Soft targets: 80% unit, 60% component. Reports in PR reviews but no CI gates.
- **Rationale**: Focus on testing critical paths rather than chasing numbers. Adjust after Phase 1 experience.
