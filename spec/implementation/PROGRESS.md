# Implementation Progress

Living tracker updated as stories are completed. See [ORCHESTRATION.md](ORCHESTRATION.md) for execution protocol.

## Phase 0: Foundation

| Story | Title | Batch | Agent | Status | Notes |
|-------|-------|-------|-------|--------|-------|
| 0.1.1 | Project initialization | A | frontend-dev | Complete | Next.js 16 + Tailwind 4 + TanStack Query 5 |
| 0.1.2 | API client module | A | frontend-dev | Complete | apiFetch + ApiError + auth service |
| 0.1.3 | TypeScript types & constants | A | frontend-dev | Complete | D1 applied: entry_text |
| 0.1.4 | Auth provider & context | B | frontend-dev | Complete | AuthProvider + useAuth |
| 0.1.5 | Toast notification system | B | frontend-dev | Complete | Radix Toast + useToast |
| 0.1.6 | Polling hook | B | frontend-dev | Complete | usePolling + query-keys.ts |
| 0.1.7 | Layout shells & NavBar | B | frontend-dev | Complete | 3 route groups + NavBar + middleware |
| 0.1.8 | Base UI components | C | frontend-dev | Complete | MeterBar, ChargeDots, ClockBar, Modal, etc. |
| — | QA-1: Test infrastructure | — | qa-engineer | Complete | 31 tests passing, MSW + fixtures + axe |
| — | GATE-0 + TW-1 | — | all reviewers | Complete | All checklists pass |

## Phase 1: Core Display

| Story | Title | Batch | Agent | Status | Notes |
|-------|-------|-------|-------|--------|-------|
| 1.1.1 | Login page | D | frontend-dev | Complete | Magic link code form; invite → join redirect |
| 1.1.2 | Magic link deep-link | D | frontend-dev | Complete | /login/[code] auto-submits code |
| 1.1.3 | Setup page | D | frontend-dev | Complete | GM bootstrap form |
| 1.1.4 | Join page | D | frontend-dev | Complete | New player character creation |
| 1.1.5 | Profile page | E | frontend-dev | Complete | Display name edit, starred link, refresh magic link |
| 1.1.6 | Auth middleware | E | frontend-dev | Complete | Role guards in player/gm layouts; middleware.ts for route protection |
| — | QA-2: Auth tests | — | qa-engineer | Complete | Auth flow integration tests |
| 1.2.1 | MeterBar integration | F | frontend-dev | Complete | MeterHeader with all 4 meters; effectiveMax for stress |
| 1.2.2 | ChargeDots integration | F | frontend-dev | Complete | Used in TraitItem, BondItem, MagicEffectItem |
| 1.2.3 | Character sheet layout | F | frontend-dev | Complete | CharacterTabs (mobile 6 tabs) + CharacterDesktopLayout (3-column) |
| 1.2.4 | Traits section | F | frontend-dev | Complete | TraitItem + TraitsSection; Core/Role groups with recharge |
| 1.2.5 | Bonds section | F | frontend-dev | Complete | BondItem + BondsSection; trauma badge, maintain button, degradation |
| 1.2.6 | Magic effects section | G | frontend-dev | Complete | MagicEffectItem + MagicEffectsSection; instant=display-only |
| 1.2.7 | Skills + magic stats | G | frontend-dev | Complete | SkillGrid (2×4 dots) + MagicStatGrid (level badge + XP bar) |
| 1.2.8 | Direct action buttons | G | frontend-dev | Complete | Find Time in Overview tab; Recharge/Maintain inline on items |
| 1.2.9 | Character feed tab | G | frontend-dev | Complete | Feed tab wired to useCharacterFeed |
| — | QA-3: Character tests | — | qa-engineer | Complete | MeterHeader, SkillGrid, MagicStatGrid, BondItem, TraitItem tests |
| — | Inline-1: Character review | — | game-designer, code-reviewer | Complete | |
| 2.3.1 | FeedItem component | H | frontend-dev | Complete | Discriminated union; EventCard + StoryEntryCard |
| 2.3.2 | FeedList component | H | frontend-dev | Complete | Infinite scroll, new-item banner, skeleton |
| 2.3.3 | Player feed page | H | frontend-dev | Complete | All/Starred tabs + MyStoriesSidebar |
| 2.3.4 | Starred management | H | frontend-dev | Complete | StarToggle (connected), useStarredObjects, useStarToggle |
| — | GATE-1 + TW-2 | — | all reviewers | Complete | |

## Phase 2: Core Gameplay

| Story | Title | Batch | Agent | Status | Notes |
|-------|-------|-------|-------|--------|-------|
| 2.1.1 | Proposals list page | I | frontend-dev | Complete | ProposalCard + ProposalFilterChips |
| 2.1.2 | Proposal detail page | I | frontend-dev | Complete | |
| 2.1.3 | Step indicator | J | frontend-dev | Complete | StepIndicator primitive (Phase 0) |
| 2.1.4 | Wizard step 1 | J | frontend-dev | Complete | ActionTypeSelector |
| 2.1.7 | Wizard step 2: downtime | J | frontend-dev | Complete | RegainGnosisForm, RestForm, WorkOnProjectForm, NewTraitForm, NewBondForm |
| 2.1.5 | Wizard step 2: use_skill | K | frontend-dev | Complete | UseSkillForm |
| 2.1.6 | Wizard step 2: magic | K | frontend-dev | Complete | UseMagicForm, ChargeMagicForm |
| 2.1.8 | Sacrifice builder | K | frontend-dev | Complete | SacrificeBuilder + sacrificeMath.ts |
| — | Inline-2: Magic review | — | game-designer, architect, code-reviewer | Complete | |
| 2.1.9 | Wizard step 3: review | L | frontend-dev | Complete | ReviewStep + CalculatedEffectCard |
| 2.1.10 | Proposal edit/delete | L | frontend-dev | Complete | WizardProvider initialData prop; PATCH in ReviewStep |
| — | QA-4: Proposal tests | — | qa-engineer | Complete | |
| 2.2.1 | GM queue page | M | frontend-dev | Complete | |
| 2.2.2 | Proposal review card | M | frontend-dev | Complete | GmProposalReviewCard |
| 2.2.3 | Approve form | M | frontend-dev | Complete | ApproveForm (incl. MagicOverridesPanel, RiderEventForm, ResolveTrauma/ClockForm) |
| 2.2.4 | Reject form | M | frontend-dev | Complete | RejectForm |
| 2.2.5 | Queue summary | M | frontend-dev | Complete | GmQueueSummary |
| 2.2.6 | Nav badge | M | frontend-dev | Complete | useProposalBadge |
| 2.3.5 | GM event feed | N | frontend-dev | Complete | GmFeedFilterPanel |
| 2.3.6 | Session timeline feed | N | frontend-dev | Complete | SessionTimelineFeed |
| 2.3.7 | Entity-scoped feeds | N | frontend-dev | Complete | useEntityFeed |
| — | QA-5: Queue & feed tests | — | qa-engineer | Complete | |
| — | GATE-2 + TW-3 | — | all reviewers | Complete | TW-3 tasks: this update |

## Phase 3: World & Management

| Story | Title | Batch | Agent | Status | Notes |
|-------|-------|-------|-------|--------|-------|
| 3.1.1 | World browser page | O | frontend-dev | Not Started | |
| 3.1.2 | GameObjectCard | O | frontend-dev | Not Started | |
| 3.1.8 | Search & filter controls | O | frontend-dev | Not Started | |
| 3.1.3 | Character list + detail | P | frontend-dev | Not Started | |
| 3.1.4 | Group list + detail | P | frontend-dev | Not Started | |
| 3.1.5 | Location list + detail | P | frontend-dev | Not Started | |
| 3.1.6 | Story list + detail | P | frontend-dev | Not Started | Apply D3: owner name resolution |
| 3.1.7 | Story entry CRUD | P | frontend-dev | Not Started | |
| 3.2.1 | Create character form | Q | frontend-dev | Not Started | |
| 3.2.2 | Create group form | Q | frontend-dev | Not Started | |
| 3.2.3 | Create location form | Q | frontend-dev | Not Started | |
| 3.2.4 | Edit game object forms | Q | frontend-dev | Not Started | |
| 3.2.5 | GM action type selector | R | frontend-dev | Not Started | Apply D4: discriminated schemas |
| 3.2.6 | GM modify actions | R | frontend-dev | Not Started | |
| 3.2.7 | GM bond CRUD actions | R | frontend-dev | Not Started | |
| 3.2.8 | GM trait + effect actions | R | frontend-dev | Not Started | |
| — | Inline-3: GM actions review | — | architect, game-designer, code-reviewer | Not Started | After R |
| 3.2.9 | Clock management | S | frontend-dev | Not Started | |
| 3.2.10 | Trait template CRUD | S | frontend-dev | Not Started | |
| — | QA-6: World & GM tests | — | qa-engineer | Not Started | After P+S |
| 3.3.1 | Session list page | T | frontend-dev | Not Started | Parallel with O–S |
| 3.3.2 | Create session form | T | frontend-dev | Not Started | |
| 3.3.3 | Session detail page | T | frontend-dev | Not Started | |
| 3.3.4 | Lifecycle controls | T | frontend-dev | Not Started | |
| 3.3.5 | Participant management | T | frontend-dev | Not Started | |
| 3.3.6 | GM dashboard | T | frontend-dev | Not Started | |
| 3.4.1 | Players roster | U | frontend-dev | Not Started | Apply D2: is_active field |
| 3.4.2 | Invite management | U | frontend-dev | Not Started | |
| 3.4.3 | Token regeneration | U | frontend-dev | Not Started | |
| 3.4.4 | GM character creation | U | frontend-dev | Not Started | |
| — | QA-7: Session & player tests | — | qa-engineer | Not Started | After T+U |
| — | GATE-3 + TW-4 | — | all reviewers | Not Started | After QA-6, QA-7 |

## Final Phase

| Item | Batch | Agent | Status | Notes |
|------|-------|-------|--------|-------|
| E2E tests | QA-8 | qa-engineer | Not Started | After GATE-3 |
| Final review | — | all reviewers | Not Started | After QA-8 |
