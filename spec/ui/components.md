# Component Catalog

> Status: Draft
> Last verified: 2026-03-23
> Related: [design-system.md](design-system.md), [player-views.md](player-views.md), [gm-views.md](gm-views.md)

## Primitives

Domain-agnostic, pure presentation components in `src/components/ui/`.

| Component | Description | Props |
|-----------|-------------|-------|
| **MeterBar** | Horizontal segmented fill bar with label and current/max | `label`, `value`, `max`, `effectiveMax?`, `color` |
| **ChargeDots** | Row of filled/empty/degraded dots | `charges`, `maxCharges`, `degradations?` |
| **ClockSvg** | SVG pie chart with N segments, M filled | `segments`, `progress`, `isCompleted?`, `size?` |
| **StatusBadge** | Colored pill for statuses | `status`, `variant` (proposal/session/story) |
| **VisibilityBadge** | Visibility level indicator | `level` |
| **ActionTypeBadge** | Colored label for action types | `actionType` |
| **RoleBadge** | "GM" or "Player" pill | `role` |
| **ToastNotification** | Bottom-anchored toast | `message`, `variant` (error/success), `duration` |
| **LoadMoreButton** | Cursor pagination trigger | `onClick`, `isLoading`, `hasMore` |
| **StepIndicator** | Multi-step progress circles | `steps`, `currentStep` |
| **ExpandableSection** | Collapsible section with toggle | `title`, `defaultOpen?`, `children` |
| **Modal** | Dialog wrapper (uses Radix Dialog) | `open`, `onClose`, `title`, `children` |

## Composites

Domain-aware components that assemble primitives. In `src/features/*/` directories.

| Component | Feature | Description |
|-----------|---------|-------------|
| **FeedItem** | `feed/` | Discriminated union renderer for event vs. story_entry |
| **FeedList** | `feed/` | Paginated chronological list with "Load more" and polling |
| **ProposalCard** | `proposals/` | Accordion showing proposal summary; expands to detail + approve/reject (GM) |
| **GameObjectCard** | `world/` | Shared card for character/group/location with type icon |
| **CharacterSummaryRow** | `characters/` | Compact row: name + 4 mini meter bars |
| **ClockCard** | `clocks/` | Clock name + ClockSvg + progress label |
| **TraitItem** | `characters/` | Trait name, description, slot badge, ChargeDots, recharge button |
| **BondItem** | `characters/` | Bond target, ChargeDots, degradation count, trauma badge, maintain button |
| **MagicEffectItem** | `characters/` | Effect name, type badge, charges, use/retire buttons |
| **StoryEntry** | `stories/` | Single entry: author, text, timestamp, edit/delete for owner |
| **SkillGrid** | `characters/` | 8 skills in compact grid with level indicators |
| **MagicStatGrid** | `characters/` | 5 magic stats with level + XP display |
| **SacrificeBuilder** | `proposals/` | Multi-step sacrifice selection with running gnosis-equivalent total |
| **ModifierSelector** | `proposals/` | Core trait + role trait + bond picker with charge display |
| **DataTable** | `feed/` or shared | Sortable/filterable table with column headers |
| **NavBar** | shared | Responsive nav with role-specific tabs and badges |
| **GmOverridesForm** | `proposals/` | Approval form: narrative override + flags + rider event |
| **ParticipantList** | `sessions/` | Session participants with add/remove and contribution toggle |

## Page-Level Components

Route pages in `src/app/`. Thin composition layer — import from features, compose, render.

### Auth Pages
`LoginPage`, `LoginCodePage`, `SetupPage`, `JoinPage`

### Player Pages
`PlayerFeedPage`, `CharacterSheetPage`, `ProposalsListPage`, `ProposalWizardPage`, `ProposalDetailPage`, `WorldBrowserPage`, `CharacterDetailPage`, `GroupDetailPage`, `LocationDetailPage`, `StoryDetailPage`, `ProfilePage`

### GM Pages
`GmQueuePage`, `GmFeedPage`, `GmWorldPage`, `GmCharacterNewPage`, `GmCharacterDetailPage`, `GmCharacterEditPage`, `GmGroupNewPage`, `GmGroupDetailPage`, `GmGroupEditPage`, `GmLocationNewPage`, `GmLocationDetailPage`, `GmLocationEditPage`, `GmSessionsPage`, `GmSessionDetailPage`, `GmPlayersPage`, `GmTemplatesPage`, `GmClocksPage`, `GmActionsPage`, `GmCharacterPage`

## Build Order

Primitives should be built first (Epic 0.1), as they are used across all features. Composites are built with their parent feature Epics. Build from the inside out:

1. MeterBar, ChargeDots, ClockSvg, StatusBadge (Phase 0)
2. TraitItem, BondItem, MagicEffectItem, SkillGrid, MagicStatGrid (Phase 1 — Character Sheet)
3. FeedItem, FeedList (Phase 2 — Feeds)
4. ProposalCard, ModifierSelector, SacrificeBuilder (Phase 2 — Proposals)
5. GameObjectCard, DataTable (Phase 3 — World Browser)
