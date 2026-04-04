# Component Catalog

> Status: Partially verified (Phase 0 + Phase 1 + Phase 2 complete)
> Last verified: 2026-04-03
> Related: [design-system.md](design-system.md), [player-views.md](player-views.md), [gm-views.md](gm-views.md)

## Primitives

Domain-agnostic, pure presentation components in `src/components/ui/`.

All Phase 0 primitives are implemented. Status column: **Impl** = implemented, **Spec** = spec only.

| Component | Status | Description | Props |
|-----------|--------|-------------|-------|
| **MeterBar** | Impl | Segmented horizontal bar with filled/empty/unavailable segments and numeric label | `label`, `value`, `max`, `effectiveMax?`, `color`, `showWarning?` |
| **ChargeDots** | Impl | Row of filled/empty/degraded dots | `charges`, `maxCharges`, `degradations?` |
| **ClockBar** | Impl | Linear segmented progress bar with N segments, M filled, plus numeric label | `segments`, `progress`, `isCompleted?`, `size?` |
| **StatusBadge** | Impl | Colored pill for statuses | `status`, `variant` (proposal/session/story) |
| **VisibilityBadge** | Spec | Visibility level indicator | `level` |
| **ActionTypeBadge** | Impl | Colored label for action types | `actionType` |
| **RoleBadge** | Spec | Role pill: "GM", "Player", or "Viewer" | `role` |
| **EntityLink** | Impl | Clickable entity reference with type icon. Faded styling (`opacity-50`) when `isDeleted` is true. | `type` (character/group/location/story), `id`, `name`, `isDeleted?` |
| **TimeDisplay** | Impl | Formats `time_now` integer into Season display: "Time Now 42 (Chaos 19)". 6 seasons of 23 each: Tutorial, Chaos, Discord, Confusion, Bureaucracy, Aftermath. | `timeNow` |
| **ToastNotification** | Impl | Bottom-anchored toast (via Radix Toast + `useToast`) | `message`, `variant` (error/success), `duration` |
| **LoadMoreButton** | Impl | Cursor pagination trigger | `onClick`, `isLoading`, `hasMore` |
| **StepIndicator** | Impl | Multi-step progress circles | `steps`, `currentStep` |
| **ExpandableSection** | Impl | Collapsible section with toggle | `title`, `defaultOpen?`, `children` |
| **EmptyState** | Impl | Placeholder for empty lists | `icon`, `title`, `description?`, `action?` (button label + onClick) |
| **Modal** | Impl | Base dialog wrapper (uses Radix Dialog) | `open`, `onClose`, `title`, `children` |
| **ConfirmModal** | Impl | Title + message + Cancel/Confirm buttons | `open`, `onClose`, `title`, `message`, `confirmLabel`, `onConfirm`, `variant?` (danger/default) |
| **NarrativeModal** | Spec | Title + textarea + Cancel/Submit buttons | `open`, `onClose`, `title`, `placeholder?`, `onSubmit` |
| **StarToggle** | Impl | ☆/★ toggle for starring entities | `isStarred`, `onToggle` |

## Composites

Domain-aware components that assemble primitives. In `src/features/*/` directories.

Status: **Impl** = implemented (Phase 0/1/2), **Spec** = spec only.

| Component | Feature | Status | Description |
|-----------|---------|--------|-------------|
| **FeedItem** | `feeds/` | Impl | Discriminated union renderer for event vs. story_entry |
| **EventCard** | `feeds/` | Impl | Event type badge (domain-colored), narrative, target links via EntityLink, is_own highlight, expandable changes summary, rider sub-items (collapse toggle implemented; rider grouping deferred — see events-and-feeds.md) |
| **StoryEntryCard** | `feeds/` | Impl | Story name link, entry text (`item.text`), author, timestamp |
| **FeedList** | `feeds/` | Impl | Paginated chronological list with "Load older" button, polling-aware new-item banner, FeedSkeleton on initial load |
| **MeterHeader** | `character/` | Impl | Sticky bar with character name + 4 MeterBars; null for simplified/NPC |
| **TraitItem** | `character/` | Impl | Trait name, description, slot badge (Core/Role), ChargeDots, recharge button |
| **TraitsSection** | `character/` | Impl | Labeled group of TraitItems with slot count header (e.g. "Core Traits (1/2)") |
| **BondItem** | `character/` | Impl | Bond target EntityLink, label, ChargeDots with degradation, trauma badge, maintain button |
| **BondsSection** | `character/` | Impl | Labeled group of BondItems with slot count header |
| **MagicEffectItem** | `character/` | Impl | Effect name, type badge, power level, ChargeDots (charged only), Use button, Retire button; **instant effects show no action buttons** |
| **MagicEffectsSection** | `character/` | Impl | Labeled group of MagicEffectItems with slot count header |
| **SkillGrid** | `character/` | Impl | 8 skills in compact 2×4 grid with filled/empty dot indicators (up to SKILL_MAX=3) |
| **MagicStatGrid** | `character/` | Impl | 5 magic stats with level badge + XP progress bar (MAGIC_STAT_XP_PER_LEVEL=5 segments) |
| **CharacterTabs** | `character/` | Impl | 6-tab mobile layout: Overview, Traits, Bonds, Magic, Skills & Stats, Feed |
| **MyStoriesSidebar** | `feeds/` | Impl | Compact active-story list; desktop=sidebar, mobile=collapsible |
| **StarToggle (connected)** | `feeds/` | Impl | Feature-layer star toggle wrapping the primitive with optimistic mutation |
| **ProposalCard** | `proposals/` | Impl | Player-facing card: action type badge, narrative, status, timestamp; pending = Edit/Delete, rejected = rejection note + Revise |
| **ProposalFilterChips** | `proposals/` | Impl | Filter chip row: All, Pending, Approved, Rejected with counts |
| **ActionTypeSelector** | `proposals/` | Impl | Wizard step 1 — grouped action cards (Session / Downtime / System) with disabled states |
| **WizardProvider** | `proposals/` | Impl | Wizard state context using `useReducer`; sessionStorage draft save/restore; `initialData` prop for revise flow |
| **WizardStep2** | `proposals/` | Impl | Dynamic form dispatcher for step 2; routes to correct form component per action type; 422 field-error banner |
| **ReviewStep** | `proposals/` | Impl | Wizard step 3 — fires `POST /proposals/calculate` on mount; shows CalculatedEffectCard; 422 navigates back to step 2; submit fires `POST /proposals` or `PATCH /proposals/{id}` |
| **SacrificeBuilder** | `proposals/` | Impl | Inline multi-type sacrifice selection with running gnosis-equivalent total; stepper [+]/[-] for gnosis/stress/FT; toggle+confirm for bond/trait; "Add creative sacrifice" expander |
| **ModifierSelector** | `proposals/` | Impl | Three-slot picker (Core Trait / Role Trait / Bond) with charge display; 0-charge items disabled |
| **CalculatedEffectCard** | `proposals/` | Impl | Formatted summary of server-computed calculated_effect; per-action-type renderers for all 8 player action types |
| **ApproveForm** | `proposals/` | Impl | GM approval form — system proposals render inline ResolveTraumaForm/ResolveClockForm; player proposals render quick Approve button + expandable Options (narrative override, force/bond_strained flags, MagicOverridesPanel, RiderEventForm); `work_on_project` + clock_id pre-fills rider as `clock.advanced` |
| **RejectForm** | `proposals/` | Impl | Simple rejection note textarea + Reject button |
| **GmProposalReviewCard** | `proposals/` | Impl | GM queue card — system proposals get amber border/badge + inline form; player proposals show ActionTypeBadge, revision count badge, narrative, SelectionsSummary, CalculatedEffectCard, ApproveForm, RejectForm |
| **GmQueueSummary** | `proposals/` | Impl | GM queue sidebar — pending count, PC summary cards with mini MeterBars and stress alert icon, near-completion clocks |
| **GmFeedFilterPanel** | `feeds/` | Impl | Advanced filter controls for GM event feed — item type radio, target type select, actor type select, date range inputs; Reset button when filters active |
| **SessionTimelineFeed** | `feeds/` | Impl | Session-scoped feed — wraps FeedList with `session_id` filter; polls at 15s/5s active |
| **GameObjectCard** | `world/` | Spec | Shared card for character/group/location with type icon, name, subtitle, star toggle |
| **CharacterSummaryRow** | `character/` | Spec | Compact row: name + 4 mini meter bars |
| **ClockCard** | `clocks/` | Spec | Clock name + ClockBar + progress label |
| **StoryEntry** | `stories/` | Spec | Single entry: author, text, timestamp, edit/delete for owner. Inline edit mode. |
| **DicePoolBar** | `proposals/` | Spec | Sticky summary bar with live dice pool calculation + costs + Next button |
| **DataTable** | shared | Spec | Responsive: sortable table (desktop) / card list (mobile) with column filters |
| **NavBar** | shared | Impl | Responsive nav with role-specific items; player: 5 items (Feed, Character, Proposals, World, Profile); GM: 5 items (Queue, Feed, World, Sessions, More→/gm/players) |
| **ActiveSessionBanner** | `sessions/` | Spec | Persistent teal-accented banner for active session state (player: join/leave; GM: link to detail). Moderate prominence — visible but not disruptive. |
| **GmOverridesForm** | `proposals/` | — | Absorbed into ApproveForm (Options panel + MagicOverridesPanel sub-components) — not a separate file |
| **RiderEventForm** | `proposals/` | — | Absorbed into ApproveForm as `RiderEventForm` internal component — not a separate file |
| **ParticipantList** | `sessions/` | Spec | Session participants with add/remove, "Add All", contribution toggle, searchable dropdown |
| **PresenceTiers** | `locations/` | Spec | Tiered entity list with opacity degradation (100%/70%/50%), empty tier hiding |
| **BreadcrumbNav** | `locations/` | Spec | Ancestor breadcrumb trail with middle truncation at depth > 3 |

## Page-Level Components

Route pages in `src/app/`. Thin composition layer — import from features, compose, render.

### Auth Pages
`LoginPage`, `LoginCodePage`, `SetupPage`, `JoinPage`

### Player Pages
`PlayerFeedPage`, `CharacterSheetPage`, `ProposalsListPage`, `ProposalWizardPage`, `WorldBrowserPage`, `SessionsListPage`, `SessionDetailPage`, `CharacterDetailPage`, `GroupDetailPage`, `LocationDetailPage`, `StoryDetailPage`

### GM Pages
`GmDashboardPage`, `GmQueuePage`, `GmFeedPage`, `GmWorldPage`, `GmSessionsPage`, `GmSessionDetailPage`, `GmPlayersPage`, `GmTemplatesPage`, `GmClocksPage`, `GmActionsPage`

### Shared Pages (role-aware via isGm prop or layout context)
`SessionDetailPage`, `CharacterDetailPage`, `GroupDetailPage`, `LocationDetailPage`, `StoryDetailPage`

---

## Interrogation Decisions

### NavBar: Role-Split with 5 Items

- **Decision**: Player nav: Feed, Character, Proposals, World, Profile. GM nav: Queue, Feed, World, Sessions, More (→ /gm/players). Badges: pending proposal results for player, pending queue count for GM. Active session banner positioned above nav on mobile, below on desktop.
- **Rationale**: 5 items is the maximum for comfortable mobile bottom nav. GM has more pages, so the "More" item keeps the bar to 5. Badges surface the most important status without navigating.
- **Implications**: NavBar component receives `items` array and `role` prop from layout. Badge counts from polling queries.

> Implementation note (2026-04-03): player nav items are Feed (`/`), Character (`/character`), Proposals (`/proposals`), World (`/world`), Profile (`/profile`). "Sessions" was not included in the player nav at this stage — session access is via World or a later addition. "Sheet" was renamed "Character". "More" on GM nav links directly to `/gm/players` (not a dropdown in the current implementation).

### MeterBar: Segmented Bar + Number

- **Decision**: Horizontal bar divided into discrete segments (one per unit, up to max). Filled segments use the meter color, empty segments use muted background. `effectiveMax` shown as a visual boundary — segments between effectiveMax and max are rendered as unavailable (darker/hatched). Numeric label `value/effectiveMax` (or `value/max` if no effectiveMax) to the right.
- **Rationale**: Discrete segments feel tactile and match the tabletop origin (pencil marks on a sheet). The effectiveMax boundary makes trauma/degradation impact immediately visible.
- **Implications**: SVG or CSS grid rendering with one element per segment. Three segment states: filled, empty, unavailable. Max segments: 23 (gnosis) — ensure the bar scales.

### ClockBar: Linear Progress Bar

- **Decision**: Linear segmented progress bar (not pie chart) with N segments and M filled. Filled segments in brand-teal, empty in muted. Numeric label "M/N" beside the bar. Completed clock gets a distinct treatment (e.g., all filled + checkmark). Sizes: sm (inline), md (card), lg (detail).
- **Rationale**: Unlike Blades-in-the-Dark, clock segment counts are arbitrary and don't divide cleanly into pie wedges. A linear progress bar works for any N and is more readable. The numeric label provides exact progress at a glance.
- **Implications**: Renamed from ClockSvg to ClockBar. CSS grid or flexbox rendering. Segments scale to fill available width.

### DataTable: Responsive Table/Cards

- **Decision**: Desktop: standard HTML table with sortable column headers (click to sort), row hover state, and optional per-column filter inputs. Mobile: each row renders as a card with label-value pairs stacked vertically. Used for GM event feed filter mode and GM players/invites list.
- **Rationale**: Tables are the most efficient layout for tabular data on desktop. Cards are more readable on narrow screens. The responsive flip is a well-established pattern.
- **Implications**: Component accepts `columns[]` config with `key`, `header`, `sortable?`, `filterable?`, `renderCell?`. Breakpoint switch at 768px.

### GameObjectCard: Type-Icon Card

- **Decision**: Card with type icon (person/building/pin from Lucide), entity name, brief subtitle (type-specific: characters show PC/NPC + player name, groups show "Group • Tier N", locations show "Location • Parent Name"), and star toggle. Clickable to navigate to detail page.
- **Rationale**: Type icon provides instant visual differentiation in the World Browser. Type-specific subtitles give enough context to identify entities without clicking through.
- **Implications**: Shared card component with a `type` discriminator for subtitle rendering. Star toggle uses the `StarToggle` primitive.

### World Browser: 4 Tabs

- **Decision**: Four tabs: Characters, Groups, Locations, Stories. Each tab shows a searchable list using GameObjectCards (or story-specific cards for the Stories tab). Search filters by name within the active tab. Stories tab includes status and tag filters from the stories spec.
- **Rationale**: Stories are a core part of the game world. Including them in the World Browser gives players a single place to explore all game content. Four tabs is manageable.
- **Implications**: World Browser route with tab state in URL params. Each tab has its own query and filter state. Stories tab reuses the filterable list from stories.md decisions.

### EntityLink: Shared Primitive

- **Decision**: A shared `EntityLink` component that renders an entity name as a styled clickable link with a type icon (👤/🏢/📍/📖). Used everywhere entities are referenced: feed targets, bond targets, presence tiers, story owners, session participants, etc. All link to the entity detail page.
- **Rationale**: Entity references appear in dozens of places. A shared component ensures consistent styling, consistent navigation, and a single place to update routing logic.
- **Implications**: Props: `type`, `id`, `name`. Type icon from a constant map. Next.js `Link` component internally. Small enough to use inline in text.

### Modal Variants: Three Patterns

- **Decision**: Base `Modal` (generic wrapper), `ConfirmModal` (title + message + Cancel/Confirm), `NarrativeModal` (title + textarea + Cancel/Submit). Most dialogs in the app fit one of these patterns. Custom content can use the base Modal.
- **Rationale**: ConfirmModal covers: retire trait, end session, delete proposal, discard draft. NarrativeModal covers: rejection note, resolve_clock narrative, GM narrative override. Base Modal covers: session start preview, complex forms.
- **Implications**: All three use Radix Dialog internally. ConfirmModal accepts `variant: 'danger'` for destructive actions (red confirm button).

### EmptyState: Shared Primitive

- **Decision**: Shared `EmptyState` component with icon, title, optional description, and optional action button. Used across all list/feed views.
- **Rationale**: Every list in the app can be empty. A consistent component prevents ad-hoc "No items" text and provides actionable guidance.
- **Implications**: Each feature provides context-specific copy. Action button is optional (e.g., "New Proposal" on empty proposals list, no action on empty feed).

### Empty State Copy

- **Decision**: Unique copy per context. Each empty state gets tailored messaging: "No proposals yet — create your first!", "No events in this feed yet", "No bonds — propose one!" etc.
- **Rationale**: Tailored copy is more helpful and polished than generic "Nothing here yet."

---

## Build Order

Primitives should be built first (Epic 0.1), as they are used across all features. Composites are built with their parent feature Epics. Build from the inside out:

1. **[Complete]** MeterBar, ChargeDots, ClockBar, StatusBadge, EntityLink, EmptyState, Modal variants, StarToggle (Phase 0 — Epic 0.1)
2. **[Complete]** MeterHeader, TraitItem, TraitsSection, BondItem, BondsSection, MagicEffectItem, MagicEffectsSection, SkillGrid, MagicStatGrid, CharacterTabs (Phase 1 — Epic 1.2)
3. **[Complete]** FeedItem, EventCard, StoryEntryCard, FeedList, MyStoriesSidebar, StarToggle (connected), PlayerFeedPage (Phase 1 — Epic 2.3 Batch H)
4. **[Complete]** ActionTypeBadge, ProposalCard, ProposalFilterChips, ActionTypeSelector, WizardProvider, WizardStep2, ReviewStep, SacrificeBuilder, ModifierSelector, CalculatedEffectCard, ApproveForm, RejectForm, GmProposalReviewCard, GmQueueSummary, GmFeedFilterPanel, SessionTimelineFeed (Phase 2 — Epics 2.1, 2.2, 2.3 Batch N)
5. CharacterSummaryRow, ActiveSessionBanner, DicePoolBar (Phase 2 remaining — not yet implemented)
6. GameObjectCard, DataTable, PresenceTiers, BreadcrumbNav, ParticipantList (Phase 3 — World Browser & Sessions)
