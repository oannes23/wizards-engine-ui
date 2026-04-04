# GM Views

> Status: Deepened
> Last verified: 2026-03-27
> Related: [components.md](components.md), [../domains/proposals.md](../domains/proposals.md), [../domains/sessions.md](../domains/sessions.md)

## GM Dashboard / Queue (`/gm`) — Primary View

The GM's main workspace. Proposal queue with PC status sidebar.

### Layout

**Desktop**: Proposal queue (main column) + right sidebar with active session card and PC summary cards (name, mini meter bars, stress alerts).

**Mobile**: Active session card at top → proposal queue → PC summaries as collapsible section.

### Queue Tabs

- **Queue tab**: Pending proposals. System proposals (`origin: "system"`) pinned at top with visually distinct styling (different border color, system icon) but not blocking — GM can scroll past. Player proposals sorted **oldest-pending-first** (FIFO). Revision count badge on resubmitted proposals (e.g., "Revised 2x").
- **Recent tab**: Approved/rejected proposals. Defaults to ~20 items, "Load more" paginates back indefinitely.

### ProposalCard

**Collapsed**: Action type badge, character name, narrative excerpt, dice pool summary, relative timestamp. [Approve] [Reject] buttons visible.

**Expanded (via Options toggle)**:
- Full narrative text
- Selections detail (skill, modifiers, sacrifices, etc.)
- Calculated effect summary (CalculatedEffectCard)
- **Override options**: Narrative override textarea, gm_overrides checkboxes (force, bond_strained)
- **Magic overrides** (magic proposals only, collapsed sub-panel): actual_stat, style_bonus, effect_details form
- **Rider event**: "+ Add Rider" → compact GM action type-selector. For `work_on_project` proposals with a `clock_id`, **pre-fill** a `clock.advanced` rider targeting the associated clock. GM can accept, modify, or remove before confirming.
- Approve button (applies overrides if set)
- Reject section: rejection note textarea + Reject button

### System Proposals

Inline form cards (not Approve/Reject):
- **resolve_trauma**: Bond selector dropdown + trauma name/description fields + [Resolve]
- **resolve_clock**: Narrative textarea + [Resolve]
- Both support optional rider events

### PC Status Sidebar

From `GET /gm/dashboard`:
- Character name, mini meter bars (stress, FT, plot, gnosis)
- Stress warning indicator when near effective max
- Clickable to navigate to character detail

### Polling

Queue: 10s normal, 5s active session.

---

## GM Event Feed (`/gm/feed`)

Tabs: **All** | **Silent** | **Filter**

### All Tab
Standard feed with GM-level visibility. Same compact event cards as player feed.

### Silent Tab
GM audit log — events with `visibility: "silent"`. Sorted newest-first.

### Filter Mode
Opens advanced filter panel: event type multi-select, target type, actor type, session selector, date range pickers. Filters apply to the All tab query. Filter state stored in URL query params.

### Polling
15s normal, 5s active session.

---

## GM Actions (`/gm/actions`)

14 GM action types with type-selector → dynamic form.

### Layout

Action type dropdown (grouped: Modify, Bond, Trait, Effect, XP) → target entity search → dynamic form fields → narrative (optional) → [Execute] button. Recent actions history below.

### Single / Batch Mode Toggle

- **Single mode**: Fill form → Execute immediately.
- **Batch mode**: Fill form → "Add to Batch" → action appears in a numbered list below. Edit (✎) or remove (×) individual items. "Execute Batch (N)" runs all atomically via `POST /gm/actions/batch`. Validation errors map to specific action indices with inline error display.

### Action Types Grouped by Purpose

**Modify entities:**
- `modify_character` — delta/set meters, update skills/magic_stats/attributes
- `modify_group` — change tier
- `modify_location` — change parent_id
- `modify_clock` — advance progress

**Bond management:**
- `create_bond` — new bond between two Game Objects
- `modify_bond` — change charges, degradation, labels
- `retire_bond` — set bond to inactive

**Trait management:**
- `create_trait` — new trait on entity
- `modify_trait` — change charges, description
- `retire_trait` — set trait to inactive

**Effect management:**
- `create_effect` — new magic effect on character
- `modify_effect` — change charges, power level
- `retire_effect` — set effect to inactive

**XP:**
- `award_xp` — grant magic stat XP to character

### Changes Field

Operations: `delta` (relative change) and `set` (absolute value).
```json
{"stress": {"op": "delta", "value": 2}}
{"free_time": {"op": "set", "value": 10}}
```

---

## GM Sessions (`/gm/sessions`)

Status-sectioned list: Active (pinned), Draft, Ended (collapsed). Inline collapsible create form. See [domains/sessions.md](../domains/sessions.md) for full detail.

Shared session detail page at `/sessions/[id]` — GM sees lifecycle controls, participant management, edit buttons.

---

## GM World Management (`/gm/world`)

Uses the same 4-tab World Browser as players (`/world`) but with additional GM controls on entity detail pages:

- Create buttons on each tab (New Character, New Group, New Location, New Story)
- Edit buttons on detail page headers (name/description/notes via PATCH)
- Mechanical changes (traits, bonds, effects, meters, tier) via GM Actions — accessible from detail pages or the standalone GM Actions page
- Soft-delete on detail pages (ConfirmModal)

### Create Forms

| Form | Key Fields |
|------|-----------|
| New Character (NPC) | `name`, `description?`, `notes?`, `detail_level: "simplified"` |
| New Group | `name`, `description?`, `notes?` |
| New Location | `name`, `description?`, `parent_id?`, `notes?` |
| New Story | `name`, `summary?`, `tags?`, `visibility_level` |

---

## Players & Invites (`/gm/players`)

Two sections on one page:

### Players Section
List of all users: display name, role badge, character EntityLink, login URL (copy button).

### Invites Section
- "Generate New Invite" button → creates invite, displays link with copy button
- Invite list: invite code, consumed/unconsumed status badge, consumed by (if applicable), delete button for unconsumed invites

---

## Trait Templates (`/gm/templates`)

List + inline create:
- Table/list of all templates with name, type badge (core/role), description
- Type filter dropdown (All / Core / Role)
- Inline edit: click edit → fields become editable → Save/Cancel
- Collapsible "New Template" form at top: name, description, type selector (immutable after creation)
- Soft-delete with ConfirmModal

---

## Clocks (`/gm/clocks`)

Grid of clock cards:
- Each card: name, ClockBar (segmented progress), M/N numeric label, associated entity EntityLink (if any)
- Near-completion highlight: amber border when progress > 75%
- Completed clocks: distinct styling (e.g., green border, checkmark)
- "New Clock" button → form: name, segments (number), associated entity (optional search), notes
- Filter: All / Active / Completed / By Entity
- Edit: name, notes, segments. Advance progress via GM Actions (modify_clock).
- Soft-delete with ConfirmModal

---

## GM Character (`/gm/character`)

If the GM has a linked character (`character_id` on User): shows the same character sheet as the player view. Access via "My Character" in the More dropdown.

If no character linked: shows a "Create Your Character" prompt with `POST /me/character` form.

---

## Interrogation Decisions

### GM Dashboard: Queue + PC Sidebar

- **Decision**: Desktop: proposal queue (main) + right sidebar with active session card and PC summary cards. Mobile: active session card at top, queue below, PC summaries collapsible.
- **Rationale**: The GM needs proposal context (PC states) while reviewing. The sidebar provides at-a-glance awareness without navigating away.
- **Implications**: Sidebar fetches from `GET /gm/dashboard` (pending_proposals count + pc_summaries). Stress alerts highlight characters near max.

### GM Actions: Type Selector + Dynamic Form

- **Decision**: Grouped action type dropdown → target entity search → dynamic form → [Execute]. Recent actions history below. Single/Batch mode toggle.
- **Rationale**: A single page for all 14 action types keeps the GM's workflow consolidated. The grouped dropdown organizes by purpose. Recent history provides audit context.
- **Implications**: Each action type has a form schema. Target search uses entity list queries. Recent history from event feed.

### Batch Mode: In MVP, Add-to-List Builder

- **Decision**: Include batch mode in MVP. Toggle between Single and Batch. In Batch: fill form → "Add to Batch" adds to a numbered list. Edit/remove individual items. "Execute Batch" runs atomically. Validation errors map to action indices.
- **Rationale**: Batch mode is valuable for session prep (setting up multiple characters) and post-session bookkeeping. The API supports it natively.
- **Implications**: Batch list stored in component state. Each item editable via inline form. `POST /gm/actions/batch` with indexed error handling.

### Players & Invites: Two Sections

- **Decision**: Single page with Players section (user list with roles, character links, login URLs) and Invites section (generate, list, delete unconsumed).
- **Rationale**: Small page, rarely visited. Two sections on one page is simpler than tabs.
- **Implications**: Users from `GET /users`. Invites from `GET /game/invites`. Generate via `POST /game/invites`.

### Templates: List + Inline Create

- **Decision**: Table/list with type filter, inline edit, collapsible create form at top. Type immutable after creation.
- **Rationale**: Simple CRUD for a small catalog. Inline editing is faster than modals for quick changes.
- **Implications**: Templates from `GET /trait-templates`. CRUD via POST/PATCH/DELETE.

### Clocks: Grid with Progress Bars

- **Decision**: Grid of clock cards with ClockBar, M/N labels, entity links. Near-completion highlight (>75%). Create form. Filterable by entity and status.
- **Rationale**: Visual grid lets the GM scan all clocks at a glance. Near-completion highlighting surfaces urgency. ClockBar (linear, not pie) works for all segment counts.
- **Implications**: Clocks from `GET /clocks`. Create via `POST /clocks` or `POST /{entity}/clocks`. Progress advanced via GM Actions (modify_clock).
