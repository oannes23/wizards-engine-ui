# Agent Assignments

> Per-story mapping: who implements, who tests, who reviews, who syncs the spec.

## Legend

- **Primary**: Agent that implements the story
- **QA**: QA session that writes tests covering this story
- **Review**: Review checkpoint that validates this story
- **TW**: Tech-writer sync point that updates specs for this story

---

## Phase 0 — Foundation

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 0.1.1 | Project initialization | A | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.2 | API client module | A | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.3 | TypeScript types & constants | A | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.4 | Auth provider & context | B | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.5 | Toast notification system | B | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.6 | Polling hook | B | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.7 | Layout shells & navigation | B | frontend-dev | QA-1 | GATE-0 | TW-1 |
| 0.1.8 | Base UI components | C | frontend-dev | QA-1 | GATE-0 | TW-1 |

---

## Phase 1 — Core Display

### Epic 1.1 — Auth & Onboarding

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 1.1.1 | Login page | D | frontend-dev | QA-2 | GATE-1 | TW-2 |
| 1.1.2 | Magic link deep-link | D | frontend-dev | QA-2 | GATE-1 | TW-2 |
| 1.1.3 | Setup page | D | frontend-dev | QA-2 | GATE-1 | TW-2 |
| 1.1.4 | Join page | D | frontend-dev | QA-2 | GATE-1 | TW-2 |
| 1.1.5 | Profile page | E | frontend-dev | QA-2 | GATE-1 | TW-2 |
| 1.1.6 | Auth middleware | E | frontend-dev | QA-2 | GATE-1 | TW-2 |

### Epic 1.2 — Character Sheet

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 1.2.1 | MeterBar integration | F | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.2 | ChargeDots integration | F | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.3 | Character sheet layout | F | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.4 | Traits section | F | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.5 | Bonds section | F | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.6 | Magic effects section | G | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.7 | Skills & magic stats | G | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.8 | Direct action buttons | G | frontend-dev | QA-3 | Inline-1, GATE-1 | TW-2 |
| 1.2.9 | Character feed tab | G | frontend-dev | QA-3 | GATE-1 | TW-2 |

### Epic 2.3 — Feeds (started early)

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 2.3.1 | FeedItem component | H | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.3.2 | FeedList component | H | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.3.3 | Player feed page | H | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.3.4 | Starred management | H | frontend-dev | QA-5 | GATE-2 | TW-3 |

---

## Phase 2 — Core Gameplay

### Epic 2.1 — Proposals

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 2.1.1 | Proposals list page | I | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.2 | Proposal detail page | I | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.3 | Step indicator | J | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.4 | Wizard step 1: action selector | J | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.7 | Wizard step 2: downtime forms | J | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.5 | Wizard step 2: use_skill | K | frontend-dev | QA-4 | Inline-2, GATE-2 | TW-3 |
| 2.1.6 | Wizard step 2: magic actions | K | frontend-dev | QA-4 | Inline-2, GATE-2 | TW-3 |
| 2.1.8 | Sacrifice builder | K | frontend-dev | QA-4 | Inline-2, GATE-2 | TW-3 |
| 2.1.9 | Wizard step 3: review & submit | L | frontend-dev | QA-4 | GATE-2 | TW-3 |
| 2.1.10 | Proposal edit & delete | L | frontend-dev | QA-4 | GATE-2 | TW-3 |

> **Note**: Story 2.1.7 (downtime) is sequenced BEFORE 2.1.5 (use_skill) to establish form patterns before tackling complex forms.

### Epic 2.2 — GM Queue

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 2.2.1 | GM queue page | M | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.2.2 | Proposal review card | M | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.2.3 | Approve form | M | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.2.4 | Reject form | M | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.2.5 | Queue summary | M | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.2.6 | Nav badge | M | frontend-dev | QA-5 | GATE-2 | TW-3 |

### Epic 2.3 — Feeds (completion)

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 2.3.5 | GM event feed | N | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.3.6 | Session timeline feed | N | frontend-dev | QA-5 | GATE-2 | TW-3 |
| 2.3.7 | Entity-scoped feeds | N | frontend-dev | QA-5 | GATE-2 | TW-3 |

---

## Phase 3 — World & Management

### Epic 3.1 — World Browser

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 3.1.1 | World browser page | O | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.2 | GameObjectCard | O | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.8 | Search & filter controls | O | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.3 | Character list + detail | P | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.4 | Group list + detail | P | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.5 | Location list + detail | P | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.6 | Story list + detail | P | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.1.7 | Story entry CRUD | P | frontend-dev | QA-6 | GATE-3 | TW-4 |

### Epic 3.2 — GM World Management

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 3.2.1 | Create character (NPC) form | Q | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.2.2 | Create group form | Q | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.2.3 | Create location form | Q | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.2.4 | Edit game object forms | Q | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.2.5 | GM action type selector | R | frontend-dev | QA-6 | Inline-3, GATE-3 | TW-4 |
| 3.2.6 | GM modify actions | R | frontend-dev | QA-6 | Inline-3, GATE-3 | TW-4 |
| 3.2.7 | GM bond CRUD actions | R | frontend-dev | QA-6 | Inline-3, GATE-3 | TW-4 |
| 3.2.8 | GM trait + effect actions | R | frontend-dev | QA-6 | Inline-3, GATE-3 | TW-4 |
| 3.2.9 | Clock management page | S | frontend-dev | QA-6 | GATE-3 | TW-4 |
| 3.2.10 | Trait template CRUD | S | frontend-dev | QA-6 | GATE-3 | TW-4 |

### Epic 3.3 — Sessions

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 3.3.1 | Session list page | T | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.3.2 | Create session form | T | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.3.3 | Session detail page | T | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.3.4 | Lifecycle controls | T | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.3.5 | Participant management | T | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.3.6 | GM dashboard | T | frontend-dev | QA-7 | GATE-3 | TW-4 |

### Epic 3.4 — Players & Invites

| Story | Title | Batch | Primary | QA | Review | TW |
|-------|-------|-------|---------|-----|--------|-----|
| 3.4.1 | Players roster | U | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.4.2 | Invite management | U | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.4.3 | Token regeneration | U | frontend-dev | QA-7 | GATE-3 | TW-4 |
| 3.4.4 | GM character creation | U | frontend-dev | QA-7 | GATE-3 | TW-4 |

---

## QA Session Scope

| Session | After Batch | MSW Handlers | Fixtures | Integration Tests | Component Tests |
|---------|-------------|-------------|----------|-------------------|-----------------|
| QA-1 | A, B, C | — (infra only) | `makeUser()`, personas | — | Primitives (MeterBar, ChargeDots, ClockBar, etc.) + axe |
| QA-2 | E | `auth.ts`, `users.ts` | `makeInvite()` | `auth-flow.test.tsx` | Login, Setup, Join forms |
| QA-3 | G | `characters.ts`, `bonds.ts`, `traits.ts`, `effects.ts` | `makeCharacter()`, `makeBond()`, `makeTrait()`, `makeMagicEffect()` + presets | `character-sheet.test.tsx` | TraitItem, BondItem, MagicEffectItem, SkillGrid, MagicStatGrid |
| QA-4 | L | `proposals.ts` | `makeProposal()` + presets, `makeCalculatedEffect()` | `proposal-wizard.test.tsx` | SacrificeBuilder, ModifierSelector, DicePoolBar, CalculatedEffectCard + unit: sacrifice math |
| QA-5 | M, N | `feeds.ts`, `events.ts`, `gm.ts` | `makeEvent()`, `makeFeedItem()`, `makeStoryEntry()` | `gm-queue.test.tsx` | FeedItem, EventCard, StoryEntryCard, GmOverridesForm, RiderEventForm |
| QA-6 | P, S | `groups.ts`, `locations.ts`, `stories.ts`, `clocks.ts`, `traitTemplates.ts` | `makeGroup()`, `makeLocation()`, `makeStory()`, `makeStoryEntry()`, `makeClock()`, `makeTraitTemplate()` | CRUD smoke tests | GameObjectCard, PresenceTiers, BreadcrumbNav, ClockCard |
| QA-7 | T, U | `sessions.ts`, `players.ts`, `invites.ts` | `makeSession()` + presets, `makeParticipant()`, `makeInvite()` | `session-lifecycle.test.tsx` | ParticipantList, ActiveSessionBanner |
| QA-8 | GATE-3 | — (E2E only) | — | — | E2E: auth-login, proposal-flow, session-flow, a11y |
