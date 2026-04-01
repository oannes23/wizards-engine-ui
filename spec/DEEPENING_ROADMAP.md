# Spec Deepening Roadmap

> Created: 2026-03-23
> Approach: Full depth before implementation. One spec at a time.
> Focus: Edge cases, interaction design, and implementation decisions.
> Full question roadmap: See [plan file](../.claude/plans/distributed-wandering-music.md) for per-spec question tables.

## Decisions

- **Strategy**: All specs deepened before any code is written
- **Backend API**: Stable/frozen. Change requests go to [api/backend-change-requests.md](api/backend-change-requests.md) (12 CRs filed)
- **Audience**: Developer + Claude Code agent. Specs focus on decisions, edge cases, and implementation-blocking ambiguities
- **Process**: Interrogate each spec individually via `/interrogate`, going deep before moving to the next
- **Charge mechanics**: Three trait subtypes (Core/Role/Bond) share charge mechanic; bonds auto-degrade at 0 charges

## Phase 0 — Pre-Interrogation Fixes (COMPLETED 2026-03-23)

- [x] Fix meter color inconsistency (`characters.md`, `glossary.md` → match `design-system.md`)
- [x] Fix bond charge mechanics (`bonds.md` "no charge cost" → "costs 1 charge"; update glossary)
- [x] Fix glossary `degradation_count` → `degradations` (match API field name)
- [x] Fix duplicate row in `player-views.md` Complexity Ranking table
- [x] File 12 backend change requests (6 blocking, 6 high/medium)

---

## Interrogation Sequence

Optimized for dependency chains within each wave. Specs on the same round can be interrogated in parallel.

### Wave 1 — Foundation (7 specs, ~4 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 1 | [architecture/overview.md](architecture/overview.md) | 14 | Everything depends on this |
| 2 | [architecture/naming-conventions.md](architecture/naming-conventions.md) | 3 | Depends on overview |
| 2 | [ui/design-system.md](ui/design-system.md) | 9 | Depends on overview |
| 3 | [architecture/api-client.md](architecture/api-client.md) | 10 | Independent |
| 3 | [architecture/auth.md](architecture/auth.md) | 8 | Independent |
| 4 | [architecture/data-fetching.md](architecture/data-fetching.md) | 12 | Depends on api-client |
| 4 | [architecture/routing.md](architecture/routing.md) | 6 | Depends on auth |

### Wave 2 — Core Domains + API (6 specs, ~3 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 5 | [api/response-shapes.md](api/response-shapes.md) | 10 | Types drive all domain specs |
| 5 | [api/contract.md](api/contract.md) | 12 | Endpoints drive all domain specs |
| 6 | [domains/users.md](domains/users.md) | 4 | Simple, low risk |
| 6 | [domains/bonds.md](domains/bonds.md) | 10 | Independent |
| 6 | [domains/traits.md](domains/traits.md) | 6 | Independent |
| 7 | [domains/characters.md](domains/characters.md) | 13 | Benefits from bonds/traits settled |

### Wave 3 — Central Mechanic + World (7 specs, ~4 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 8 | [domains/magic.md](domains/magic.md) | 10 | Sacrifice system — prerequisite for proposals |
| 9 | [domains/sessions.md](domains/sessions.md) | 9 | Independent |
| 9 | [domains/groups.md](domains/groups.md) | 4 | Independent |
| 9 | [domains/locations.md](domains/locations.md) | 7 | Independent |
| 9 | [domains/stories.md](domains/stories.md) | 7 | Independent |
| 10 | [domains/proposals.md](domains/proposals.md) | **26** | Heavyweight — after all other domains |
| 11 | [domains/events-and-feeds.md](domains/events-and-feeds.md) | 8 | After stories |

### Wave 4 — UI Views + Testing (5 specs, ~3 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 12 | [ui/components.md](ui/components.md) | 12 | Primitives catalog — views depend on this |
| 13 | [ui/player-views.md](ui/player-views.md) | 8 | After components |
| 13 | [testing/strategy.md](testing/strategy.md) | 15 | Can parallel with player-views |
| 14 | [ui/gm-views.md](ui/gm-views.md) | 12 | After player-views |
| 14 | [glossary.md](glossary.md) | 9 terms + fixes | Final cleanup pass |

**Total: ~180 questions across 14 rounds (~25 specs)**

---

## Backend Change Requests

See [api/backend-change-requests.md](api/backend-change-requests.md) for the full list. Key blocking CRs that must be resolved before their dependent specs can be fully deepened:

| CR | Blocks | Filed |
|----|--------|-------|
| CR-001 Proposal dry-run endpoint | proposals.md (Round 10) | 2026-03-23 |
| CR-002 `calculated_effect` shape | response-shapes.md (Round 5), proposals.md | 2026-03-23 |
| CR-003 `MagicSacrifice` type | magic.md (Round 8) | 2026-03-23 |
| CR-004 `gm_overrides` flags | proposals.md (Round 10), gm-views.md | 2026-03-23 |
| CR-005 System proposal approval schemas | proposals.md (Round 10) | 2026-03-23 |
| CR-006 `POST /me/character` body | contract.md (Round 5) | 2026-03-23 |

---

## Progress Log

_Updated as each spec is interrogated._

| Date | Spec | Round | Result |
|------|------|-------|--------|
| 2026-03-23 | Phase 0 fixes | — | Completed: colors, charges, degradation field name, duplicate row, 12 CRs filed |
| 2026-03-26 | architecture/overview.md | 1 | Deepened: 12 decisions across 4 rounds — feature structure, error boundaries, env vars, loading states, layout, composition, empty states, query keys, types, utils, modals, toasts |
| 2026-03-26 | architecture/naming-conventions.md | 2 | Deepened: 2 decisions — no route-specific components, noun-based util file names |
| 2026-03-26 | ui/design-system.md | 2 | Deepened: 9 decisions — dark-only MVP, Crimson Pro + Inter fonts, Tailwind defaults (spacing/radius/shadows), Lucide icons, focus-visible, animation timing, cva variant system (size/intent/tone) |
| 2026-03-26 | architecture/api-client.md | 3 | Deepened: 5 decisions — TanStack global 401 handler, no middleware/retries, pagination helper, mutation-to-RHF error flow, canonical env var name |
| 2026-03-26 | architecture/auth.md | 3 | Deepened: 5 decisions — block children during auth load, separate GM/player layouts, branded login loading, full-page offline error, redirect+toast on session expiry |
| 2026-03-26 | architecture/data-fetching.md | 4 | Deepened: 6 decisions — key hierarchy is source of truth, pinned polling intervals (10/15/20s normal, 5s active session), useActiveSession() hook, direct-only optimistic updates, load-more button, pinned staleTime values |
| 2026-03-26 | architecture/routing.md | 4 | Deepened: 5 decisions — separate detail/edit routes, keep standalone GM actions page, entity link URL patterns, role-aware detail components (isGm prop), 5-item mobile nav |
| 2026-03-26 | api/response-shapes.md | 5 | Deepened: Full rewrite from backend Pydantic schemas. Major corrections: CharacterDetail is single type with nullable PC fields, bonds/traits/effects split into {active, past}, locations use {common, familiar, known}, BondDisplayResponse replaces BondInstanceResponse with perspective-normalized label and nullable charges, EventResponse has changes/created_objects/deleted_objects instead of payload, full calculated_effect shapes per action type, SacrificeEntry/SacrificeDetail types, GM override flags, rider event shape, error code catalog, InviteResponse. Resolved CRs: 002-006, 010-012. |
| 2026-03-26 | api/contract.md | 5 | Deepened: Added approve request shape, resolve_trauma/resolve_clock approval details, POST /me/character body, GM action change operations (delta/set only), rider event shape reference. |
| 2026-03-26 | domains/users.md | 6 | Deepened: 2 decisions — starred feed (not list), invite display with status badges |
| 2026-03-26 | domains/bonds.md | 6 | Deepened: 6 decisions — bidirectional arrow indicator, maintain disable at full, trauma red accent + badge, past bonds collapsed, bond modifier selector show-all-disable-empty, ChargeDots display-only. Resolved bidirectional bond gap. |
| 2026-03-26 | domains/traits.md | 6 | Deepened: 4 decisions — recharge disable at max, past traits collapsed, wizard trait selector with ChargeDots, template name warn on duplicate. Resolved recharge gap. |
| 2026-03-26 | domains/characters.md | 7 | Deepened: 12 decisions — 5-tab mobile layout, 3-column desktop, bar+numeric meters, gradient stress warning, inline+FAB direct actions, find-time disable at Plot<3, 2x4 skills grid with dots, magic stat level+XP bar, poll-driven meter animation, retire effect confirmation dialog, NPC simplified view, attributes resolved. |
| 2026-03-27 | domains/magic.md | 8 | Deepened: 8 decisions — live running total sacrifice builder, stepper buttons, on-toggle sacrifice confirmation, creative sacrifice hidden by default, magic modifiers documented, effect type badge+charges display, charge_magic charged-only MVP, GM effect prefill from narrative. Resolved calculated_effect and charge_magic gaps. |
| 2026-03-27 | glossary.md | 14 | Deepened: Added 5 terms (Tiered Conversion, Starred, Active Session Boost, GM Action, Entity Link). Fixed Clock definition (linear bar, not pie). Fixed Style Bonus section placement. |
| 2026-03-27 | testing/strategy.md | 13 | Deepened: 7 decisions — colocated test files, MSW dual mode (dev+test), critical-paths-only E2E, factory function fixtures, per-page integration test scoping, CI layers spec'd, axe in component tests. |
| 2026-03-27 | ui/gm-views.md | 14 | Deepened: 7 decisions — queue+PC sidebar dashboard layout, type-selector GM actions page, batch mode in MVP with add-to-list builder, two-section players+invites page, list+inline-create templates page, grid+progress-bar clocks page, GM character page confirmed. |
| 2026-03-27 | ui/player-views.md | 13 | Deepened: 4 decisions — simple profile page, reuse CalculatedEffectCard for proposal detail, confirmed 5-tab character sheet from characters.md, shared role-aware detail pages as universal pattern. Reconciled draft with deepened domain specs. |
| 2026-03-27 | ui/components.md | 12 | Deepened: 9 decisions — role-split 5-item NavBar with More dropdown, segmented MeterBar with effectiveMax, linear ClockBar (not pie), responsive DataTable, type-icon GameObjectCard, 4-tab World Browser (+Stories), EntityLink primitive, 3 modal variants, EmptyState primitive. Updated build order and composite catalog. |
| 2026-03-27 | domains/events-and-feeds.md | 11 | Deepened: 8 decisions — compact event cards with expandable detail, icon+label event type map, rider events collapsed under parent, feed+sidebar player layout, GM feed with filters+silent tab, banner+prepend new item polling, star icon on cards/headers, bottom "Load older" pagination. |
| 2026-03-27 | domains/proposals.md | 10 | Deepened: 18 decisions — grouped action cards Step 1, embedded sacrifice builder, three-slot modifier picker, sticky dice pool bar, server-calculated Step 3 review card (CR-001 now live), priority-sorted GM queue with Recent tab (paginated indefinitely), quick approve+expandable options, magic overrides sub-panel, inline system proposal forms, compact rider event selector, status-filtered player list, reopen-wizard revise flow, browser-native discard guard, expanded approved result cards, nav badge+toast notifications, select-or-propose trait/bond forms, story/clock selectors for work_on_project, FAB+nav wizard access. All 3 known gaps resolved. |
| 2026-03-27 | domains/stories.md | 9 | Deepened: 7 decisions — journal-style detail layout, always-visible textarea entry input, inline entry editing, entries always open regardless of status, sub-arcs section with parent breadcrumb, compact My Stories card list, filterable stories list. |
| 2026-03-27 | domains/locations.md | 9 | Deepened: 7 decisions — stacked layout with presence hero section, opacity+labels for tier styling, breadcrumb+children hierarchy nav (truncate at depth >3), flat list with parent hints, hide empty tiers, hide empty sub-locations. |
| 2026-03-27 | domains/groups.md | 9 | Deepened: 4 decisions — stacked sections detail layout, tier badge after name, relations/holdings bond sub-sections, tier is display-only. Resolved tier mechanic gap. |
| 2026-03-27 | **Comprehensive review** | — | Cross-spec analysis complete. 69 outstanding questions cataloged in [OUTSTANDING_QUESTIONS.md](OUTSTANDING_QUESTIONS.md) (12 P0, 34 P1, 18 P2, 5 P3). Biggest gap: missing clocks domain spec. Fixed groups.md clock visualization inconsistency. |
| 2026-03-29 | **Question resolution** | — | Resolved 64/69 questions via interrogation + [backend questionnaire](api/BACKEND_QUESTIONNAIRE.md). Key corrections: work_on_project doesn't auto-tick clocks, is_completed computed not stored, narrative required for downtime actions, bond-graph filtering applies to feeds only (not entity access), max 8 traumas (effective stress min=1). 3 new CRs identified (logout endpoint, Pydantic 422 normalization, proposal optimistic locking). 4 questions deferred, 1 open (tablet responsive). |
| 2026-03-27 | domains/sessions.md | 9 | Deepened: 12 decisions — status-sectioned GM list, inline create form, header+tabs detail page (shared GM/player), full-preview start modal, warn-if-lossy end confirm, searchable dropdown+Add All participants, active session dashboard card, player banner+join, all-sessions player list, read-only ended detail, contribution toggle with tooltip. Resolved FT formula gap (server-side) and dashboard gap. |
