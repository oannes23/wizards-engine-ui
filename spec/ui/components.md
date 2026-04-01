# Component Catalog

> Status: Deepened
> Last verified: 2026-03-27
> Related: [design-system.md](design-system.md), [player-views.md](player-views.md), [gm-views.md](gm-views.md)

## Primitives

Domain-agnostic, pure presentation components in `src/components/ui/`.

| Component | Description | Props |
|-----------|-------------|-------|
| **MeterBar** | Segmented horizontal bar with filled/empty/unavailable segments and numeric label | `label`, `value`, `max`, `effectiveMax?`, `color` |
| **ChargeDots** | Row of filled/empty/degraded dots | `charges`, `maxCharges`, `degradations?` |
| **ClockBar** | Linear segmented progress bar with N segments, M filled, plus numeric label | `segments`, `progress`, `isCompleted?`, `size?` |
| **StatusBadge** | Colored pill for statuses | `status`, `variant` (proposal/session/story) |
| **VisibilityBadge** | Visibility level indicator | `level` |
| **ActionTypeBadge** | Colored label for action types | `actionType` |
| **RoleBadge** | "GM" or "Player" pill | `role` |
| **EntityLink** | Clickable entity reference with type icon | `type` (character/group/location/story), `id`, `name` |
| **ToastNotification** | Bottom-anchored toast | `message`, `variant` (error/success), `duration` |
| **LoadMoreButton** | Cursor pagination trigger | `onClick`, `isLoading`, `hasMore` |
| **StepIndicator** | Multi-step progress circles | `steps`, `currentStep` |
| **ExpandableSection** | Collapsible section with toggle | `title`, `defaultOpen?`, `children` |
| **EmptyState** | Placeholder for empty lists | `icon`, `title`, `description?`, `action?` (button label + onClick) |
| **Modal** | Base dialog wrapper (uses Radix Dialog) | `open`, `onClose`, `title`, `children` |
| **ConfirmModal** | Title + message + Cancel/Confirm buttons | `open`, `onClose`, `title`, `message`, `confirmLabel`, `onConfirm`, `variant?` (danger/default) |
| **NarrativeModal** | Title + textarea + Cancel/Submit buttons | `open`, `onClose`, `title`, `placeholder?`, `onSubmit` |
| **StarToggle** | ☆/★ toggle for starring entities | `isStarred`, `onToggle` |

## Composites

Domain-aware components that assemble primitives. In `src/features/*/` directories.

| Component | Feature | Description |
|-----------|---------|-------------|
| **FeedItem** | `feed/` | Discriminated union renderer for event vs. story_entry |
| **EventCard** | `feed/` | Event type icon+label, narrative, changes_summary, target links, is_own highlight, expandable detail, rider sub-items |
| **StoryEntryCard** | `feed/` | Story name link, entry text, author, timestamp |
| **FeedList** | `feed/` | Paginated chronological list with "Load older" button, polling-aware new-item banner |
| **ProposalCard** | `proposals/` | Accordion showing proposal summary; expands to detail + approve/reject (GM) |
| **GameObjectCard** | `world/` | Shared card for character/group/location with type icon, name, subtitle, star toggle |
| **CharacterSummaryRow** | `characters/` | Compact row: name + 4 mini meter bars |
| **ClockCard** | `clocks/` | Clock name + ClockBar + progress label |
| **TraitItem** | `characters/` | Trait name, description, slot badge, ChargeDots, recharge button |
| **BondItem** | `characters/` | Bond target, ChargeDots, degradation count, trauma badge, maintain button |
| **MagicEffectItem** | `characters/` | Effect name, type badge, charges, use/retire buttons |
| **StoryEntry** | `stories/` | Single entry: author, text, timestamp, edit/delete for owner. Inline edit mode. |
| **SkillGrid** | `characters/` | 8 skills in compact 2x4 grid with level dot indicators |
| **MagicStatGrid** | `characters/` | 5 magic stats with level + XP bar display |
| **SacrificeBuilder** | `proposals/` | Inline multi-type sacrifice selection with running gnosis-equivalent total |
| **ModifierSelector** | `proposals/` | Three-slot picker (Core Trait / Role Trait / Bond) with charge display |
| **DicePoolBar** | `proposals/` | Sticky summary bar with live dice pool calculation + costs + Next button |
| **CalculatedEffectCard** | `proposals/` | Formatted summary of server-computed calculated_effect |
| **DataTable** | shared | Responsive: sortable table (desktop) / card list (mobile) with column filters |
| **NavBar** | shared | Responsive nav with role-specific tabs, badges, and GM More dropdown |
| **ActiveSessionBanner** | `sessions/` | Persistent banner for active session state (player: join/leave; GM: link to detail) |
| **GmOverridesForm** | `proposals/` | Approval options: narrative override + flags + magic overrides sub-panel + rider event |
| **RiderEventForm** | `proposals/` | Compact GM action type-selector for rider events |
| **ParticipantList** | `sessions/` | Session participants with add/remove, "Add All", contribution toggle, searchable dropdown |
| **PresenceTiers** | `locations/` | Tiered entity list with opacity degradation (100%/70%/50%), empty tier hiding |
| **BreadcrumbNav** | `locations/` | Ancestor breadcrumb trail with middle truncation at depth > 3 |

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

- **Decision**: Player nav: Sheet, Proposals, Feed, World, Sessions. GM nav: Queue, Feed, World, Sessions, More (dropdown containing Players & Invites, Trait Templates, Clocks, GM Actions). Badges: Proposals (new results count) for player, Queue (pending count) for GM. Active session banner positioned above nav on mobile, below on desktop.
- **Rationale**: 5 items is the maximum for comfortable mobile bottom nav. GM has more pages, so the "More" dropdown keeps the bar to 5. Badges surface the most important status without navigating.
- **Implications**: NavBar component receives `role` prop from auth context. Badge counts from polling queries. More dropdown uses Radix DropdownMenu.

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

1. MeterBar, ChargeDots, ClockBar, StatusBadge, EntityLink, EmptyState, Modal variants, StarToggle (Phase 0)
2. TraitItem, BondItem, MagicEffectItem, SkillGrid, MagicStatGrid, CharacterSummaryRow (Phase 1 — Character Sheet)
3. FeedItem, EventCard, StoryEntryCard, FeedList, ActiveSessionBanner (Phase 2 — Feeds)
4. ProposalCard, ModifierSelector, SacrificeBuilder, DicePoolBar, CalculatedEffectCard, GmOverridesForm, RiderEventForm (Phase 2 — Proposals)
5. GameObjectCard, DataTable, PresenceTiers, BreadcrumbNav, ParticipantList (Phase 3 — World Browser & Sessions)
