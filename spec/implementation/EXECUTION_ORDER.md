# Execution Order

> Detailed batch definitions with prerequisites, parallelism notes, and context for the implementing agent.

## Reading Guide

Each batch lists:
- **Stories**: Which stories to implement (in recommended order)
- **Prereqs**: Which batches must be complete before starting
- **Parallel with**: Other batches that can run simultaneously (if resources allow)
- **Agent**: Which OPS agent runs this batch
- **Key specs**: Primary spec documents the agent should read
- **Followed by**: What happens after this batch (QA, review, or next batch)

---

## Phase 0 — Foundation

### Batch A: Project Bootstrap

| | |
|---|---|
| **Stories** | 0.1.1, 0.1.2, 0.1.3 |
| **Prereqs** | None — this is the starting point |
| **Parallel with** | Nothing (must complete first) |
| **Agent** | frontend-dev |
| **Key specs** | `architecture/overview.md`, `architecture/api-client.md`, `architecture/naming-conventions.md`, `api/response-shapes.md`, `ui/design-system.md` |
| **Followed by** | Batches B and C (parallel) |

**Implementation notes:**
- 0.1.1: Initialize Next.js with pnpm, TypeScript, Tailwind. Configure dark theme colors (navy/blue/teal + meter colors). Set up `src/` directory structure per `architecture/naming-conventions.md`.
- 0.1.2: Thin fetch wrapper at `src/lib/api/client.ts`. Must include `credentials: 'include'` on every request. `ApiError` class with `code`, `message`, `details`, `status`. 401 handling deferred to QueryClient (not in apiFetch).
- 0.1.3: All types from `api/response-shapes.md`. Use string literal unions (not enums). Include the `FeedItem` discriminated union. Game constants as `const` objects. **Apply discrepancy D1**: use `entry_text` not `text` for story entries.

---

### Batch B: App Shell

| | |
|---|---|
| **Stories** | 0.1.4, 0.1.5, 0.1.6, 0.1.7 |
| **Prereqs** | Batch A |
| **Parallel with** | Batch C |
| **Agent** | frontend-dev |
| **Key specs** | `architecture/auth.md`, `architecture/routing.md`, `architecture/data-fetching.md`, `ui/components.md` (NavBar section) |
| **Followed by** | Batches D, F, H (all depend on B) |

**Implementation notes:**
- 0.1.4: AuthProvider calls `GET /me` on mount with 3 retries (1s, 2s, 4s). Context exposes `user`, `isGm`, `isPlayer`, `isViewer`, `isLoading`, `characterId`. 401 sets user to null.
- 0.1.5: Radix Toast. Error: red, 6s. Success: green, 3s. `aria-live` regions. Auto-dismiss pauses on hover.
- 0.1.6: `usePolling` hook. Configurable interval. Pauses on `document.visibilityState === 'hidden'`. Resumes on focus. Stops on unmount.
- 0.1.7: Three route groups `(auth)`, `(player)`, `(gm)`. NavBar: bottom bar < 768px, top bar >= 768px. Player 5 items, GM 5 items + More dropdown. Badge support. Middleware: cookie check, role redirect.

---

### Batch C: UI Primitives

| | |
|---|---|
| **Stories** | 0.1.8 |
| **Prereqs** | Batch A (needs Tailwind config + types) |
| **Parallel with** | Batch B |
| **Agent** | frontend-dev |
| **Key specs** | `ui/components.md` (Primitives section), `ui/design-system.md`, `domains/characters.md` (meter ranges), `domains/bonds.md` (charge dots states) |
| **Followed by** | QA-1 (after both B and C complete) |

**Implementation notes:**
- MeterBar: colored bar + numeric label, `role="meter"`, `aria-valuenow`/`aria-valuemax`. Effective max for stress. Warning pulse when near max.
- ChargeDots: three states (filled, empty, degraded). `role="group"` with `aria-label`.
- ClockBar: linear segmented bar (NOT pie chart — spec says "linear segmented bar"). `role="progressbar"`.
- StatusBadge: proposal/session status with color coding.
- Modal/ConfirmModal: Radix Dialog with portal.
- StepIndicator: `aria-current="step"` on active.
- ExpandableSection, LoadMoreButton, EmptyState.

---

### QA-1: Test Infrastructure

| | |
|---|---|
| **After** | Batches A, B, C all complete |
| **Agent** | qa-engineer |
| **Key specs** | `testing/strategy.md` |
| **Followed by** | GATE-0 |

**Scope:**
- Vitest config with happy-dom, include paths for colocated + integration tests
- MSW dual setup: `src/mocks/browser.ts` (dev) + `src/mocks/node.ts` (test)
- `src/mocks/fixtures/users.ts`: `makeUser()` factory + canonical personas (GM, Player A, Player B)
- `paginatedList()` helper
- `TestProviders` wrapper (QueryClient with disabled polling + AuthProvider)
- Component tests for all primitives in 0.1.8 with axe accessibility checks
- Unit tests for `apiFetch` error parsing and 401 handling

---

### GATE-0 + TW-1: Foundation Review

| | |
|---|---|
| **After** | QA-1 |
| **Agents** | code-reviewer, architect, game-designer, tech-writer |
| **Followed by** | Phase 1 batches (D, F, H) |

See [REVIEW_CHECKPOINTS.md](REVIEW_CHECKPOINTS.md) for full protocol.

---

## Phase 1 — Core Display

### Batch D: Auth Pages

| | |
|---|---|
| **Stories** | 1.1.1, 1.1.2, 1.1.3, 1.1.4 |
| **Prereqs** | Batch B |
| **Parallel with** | Batches F, H |
| **Agent** | frontend-dev |
| **Key specs** | `architecture/auth.md`, `domains/users.md`, `ui/player-views.md` (auth section), `api/contract.md` (auth endpoints) |
| **Followed by** | Batch E |

**Implementation notes:**
- 1.1.1: Simple login page with code input field. `POST /auth/login` with code.
- 1.1.2: `/login/[code]` route auto-submits login. Branches: user code → redirect by role; invite code → redirect to `/join`; unknown → 404 error.
- 1.1.3: One-time GM bootstrap. `POST /setup`. Shows "already set up" on 409.
- 1.1.4: Join form (display_name + character_name for players, display_name only for viewers). `POST /game/join`.

---

### Batch E: Auth Completion

| | |
|---|---|
| **Stories** | 1.1.5, 1.1.6 |
| **Prereqs** | Batch D |
| **Parallel with** | Batches F, G, H (if D complete) |
| **Agent** | frontend-dev |
| **Key specs** | `domains/users.md` (profile, starred), `architecture/routing.md` (middleware) |
| **Followed by** | QA-2, then feeds into Batch I prereqs |

**Implementation notes:**
- 1.1.5: Profile page — inline display name edit, role badge, character EntityLink, starred objects list with unstar, refresh login link.
- 1.1.6: Next.js middleware — Layer 1: cookie presence check (redirect to `/login` if absent). Layout-level: role validation (player away from GM routes, etc.).

---

### QA-2: Auth Tests

| | |
|---|---|
| **After** | Batch E |
| **Agent** | qa-engineer |
| **Followed by** | Feeds into GATE-1 |

---

### Batch F: Character Sheet — Display

| | |
|---|---|
| **Stories** | 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5 |
| **Prereqs** | Batches B + C |
| **Parallel with** | Batches D, E, H |
| **Agent** | frontend-dev |
| **Key specs** | `domains/characters.md`, `domains/bonds.md`, `domains/traits.md`, `ui/player-views.md` (character sheet), `ui/components.md` (composites) |
| **Followed by** | Batch G |

**Implementation notes:**
- 1.2.3: Mobile: 5 sticky tabs (Overview, Traits & Bonds, Magic, Skills & Stats, Feed). Desktop: 3-column layout. Meters always visible in sticky header.
- 1.2.4: Core traits (2 slots), role traits (3 slots) with ChargeDots. Recharge button per trait.
- 1.2.5: PC bonds (8 slots max) with charges, degradation, trauma flag. Red accent on trauma bonds. No maintain button on trauma bonds.

---

### Batch G: Character Sheet — Mechanics

| | |
|---|---|
| **Stories** | 1.2.6, 1.2.7, 1.2.8, 1.2.9 |
| **Prereqs** | Batch F |
| **Parallel with** | Batch E (if F is done) |
| **Agent** | frontend-dev |
| **Key specs** | `domains/magic.md` (effects), `domains/characters.md` (skills, direct actions), `domains/events-and-feeds.md` |
| **Followed by** | QA-3, Inline-1 |

**Implementation notes:**
- 1.2.6: Magic effects list (max 9 active: charged + permanent). Use/Retire buttons on charged effects.
- 1.2.7: Skills 2x4 grid (8 skills, levels 0–3). Magic stats with XP progress bars (5 stats, levels 0–5, XP 0–4).
- 1.2.8: Direct action buttons — Find Time (disabled if plot < 3), Recharge Trait (disabled if FT < 1 or charges = 5), Maintain Bond (disabled if FT < 1 or at effective max), Use Effect (disabled if charges = 0), Retire Effect.
- 1.2.9: Character-scoped feed tab using FeedList component (if Batch H complete) or placeholder.

---

### QA-3: Character Tests

| | |
|---|---|
| **After** | Batch G |
| **Agent** | qa-engineer |
| **Followed by** | Inline-1 |

---

### Inline-1: Character Mechanics Review

| | |
|---|---|
| **After** | QA-3 |
| **Agents** | game-designer, code-reviewer |
| **Followed by** | GATE-1 |

---

### Batch H: Feed Components

| | |
|---|---|
| **Stories** | 2.3.1, 2.3.2, 2.3.3, 2.3.4 |
| **Prereqs** | Batch B only |
| **Parallel with** | Batches D, E, F, G (biggest parallelism opportunity) |
| **Agent** | frontend-dev |
| **Key specs** | `domains/events-and-feeds.md`, `ui/player-views.md` (feed), `ui/components.md` (feed components), `api/contract.md` (feed endpoints) |
| **Followed by** | Batch N (feed completion), used by 1.2.9 (character feed tab) |

**Implementation notes:**
- 2.3.1: FeedItem discriminated union renderer — EventCard for events, StoryEntryCard for story entries. Rider events collapsed under parent.
- 2.3.2: FeedList — cursor-based infinite query with "Load more" button. Polling (10s normal, 5s active session). Prepend new items banner.
- 2.3.3: Player feed — All tab (`GET /me/feed`) + Starred tab (`GET /me/feed/starred`). My Stories sidebar (sticky desktop, collapsible mobile).
- 2.3.4: StarToggle component + `POST/DELETE /me/starred/{type}/{id}`. Optimistic update (star/unstar only).

---

### GATE-1 + TW-2: Core Display Review

| | |
|---|---|
| **After** | QA-2, QA-3, Inline-1, Batch H |
| **Agents** | all reviewers |
| **Followed by** | Phase 2 batches (I, J) |

---

## Phase 2 — Core Gameplay

### Batch I: Proposal Foundation

| | |
|---|---|
| **Stories** | 2.1.1, 2.1.2 |
| **Prereqs** | Batches E + G (auth middleware + character data patterns) |
| **Parallel with** | Batch N (if H complete) |
| **Agent** | frontend-dev |
| **Key specs** | `domains/proposals.md`, `ui/player-views.md` (proposals), `api/contract.md` (proposal endpoints), `api/response-shapes.md` (ProposalResponse) |
| **Followed by** | Batch J |

---

### Batch J: Proposal Wizard — Simple Forms

| | |
|---|---|
| **Stories** | 2.1.3, 2.1.4, 2.1.7 |
| **Prereqs** | Batch I |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `domains/proposals.md` (action types, wizard flow), `ui/player-views.md` (wizard), `ui/components.md` (StepIndicator, ModifierSelector) |
| **Followed by** | Batch K |

**Implementation notes:**
- Build downtime forms FIRST (2.1.7 before 2.1.5) to establish ModifierSelector pattern and form layout conventions.
- 5 downtime forms: regain_gnosis, rest (simple — modifiers only), work_on_project (story picker + narrative), new_trait (template search, optional retire), new_bond (target picker, optional retire).
- WizardProvider context manages wizard state across steps.

---

### Batch K: Proposal Wizard — Complex Forms (HIGHEST RISK)

| | |
|---|---|
| **Stories** | 2.1.5, 2.1.6, 2.1.8 |
| **Prereqs** | Batch J |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `domains/proposals.md`, `domains/magic.md` (sacrifice system, exchange rates, tiered conversion), `ui/components.md` (SacrificeBuilder, DicePoolBar) |
| **Followed by** | Inline-2 (CRITICAL checkpoint) |

**Implementation notes:**
- 2.1.5: use_skill — skill selector (8 options), ModifierSelector (max 1 core + 1 role + 1 bond = +3d), plot spend selector, real-time dice pool preview, narrative textarea.
- 2.1.6: use_magic — magic stat selector, intention + symbolism textareas, embedded SacrificeBuilder, modifiers. charge_magic — effect selector then same minus stat.
- 2.1.8: SacrificeBuilder — live running total ("Total: X equiv -> N dice"), steppers for gnosis/stress/FT with current balance, binary toggles for bond/trait sacrifice with confirmation dialogs, hidden creative sacrifice link. Tiered cost: N dice = N*(N+1)/2 gnosis equiv.

---

### Inline-2: Magic & Sacrifice Review (CRITICAL)

| | |
|---|---|
| **After** | Batch K |
| **Agents** | game-designer, architect, code-reviewer |
| **Followed by** | Batch L |

---

### Batch L: Proposal Wizard — Completion

| | |
|---|---|
| **Stories** | 2.1.9, 2.1.10 |
| **Prereqs** | Batch K + Inline-2 (address any blocking findings) |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `domains/proposals.md` (review step, edit flow), `api/contract.md` (proposals/calculate, PATCH, DELETE) |
| **Followed by** | QA-4, then Batch M |

**Implementation notes:**
- 2.1.9: Step 3 calls `POST /proposals/calculate` (dry-run, no side effects). Displays CalculatedEffectCard with dice pool breakdown + resource costs. Loading state. Back button preserves state. Submit creates/finalizes via `POST /proposals`. 422 → navigate back to step 2 with field errors.
- 2.1.10: Edit opens wizard pre-filled. `PATCH /proposals/{id}`. Delete with ConfirmModal. 409 if already approved. Revision count badge on resubmitted proposals.

---

### QA-4: Proposal Tests

| | |
|---|---|
| **After** | Batch L |
| **Agent** | qa-engineer |
| **Followed by** | Batch M |

---

### Batch M: GM Queue

| | |
|---|---|
| **Stories** | 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5, 2.2.6 |
| **Prereqs** | Batch L |
| **Parallel with** | Batch N (if H complete) |
| **Agent** | frontend-dev |
| **Key specs** | `domains/proposals.md` (GM queue, approval, system proposals), `ui/gm-views.md` (queue), `ui/components.md` (GmOverridesForm, RiderEventForm) |
| **Followed by** | QA-5 (after both M and N) |

**Implementation notes:**
- System proposals pinned at top with system icon + urgency indicators.
- Player proposals sorted oldest-pending-first (FIFO fairness).
- Quick approve (single click, most common path) + expandable Options (narrative override, GM override flags, rider event, magic overrides).
- System proposals have inline forms: resolve_trauma (bond selector + trauma name/description), resolve_clock (narrative textarea).
- Tabs: Queue (pending) and Recent (approved/rejected history).

---

### Batch N: Feed Completion

| | |
|---|---|
| **Stories** | 2.3.5, 2.3.6, 2.3.7 |
| **Prereqs** | Batch H |
| **Parallel with** | Batches I–M |
| **Agent** | frontend-dev |
| **Key specs** | `domains/events-and-feeds.md`, `ui/gm-views.md` (GM feed), `api/contract.md` (feed endpoints) |
| **Followed by** | QA-5 |

**Implementation notes:**
- 2.3.5: GM event feed — All/Silent/Filter tabs. Silent tab shows `visibility: "silent"` audit log. Advanced filter panel: event type multi-select, target type, actor type, session selector, date range.
- 2.3.6: Session timeline — visibility-filtered events within a session.
- 2.3.7: Entity-scoped feeds — `/characters/{id}/feed`, `/groups/{id}/feed`, `/locations/{id}/feed`. Used in character feed tab and entity detail pages.

---

### QA-5: Queue & Feed Tests

| | |
|---|---|
| **After** | Batches M + N |
| **Agent** | qa-engineer |
| **Followed by** | GATE-2 |

---

### GATE-2 + TW-3: Core Gameplay Review

| | |
|---|---|
| **After** | QA-4, QA-5 |
| **Agents** | all reviewers |
| **Followed by** | Phase 3 batches (O, T, U) |

---

## Phase 3 — World & Management

### Batch O: World Browser — Lists

| | |
|---|---|
| **Stories** | 3.1.1, 3.1.2, 3.1.8 |
| **Prereqs** | Batches B + C |
| **Parallel with** | Batches T, U |
| **Agent** | frontend-dev |
| **Key specs** | `ui/player-views.md` (world browser), `ui/components.md` (GameObjectCard, DataTable) |
| **Followed by** | Batch P |

---

### Batch P: World Browser — Detail Pages

| | |
|---|---|
| **Stories** | 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7 |
| **Prereqs** | Batch O + Batch G (needs character components) |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `domains/characters.md`, `domains/groups.md`, `domains/locations.md`, `domains/stories.md`, `ui/player-views.md` (entity details), `ui/components.md` (PresenceTiers, BreadcrumbNav) |
| **Followed by** | Batch Q |

**Implementation notes:**
- All detail pages are role-aware (passed `isGm` prop). GM sees edit buttons.
- Bond-distance visibility gating: full detail within 3 hops, minimal view (name + description only) beyond.
- 3.1.6: **Apply discrepancy D3** — story owners return `{type, id}` without name. Build `useEntityName()` hook that checks TanStack Query cache first, falls back to minimal fetch.
- 3.1.7: Story entry CRUD — always-visible textarea for new entries, inline edit/delete per entry (owners/GM only).

---

### Batch Q: GM CRUD Forms

| | |
|---|---|
| **Stories** | 3.2.1, 3.2.2, 3.2.3, 3.2.4 |
| **Prereqs** | Batch P |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `ui/gm-views.md` (world management), `api/contract.md` (POST/PATCH endpoints) |
| **Followed by** | Batch R |

---

### Batch R: GM Actions

| | |
|---|---|
| **Stories** | 3.2.5, 3.2.6, 3.2.7, 3.2.8 |
| **Prereqs** | Batch Q |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `ui/gm-views.md` (GM actions), `api/contract.md` (GM action endpoints), `api/response-shapes.md` (GmActionType enum) |
| **Followed by** | Inline-3, then Batch S |

**Implementation notes:**
- **Apply discrepancy D4**: Backend uses per-action-type discriminated request schemas. Build type-specific request builders (not generic envelope).
- 14 action types grouped: Modify (4), Bond (3), Trait (3), Effect (3), XP (1).
- Single + batch mode toggle. Batch: fill form → "Add to Batch" → numbered list → "Execute Batch (N)".
- Partially atomic batch: per-action validation errors mapped to indices.

---

### Inline-3: GM Actions Review

| | |
|---|---|
| **After** | Batch R |
| **Agents** | architect, game-designer, code-reviewer |
| **Followed by** | Batch S |

---

### Batch S: GM Ancillary

| | |
|---|---|
| **Stories** | 3.2.9, 3.2.10 |
| **Prereqs** | Batch R |
| **Parallel with** | — |
| **Agent** | frontend-dev |
| **Key specs** | `ui/gm-views.md` (clocks, templates), `api/contract.md` (clock + template endpoints) |
| **Followed by** | QA-6 |

---

### Batch T: Sessions

| | |
|---|---|
| **Stories** | 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.5, 3.3.6 |
| **Prereqs** | Batch E (auth) + Batch G (character summaries) |
| **Parallel with** | Batches O–S |
| **Agent** | frontend-dev |
| **Key specs** | `domains/sessions.md`, `ui/gm-views.md` (sessions, dashboard), `ui/player-views.md` (sessions), `api/contract.md` (session endpoints) |
| **Followed by** | QA-7 |

**Implementation notes:**
- 3.3.4: Start confirmation modal (warns about FT/Plot distribution). End clamps Plot to 5.
- 3.3.5: Contribution toggle disabled once session started.
- 3.3.6: GM dashboard — pending_proposals count, PC summary cards (meters), near_completion_clocks, stress_proximity warnings.

---

### Batch U: Players & Invites

| | |
|---|---|
| **Stories** | 3.4.1, 3.4.2, 3.4.3, 3.4.4 |
| **Prereqs** | Batch E (auth) |
| **Parallel with** | Batches O–S, T |
| **Agent** | frontend-dev |
| **Key specs** | `domains/users.md`, `ui/gm-views.md` (players & invites), `api/contract.md` (player + invite endpoints) |
| **Followed by** | QA-7 |

**Implementation notes:**
- **Apply discrepancy D2**: Backend returns `PlayerResponse` with `is_active: bool`. Add to type, display in roster.
- 3.4.2: Generate invite (role optional, default player), list all, delete unconsumed only.
- 3.4.4: If GM has no linked character, show "Create Your Character" prompt.

---

### QA-6: World & GM Tests

| | |
|---|---|
| **After** | Batches P + S |
| **Agent** | qa-engineer |
| **Followed by** | GATE-3 (after QA-7 also complete) |

---

### QA-7: Sessions & Players Tests

| | |
|---|---|
| **After** | Batches T + U |
| **Agent** | qa-engineer |
| **Followed by** | GATE-3 |

---

### GATE-3 + TW-4: World & Management Review

| | |
|---|---|
| **After** | QA-6, QA-7 |
| **Agents** | all reviewers |
| **Followed by** | QA-8 (E2E) |

---

## Final Phase

### QA-8: E2E Tests

| | |
|---|---|
| **After** | GATE-3 |
| **Agent** | qa-engineer |
| **Key specs** | `testing/strategy.md` (E2E section) |
| **Followed by** | FINAL REVIEW |

**Scope:**
- `e2e/auth-login.spec.ts` — magic link login → feed; invite code → join flow
- `e2e/proposal-flow.spec.ts` — player submits use_skill → GM approves from queue
- `e2e/session-flow.spec.ts` — GM creates + starts session → player joins via banner
- `e2e/a11y.spec.ts` — axe-core scan on feed page, character sheet, GM queue

---

### FINAL REVIEW

| | |
|---|---|
| **After** | QA-8 |
| **Agents** | all reviewers |

**Scope:**
- game-designer: `/game-audit` — full end-to-end player and GM experience
- architect: `/analyze-patterns` — DRY violations, boundary issues
- code-reviewer: Full codebase security + quality review
- qa-engineer: Coverage report, cross-role test matrix, edge case sweep
- tech-writer: `/sync-spec` — final reconciliation of all spec documents with code
