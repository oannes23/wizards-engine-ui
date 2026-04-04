# Review Checkpoints

> Defines when each reviewer agent runs, what they check, and pass criteria.

## Review Types

| Type | Count | Purpose | Blocking? |
|------|-------|---------|-----------|
| **Gate** | 4 | Phase boundary review — all reviewers, must pass before next phase | Yes |
| **Inline** | 3 | Mid-epic review at high-risk points — targeted reviewers | Non-blocking (issues logged, fixed in next batch) |
| **Final** | 1 | End-of-project comprehensive review | Yes (for release) |

## Reviewer Agent Execution Order (at Gates)

When running a gate review, execute reviewers in this order:

1. **code-reviewer** first — catches bugs and implementation issues
2. **architect** second — catches structural issues
3. **game-designer** third — validates game mechanics against spec
4. **qa-engineer** fourth — runs test suite, reports coverage
5. **tech-writer** last — updates specs to reflect any changes from review findings

This order ensures that code issues are caught before structural review, and structural issues before mechanics validation. The tech-writer runs last to capture all changes.

---

## Gate Reviews

### GATE-0: Foundation Review

> **After**: QA-1 | **Before**: Phase 1

#### code-reviewer

**Scope**: Batches A, B, C (stories 0.1.1–0.1.8)

**Checklist:**
- [ ] `apiFetch` includes `credentials: 'include'` on ALL requests
- [ ] `ApiError` class correctly parses error envelope `{error: {code, message, details}}`
- [ ] 401 handling wired to QueryClient `onError` (not in apiFetch)
- [ ] Base URL sourced from `NEXT_PUBLIC_API_BASE_URL` environment variable
- [ ] No hardcoded URLs or API paths outside service modules
- [ ] TypeScript strict mode enabled, no `any` types
- [ ] String literal unions used (not TypeScript enums)
- [ ] File naming follows `architecture/naming-conventions.md`
- [ ] No secrets or credentials in committed files

#### architect

**Scope**: Project structure and layer boundaries

**Checklist:**
- [ ] Directory structure matches `architecture/overview.md` code layers
- [ ] `lib/api/` contains only client + services (no hooks, no components)
- [ ] `lib/hooks/` contains only TanStack Query wrappers
- [ ] `components/ui/` contains only presentation primitives (no API imports)
- [ ] Query key factory exists at `src/lib/hooks/query-keys.ts`
- [ ] Barrel exports (`index.ts`) used correctly in feature modules
- [ ] No circular imports between layers
- [ ] AuthProvider is the ONLY React Context (no other global state)

#### game-designer

**Scope**: UI primitives accuracy

**Checklist:**
- [ ] MeterBar colors match spec: stress `#e05545`, FT `#34d399`, plot `#f59e0b`, gnosis `#a78bfa`
- [ ] MeterBar ranges: stress 0–9, FT 0–20, plot 0–5, gnosis 0–23
- [ ] MeterBar supports `effectiveMax` (for stress reduced by trauma)
- [ ] ChargeDots renders three states: filled (remaining), empty (spent), degraded (permanently lost)
- [ ] ClockBar renders as linear segmented bar with N segments, M filled
- [ ] Game constants match FRONTEND_SEED.md: STRESS_MAX 9, FREE_TIME_MAX 20, PLOT_MAX 5, GNOSIS_MAX 23, PC_BOND_LIMIT 8, CHARGE_MAX 5, MAX_ACTIVE_EFFECTS 9

#### tech-writer (TW-1)

**Scope**: Spec updates for known discrepancies

**Tasks:**
- [ ] Update `api/response-shapes.md`: `FeedStoryEntry` uses `entry_text` (not `text`)
- [ ] Add note about `PlayerResponse.is_active` field in `api/response-shapes.md`
- [ ] Add note about story owner `{type, id}` (no `name`) in `domains/stories.md`
- [ ] Update MASTER.md: mark Phase 0 specs as "Verified against implementation"
- [ ] Update PROGRESS.md: mark Phase 0 stories complete

---

### GATE-1: Core Display Review

> **After**: QA-2, QA-3, Inline-1 | **Before**: Phase 2

#### code-reviewer

**Scope**: Batches D–H (stories 1.1.1–1.1.6, 1.2.1–1.2.9, 2.3.1–2.3.4)

**Checklist:**
- [ ] Auth flow: login → cookie set → role redirect works for all paths (user, invite, unknown)
- [ ] 401 recovery: expired cookie → redirect to `/login` without infinite loop
- [ ] CORS: `credentials: 'include'` verified on all auth-related API calls
- [ ] Route protection: unauthenticated → `/login`, player → can't access GM routes, GM → can access player routes
- [ ] Character data hooks follow naming: `useCharacter()`, `useDirectAction{Name}()`
- [ ] Direct action mutations use mutation hooks with proper invalidation
- [ ] Feed polling pauses when tab hidden, resumes on focus
- [ ] Cursor pagination uses `useInfiniteQuery` with "Load more" pattern
- [ ] Error boundaries exist per route group

#### architect

**Scope**: Feature module structure

**Checklist:**
- [ ] `features/character/` module follows convention: `components/`, `hooks/`, `types.ts`, `index.ts`
- [ ] Character hooks compose cleanly (e.g., `useCharacter` → `useDirectActions` → mutations)
- [ ] Shared components (EntityLink, badges) in `components/ui/`, not duplicated per feature
- [ ] Feed components are generic enough to reuse across player feed, GM feed, entity feeds
- [ ] Auth context consumed correctly (not prop-drilled where context is cleaner)
- [ ] No premature abstractions (if only used once, don't abstract)

#### game-designer

**Scope**: Character sheet + feed accuracy

**Checklist:**
- [ ] Character meters display correctly with effective stress max (9 - trauma_count)
- [ ] Effective stress max minimum is 1 (not 0)
- [ ] Traits show charges via ChargeDots, recharge button disabled when FT < 1 or charges = 5
- [ ] Bonds show charges + degradation. Effective max = 5 - degradation_count
- [ ] Trauma bonds: red accent, no maintain button, shows is_trauma indicator
- [ ] Direct actions: Find Time disabled when plot < 3; Recharge Trait disabled when FT < 1 or charges = 5; Maintain Bond disabled when FT < 1 or at effective max
- [ ] Magic effects: show type (charged/permanent), charges for charged, power_level for permanent
- [ ] Skills grid: 8 canonical skills, levels 0–3
- [ ] Magic stats: 5 canonical stats, levels 0–5, XP 0–4
- [ ] Feed items correctly render events vs story entries (discriminated union)
- [ ] Starred objects toggle works with optimistic update

#### tech-writer (TW-2)

**Tasks:**
- [ ] Review `domains/characters.md` against implementation — update if diverged
- [ ] Review `domains/bonds.md` against implementation — update if diverged
- [ ] Review `domains/traits.md` against implementation — update if diverged
- [ ] Review `ui/components.md` — mark completed primitives and composites
- [ ] Update MASTER.md: mark Phase 1 specs as "Verified against implementation"
- [ ] Update PROGRESS.md: mark Phase 1 stories complete

---

### GATE-2: Core Gameplay Review

> **After**: QA-4, QA-5 | **Before**: Phase 3

#### code-reviewer

**Scope**: Batches I–N (stories 2.1.1–2.1.10, 2.2.1–2.2.6, 2.3.5–2.3.7)

**Checklist:**
- [ ] Wizard state persists across steps (WizardProvider or equivalent)
- [ ] `sessionStorage` draft persistence on step changes
- [ ] `beforeunload` + route intercept for unsaved draft warning
- [ ] Zod schemas validate all 12 action type selection payloads
- [ ] `POST /proposals/calculate` (dry-run) called at Step 3, not on submit
- [ ] 422 from calculate → navigate back to Step 2 with field-level errors
- [ ] Submit calls `POST /proposals` (separate from calculate)
- [ ] Edit flow: pre-fill wizard from existing proposal selections
- [ ] Revision count displayed on resubmitted proposals
- [ ] GM approve: quick approve (single click) + expandable options work correctly
- [ ] GM reject: rejection note saved and displayed to player
- [ ] Rider event form embedded correctly in approval flow
- [ ] System proposals: resolve_trauma has bond selector, resolve_clock has narrative textarea
- [ ] Cache invalidation: proposal approval invalidates proposals + character + summary + dashboard + feed
- [ ] Polling intervals: 15s proposals, 10s queue (5s during active session)

#### architect

**Scope**: Wizard architecture + cache strategy

**Checklist:**
- [ ] Wizard state management is clean (context or useReducer, not tangled hooks)
- [ ] SacrificeBuilder is reusable between use_magic and charge_magic
- [ ] ModifierSelector is reusable across all action types that support modifiers
- [ ] Form schemas are colocated with their form components (not centralized)
- [ ] Query key hierarchy matches `architecture/data-fetching.md` spec
- [ ] Cache invalidation ripple map is implemented (not ad-hoc per mutation)
- [ ] No over-abstraction of action type forms (similar is fine; identical should share)

#### game-designer

**Scope**: Full proposal + queue mechanics

**Checklist:**
- [ ] All 12 action types render correct selection fields:
  - use_skill: skill + modifiers + plot spend + narrative
  - use_magic: magic stat + intention + symbolism + sacrifices + modifiers
  - charge_magic: effect selector + sacrifices + modifiers
  - regain_gnosis: modifiers only
  - rest: modifiers only
  - work_on_project: story picker + narrative
  - new_trait: slot type + template + optional retire
  - new_bond: target picker + optional retire
  - resolve_trauma: bond selector (GM inline)
  - resolve_clock: narrative (GM inline)
- [ ] Modifier stacking enforced: max 1 core trait + 1 role trait + 1 bond = +3d
- [ ] Sacrifice math correct: gnosis 1:1, stress 1:2, FT 1:(3+lowest_magic_stat), bond/trait flat 10
- [ ] Tiered dice conversion: N dice costs N*(N+1)/2 gnosis equivalent
- [ ] SacrificeBuilder shows live running total
- [ ] Bond/trait sacrifice has confirmation dialog (permanent action)
- [ ] Same bond/trait CAN be used as both modifier AND sacrifice in same proposal
- [ ] Session actions disabled when no active session
- [ ] Downtime actions disabled when FT = 0
- [ ] GM quick approve is single-click (most common path)
- [ ] System proposals pinned at top of queue with urgency indicators

#### tech-writer (TW-3)

**Tasks:**
- [ ] Review `domains/proposals.md` against implementation — update if diverged
- [ ] Review `domains/magic.md` against implementation — update if diverged
- [ ] Review `domains/events-and-feeds.md` against implementation — update if diverged
- [ ] Document actual GM override field names if different from spec
- [ ] Update `ui/components.md` — mark completed composites
- [ ] Update MASTER.md and PROGRESS.md

---

### GATE-3: World & Management Review

> **After**: QA-6, QA-7 | **Before**: E2E tests

#### code-reviewer

**Scope**: Batches O–U (all Phase 3 stories)

**Checklist:**
- [ ] Entity detail pages are role-aware (isGm prop, not role string checks)
- [ ] Bond-distance visibility gating: full detail ≤ 3 hops, minimal view > 3 hops
- [ ] All CRUD forms validate required fields before submission
- [ ] Soft-delete uses ConfirmModal, calls DELETE endpoint
- [ ] Pagination works on all list views (characters, groups, locations, stories, sessions, clocks, templates)
- [ ] GM action request builders match backend discriminated schemas (not generic envelope)
- [ ] Batch GM actions: validation errors mapped to indices
- [ ] Session lifecycle: start distributes FT/Plot, end clamps Plot to 5
- [ ] Contribution toggle disabled after session started
- [ ] Story entry CRUD: permissions checked (owners/GM can edit/delete)
- [ ] `useEntityName()` hook correctly resolves story owner names

#### architect

**Scope**: Entity pattern reuse + GM action DRY

**Checklist:**
- [ ] Entity detail pages share a common layout pattern (not 4 completely different implementations)
- [ ] Entity list pages share search/filter/pagination patterns
- [ ] GM CRUD forms share a common form layout pattern
- [ ] GM action forms grouped sensibly (shared entity picker, shared narrative input)
- [ ] No excessive DRY (14 slightly different forms is OK; 14 identical forms is not)
- [ ] Entity-scoped feeds reuse FeedList component
- [ ] PresenceTiers, BreadcrumbNav are proper shared components

#### game-designer

**Scope**: World browser + GM tools + sessions

**Checklist:**
- [ ] Bond-distance visibility: 1-hop "Commonly present", 2-hop "Often present", 3-hop "Sometimes present" with opacity degradation
- [ ] Location breadcrumbs truncate at 3+ levels
- [ ] Group members derived from bonds (not stored list)
- [ ] Clock near-completion highlight at >75% progress
- [ ] Clock completion triggers system proposal (displayed correctly)
- [ ] All 14 GM action types produce correct UI:
  - modify_character: delta/set per meter
  - modify_group: tier change
  - modify_location: parent change
  - modify_clock: progress advancement
  - create/modify/retire_bond
  - create/modify/retire_trait
  - create/modify/retire_effect
  - award_xp: character + magic stat + amount
- [ ] Session start: FT distributed based on time_now delta, Plot +1 base + 2 if contribution
- [ ] Session end: Plot clamped to 5
- [ ] GM dashboard: pending proposals, PC summaries, near-completion clocks, stress proximity
- [ ] Story entries: newest-first journal style, always-visible input textarea

#### tech-writer (TW-4)

**Tasks:**
- [ ] Full spec sync pass — all domain specs reviewed against implementation
- [ ] Add `is_active: bool` to PlayerResponse in `api/response-shapes.md`
- [ ] Document `useEntityName()` hook pattern for story owner resolution
- [ ] Review `ui/gm-views.md` and `ui/player-views.md` against implementation
- [ ] Update `ui/components.md` — all components should be marked complete
- [ ] Update `glossary.md` if new terms emerged during implementation
- [ ] Final MASTER.md and PROGRESS.md update

---

## Inline Reviews

### Inline-1: Character Mechanics

> **After**: Batch G + QA-3 | **Non-blocking**

| Reviewer | Focus |
|----------|-------|
| game-designer | Meter rendering, charge/degradation display, direct action enable/disable logic |
| code-reviewer | Hook patterns, mutation invalidation, error handling |

**Pass criteria**: No game-mechanic inaccuracies. Code issues logged for next batch.

---

### Inline-2: Magic & Sacrifice (CRITICAL)

> **After**: Batch K | **Non-blocking but should fix before Batch L**

| Reviewer | Focus |
|----------|-------|
| game-designer | Sacrifice math correctness, exchange rates, modifier stacking, SacrificeBuilder UX |
| architect | Wizard state management, SacrificeBuilder composition, code reuse |
| code-reviewer | Zod validation, sessionStorage persistence, beforeunload handling |

**Pass criteria**: Sacrifice math must be correct (blocking if wrong). Structural issues can be deferred.

---

### Inline-3: GM Actions

> **After**: Batch R | **Non-blocking**

| Reviewer | Focus |
|----------|-------|
| architect | DRY across 14 action forms, shared primitives, batch mode state |
| game-designer | All 14 action types produce correct outcomes, entity selection UX |
| code-reviewer | Request builder type safety, error handling per action |

**Pass criteria**: All 14 action types functional. DRY issues logged for follow-up.

---

## Final Review

> **After**: QA-8 (E2E)

| Reviewer | Skill/Focus | Scope |
|----------|-------------|-------|
| game-designer | `/game-audit` | End-to-end player + GM experience walkthrough |
| architect | `/analyze-patterns` | DRY violations, boundary issues, over/under-engineering |
| code-reviewer | Full review | Security (XSS, injection), TypeScript strictness, error handling |
| qa-engineer | Coverage report | Cross-role test matrix, edge case sweep |
| tech-writer | `/sync-spec` | Final reconciliation of all specs with code |

**Pass criteria**: No blocking security issues, no game-mechanic errors, all critical paths tested.
