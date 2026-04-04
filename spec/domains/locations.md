# Locations

> Status: Deepened
> Last verified: 2026-03-27
> Related: [bonds.md](bonds.md), [../api/contract.md#locations](../api/contract.md#locations)

## Overview

Locations are Game Objects representing places in the game world. They support parent/child nesting for geographic hierarchy and have presence tiers derived from bond-graph traversal.

**Bond-distance detail gating**: Players see full location details only for locations within 3 hops of their character. Locations outside that range show name and description only. GM and viewer roles always see full detail. See `characters.md` for the full gating decision and CR-013.

## Key Properties

- **Parent/child hierarchy**: Locations can nest via `parent_id`. Changed via GM actions, not direct PATCH.
- **Traits**: Up to 5 `feature_trait` slots. Descriptive only (no charges).
- **Bonds**: `location_bond` to any Game Object (unlimited).
- **Presence tiers**: Derived from bond-graph traversal. The API returns pre-computed tiers:

```json
{
  "presence": [
    {"tier": 1, "label": "Commonly present", "items": [...]},
    {"tier": 2, "label": "Often present", "items": [...]},
    {"tier": 3, "label": "Sometimes present", "items": [...]}
  ]
}
```

## Deferred Narrative Resolution

Character presence at locations is probabilistic, not declarative. The UI must use language like "commonly present at" rather than "is at." This preserves narrative ambiguity — the GM can place a character elsewhere in any given scene without contradicting the system.

---

## Interrogation Decisions

### Location Detail Layout: Stacked with Presence Hero

- **Decision**: Vertical scroll with stacked sections: Header (name, breadcrumb to parent, description) → Presence Tiers ("Who's Around", prominent section) → Traits → Bonds → Sub-Locations → Feed. Shared page for GM and players (GM sees additional edit/manage controls).
- **Rationale**: Presence tiers are the most unique and useful element on a location page — they answer "who's here?" which is the first thing players want to know. Giving them visual prominence makes the page immediately useful.
- **Implications**: Presence section renders above mechanical details. Feed uses standard "Load more" pagination.

### Presence Tier Styling: Opacity + Labels

- **Decision**: Three labeled groups with decreasing opacity: Tier 1 (100% opacity, "Commonly present"), Tier 2 (70% opacity, "Often present"), Tier 3 (50% opacity, "Sometimes present"). Entity names are clickable links. Empty tiers are hidden (only show tiers with at least one entity).
- **Rationale**: Opacity degradation communicates bond-graph distance intuitively without adding color complexity. Hiding empty tiers keeps the section clean. Labels use the API-provided strings.
- **Implications**: CSS opacity on the tier group container. Links navigate to character/group/location detail. Items show both name and type icon (character vs. group).

### Hierarchy Navigation: Breadcrumb + Children

- **Decision**: Breadcrumb trail in the header showing the path from root (e.g., "City › Harbor District › The Docks"). Each segment is clickable. If depth exceeds 3, truncate middle with ellipsis (e.g., "City › … › Harbor District › The Docks") — clicking ellipsis expands full path. Children listed as a "Sub-Locations" section on the detail page, hidden when the location has no children.
- **Rationale**: Breadcrumbs give instant spatial context. Truncation prevents overflow on mobile. Children section surfaces the hierarchy for exploration.
- **Implications**: Breadcrumb needs to resolve the full ancestor chain. The API returns `parent_id` on a single location — client must fetch ancestors (or the list endpoint provides enough context). Sub-locations derived from the location list filtered by `parent_id`.

### Location List: Flat with Hierarchy Hints

- **Decision**: Flat searchable list in the World Browser. Each card shows: location name, parent name as a "← Parent" subtitle (or "(top-level)" if no parent), trait count. Search/filter by name. No tree rendering in the list view.
- **Rationale**: The API returns a flat paginated list. Building a full tree requires fetching all locations upfront, which doesn't scale. Flat list with parent hints gives enough context for navigation.
- **Implications**: List uses standard paginated query. Parent name needs to be resolved (either denormalized by API or client-side join). Search is client-side filter on the current page.

### Empty Presence Tiers: Hidden

- **Decision**: Only show presence tier groups that have at least one entity. No empty placeholders or "None" labels.
- **Rationale**: Empty tiers add noise. If a location only has Tier 1 presence, showing two empty tiers below is unhelpful.
- **Implications**: Filter `presence[]` array to exclude items with empty `items` array before rendering.

### Sub-Locations: Hidden When Empty

- **Decision**: The Sub-Locations section only appears when children exist. Both GM and players see it. Clickable links navigate to child location detail pages.
- **Rationale**: Most locations won't have children. Showing an empty section wastes space. GM manages hierarchy via GM actions (modify_location to set parent_id), not from this section.
- **Implications**: Requires querying locations with `parent_id` matching the current location to find children. This can use the location list query with client-side filtering, or a dedicated query if the dataset is large.

### Breadcrumb Deep Nesting: Truncate Middle

- **Decision**: If the ancestor path exceeds 3 levels, show the root, ellipsis, and the last 2 levels. Clicking the ellipsis expands to show the full path.
- **Rationale**: Deep nesting is rare but possible. Truncation prevents the breadcrumb from dominating the header on mobile. Expandable ellipsis gives access to the full path when needed.
- **Implications**: Breadcrumb component needs expand/collapse state. Ancestor chain must be fully resolved regardless of display truncation.

---

## UI Responsibilities

### World Browser Location List

- Flat searchable list with pagination
- Location cards show: name, parent name (← subtitle or "(top-level)"), trait count
- Search/filter by name
- Clickable to navigate to location detail

### Location Detail Page (`/world/locations/[id]`) — Shared

- **Header**: Location name, breadcrumb to parent (truncated if > 3 levels), description, notes (GM only)
  - GM: [Edit] button for name/description/notes. Hierarchy and traits managed via GM actions panel.
- **Presence section** ("Who's Around"): Labeled tier groups with opacity degradation. Clickable entity links with type icon. Empty tiers hidden.
- **Traits section**: List of feature traits with name and description. Shows count/limit (e.g., "2/5"). GM: manage via GM actions.
- **Bonds section**: List of location bonds with target name (linked), bond label/description. GM: manage via GM actions.
- **Sub-Locations section**: Only shown when children exist. List of child location names, clickable to navigate to their detail pages.
- **Feed section**: Location feed from `GET /locations/{id}/feed`. Standard feed component with "Load more" pagination.

### GM World Management

- Create location form: name, description
- Edit location inline on detail page (name, description, notes)
- All mechanical changes (parent_id, traits, bonds) go through GM actions
- Soft-delete from detail page (confirmation dialog)

### Polling

- Location list: 60s staleTime (moderate cache, GM-managed, infrequent changes)
- Location detail: 60s staleTime
- Location feed: follows feed polling conventions (10s normal, 5s during active session)
