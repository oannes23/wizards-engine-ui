# Groups

> Status: Deepened
> Last verified: 2026-03-27
> Related: [bonds.md](bonds.md), [../api/contract.md#groups](../api/contract.md#groups)

## Overview

Groups are Game Objects representing organizations, crews, families, or guilds. They have a power tier, traits, bonds, and derived membership.

## Key Properties

- **Tier** (integer): Power level. Changed via GM `modify_group` action, not direct PATCH. Display-only in the frontend — no mechanics depend on it.
- **Traits**: Up to 10 `group_trait` slots. Descriptive only (no charges).
- **Bonds**: `group_relation` bonds to other Groups (max 7), `group_holding` bonds to Locations (unlimited).
- **Members**: Derived from bonds — any Character with a bond targeting the Group is a member. The API returns `members[]` pre-computed in the group detail response.

## Associated Clocks

Groups can have associated clocks created via `POST /groups/{id}/clocks`. These appear on the group detail view and the GM clocks page.

---

## Interrogation Decisions

### Group Detail Layout: Stacked Sections

- **Decision**: Vertical scroll with stacked sections: Header (name, tier badge, description) → Members → Traits → Bonds → Clocks → Feed. GM gets inline edit/manage actions. Same page shared by GM and players (GM sees additional controls).
- **Rationale**: Simple, mobile-friendly, and consistent with a scrollable detail page pattern. Groups have fewer sections than characters, so tabs aren't needed.
- **Implications**: No tabs or multi-column layout. Feed uses standard "Load more" pagination.

### Tier Display: Badge After Name

- **Decision**: Compact badge next to the group name showing "Tier N" (e.g., `The Night Watch [Tier 3]`). Shown on both the group list cards and the detail page header.
- **Rationale**: Consistent with status badges elsewhere. Compact and scannable.
- **Implications**: Badge component with tier value. No special color coding needed for tiers.

### Bond Display: Two Sub-Sections

- **Decision**: Split the bonds section into "Relations" (group_relation, max 7) and "Holdings" (group_holding, unlimited). Each sub-section has its own list with clickable entity links and bond descriptions.
- **Rationale**: Relations and holdings are fundamentally different relationships. Mixing them in a flat list obscures the distinction. Showing the slot count (e.g., "2/7") for relations gives the GM context on capacity.
- **Implications**: Client-side filtering of `bonds[]` by `slot_type`. Relations show count/limit; holdings show count only (unlimited).

### Tier Mechanic: Display Only

- **Decision**: Tier is purely informational in the frontend. No formulas, visibility rules, or proposal mechanics reference it. The GM changes it via `modify_group` action for narrative/world-building purposes.
- **Rationale**: The backend treats tier as a simple integer with no derived mechanics. Adding frontend mechanics would require backend changes.
- **Implications**: No tier-dependent UI logic. Resolves the known gap.

---

## UI Responsibilities

### World Browser Group List

- Filterable by name (search input)
- Group cards show: name, tier badge, member count, description snippet
- Clickable to navigate to group detail

### Group Detail Page (`/world/groups/[id]`) — Shared

- **Header**: Group name, tier badge, description, notes (GM only)
  - GM: [Edit] button for name/description/notes. Tier changed via GM actions panel.
- **Members section**: Compact list of member names (derived from bonds). Each clickable → character detail. Shows count.
- **Traits section**: List of group traits with name and description. Shows count/limit (e.g., "3/10"). GM: manage via GM actions (create_trait, modify_trait, retire_trait).
- **Bonds section**: Two sub-sections:
  - **Relations** (group_relation): Count/limit (e.g., "2/7"), list with target group name (linked), bond label/description. GM: manage via GM actions.
  - **Holdings** (group_holding): Count, list with target location name (linked), bond label/description. GM: manage via GM actions.
- **Clocks section**: Associated clocks with clock visualization (ClockBar), name, progress (M/N). GM: create new clock. Clickable for clock detail.
- **Feed section**: Group feed from `GET /groups/{id}/feed`. Standard feed component with "Load more" pagination.

### GM World Management

- Create group form: name, description
- Edit group inline on detail page (name, description, notes)
- All mechanical changes (tier, traits, bonds) go through GM actions
- Soft-delete from detail page (confirmation dialog)

### Polling

- Group list: 60s staleTime (moderate cache, GM-managed, infrequent changes)
- Group detail: 60s staleTime
- Group feed: follows feed polling conventions (10s normal, 5s during active session)

---

## Resolved Gaps

- ~~Whether group tier affects any game mechanics visible in the frontend~~ — No, tier is purely display-only in the frontend.
