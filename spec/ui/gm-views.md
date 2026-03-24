# GM Views

> Status: Draft
> Last verified: 2026-03-23
> Related: [components.md](components.md), [../domains/proposals.md](../domains/proposals.md), [../domains/sessions.md](../domains/sessions.md)

## GM Queue (`/gm`) — Primary View

The GM's main workspace. Lists pending proposals with accordion expand.

### Layout

- System proposals (`origin: "system"`) shown first with urgency indicators
- Player proposals sorted by `created_at` (oldest first)
- Badge on Queue nav tab shows pending count
- Polling at 10–15s

### ProposalCard (Accordion)

**Collapsed**: Action type badge, character name, narrative excerpt, timestamp

**Expanded**:
- Full narrative text
- Selections detail (skill, modifiers, sacrifices, etc.)
- Calculated effect summary (dice pool, costs)
- Character's current state snapshot (meters near limit, charge counts)
- **Approve section** (expandable):
  - Narrative override textarea (optional)
  - GM overrides checkboxes (force, bond_strained, etc.) — hidden by default, toggle to reveal
  - Rider event section (optional) — mini GM Actions form
  - Approve button
- **Reject section**:
  - Rejection note textarea (optional)
  - Reject button

### Design Goal

Most approvals should be a single click. Override options are opt-in expansions. System proposals (resolve_trauma, resolve_clock) must surface GM-required fields prominently.

### Queue Summary

`GET /gm/queue-summary` provides contextual cards (PC summaries, group states) alongside the queue. Display as a sidebar on desktop, collapsible section on mobile.

## GM Event Feed (`/gm/feed`)

Tabs: **All** | **Silent**

### All Tab
DataTable with filters:
- Event type (dropdown)
- Target type and ID
- Actor type
- Session
- Date range (since/until)

### Silent Tab
GM audit log — events with `visibility: "silent"` that don't appear in normal feeds. Same DataTable format.

## GM World Management (`/gm/world`)

Hub page with links to create/view game objects by type. Three sections: Characters, Groups, Locations.

### Create Forms

| Form | Key Fields |
|------|-----------|
| New Character (NPC) | `name`, `description?`, `notes?`, `attributes?` |
| New Group | `name`, `tier`, `description?`, `notes?` |
| New Location | `name`, `description?`, `parent_id?`, `notes?` |

### Edit Pages

Character/group/location edit pages use **GM actions** for mechanical changes (traits, bonds, effects, meters), not direct PATCH. Direct PATCH is used only for name/description/notes.

The edit page is essentially a scoped GM actions launcher:
- Add/remove traits via `create_trait` / `retire_trait`
- Add/remove bonds via `create_bond` / `retire_bond`
- Modify meters via `modify_character`
- Add effects via `create_effect`

## GM Actions (`/gm/actions`)

The 14 GM action types with a type-selector → dynamic form pattern.

### Action Types Grouped by Purpose

**Modify entities:**
- `modify_character` — delta/set meters, update fields
- `modify_group` — change tier, update fields
- `modify_location` — change parent, update fields
- `modify_clock` — advance progress, update fields

**Bond management:**
- `create_bond` — new bond between two Game Objects
- `modify_bond` — change charges, degradation
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

### Batch Mode

`POST /gm/actions/batch` accepts 1–50 actions atomically. The UI should support building a list of actions and executing them together. Each action in the batch has its own mini-form. Validation errors must be mapped back to the specific action index.

### Changes Field

The `changes` object varies by target type:
```json
// modify_character
{"stress": {"op": "delta", "value": 2}}
{"free_time": {"op": "set", "value": 10}}

// modify_clock
{"progress": {"op": "delta", "value": 1}}
```

Operations: `delta` (relative change) and `set` (absolute value).

## Sessions (`/gm/sessions`)

### Session List

All sessions with status badges. "Create Session" button.

### Session Detail (`/gm/sessions/[id]`)

- Session info (time_now, date, summary, notes)
- Participant list with add/remove and contribution toggle
- Lifecycle controls:
  - **Start**: Draft → Active. Warning: "This will distribute FT and Plot to participants." Disabled if another session is active.
  - **End**: Active → Ended. Warning: "Plot will be clamped to 5 for all participants."
  - **Delete**: Draft only. Confirmation dialog.
- Session timeline feed

## Players & Invites (`/gm/players`)

- Player roster with display names, roles, login links (copyable)
- Regenerate token button per player
- Invite management:
  - Generate new invite button → displays link
  - Invite list (consumed/unconsumed status)
  - Delete unconsumed invites

## Templates (`/gm/templates`)

Trait template catalog CRUD:
- List with name, type (core/role), description
- Create form: name, description, type (immutable after creation)
- Edit: name, description (type immutable)
- Delete (soft-delete)

## Clocks (`/gm/clocks`)

Clock management grid:
- Each clock shows ClockSvg, name, progress/segments, associated entity badge
- Create form: name, segments, associated entity (optional), notes
- Edit: name, notes, segments
- Delete (soft-delete)
- Visual indicator for near-completion clocks

## GM Character (`/gm/character`)

If the GM has a linked character (`character_id` on User), this page shows the same character sheet as the player view. Access via "My Character" in the More dropdown.

If no character is linked, show option to create one via `POST /me/character`.
