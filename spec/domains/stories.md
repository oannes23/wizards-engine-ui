# Stories

> Status: Deepened
> Last verified: 2026-03-27
> Related: [events-and-feeds.md](events-and-feeds.md), [../api/contract.md#stories](../api/contract.md#stories)

## Overview

Stories are narrative arcs — named containers with entries, owners, and visibility settings. They support sub-arcs via parent/child hierarchy.

## Key Properties

- **Status**: `active`, `completed`, `abandoned`
- **Tags**: String array for categorization (e.g., `["investigation", "downtime"]`)
- **Parent**: Stories can nest via `parent_id` for sub-arcs
- **Visibility**: `visibility_level` + `visibility_overrides[]` control who can see the story
- **Owners**: Polymorphic — can be Characters, Groups, or Locations. Added/removed by GM.

## Story Entries

Narrative text entries within a story:

- Any authenticated user can add entries (`POST /stories/{id}/entries`) regardless of story status
- Body: `{ text, character_id?, game_object_refs? }`
- Author is auto-set from the authenticated user
- Owners and GM can edit/delete entries

Story entries appear in feeds alongside events (as `type: "story_entry"` items).

---

## Interrogation Decisions

### Story Detail Layout: Journal-Style

- **Decision**: Header (name, status badge, tags as chips, summary, owners as linked names) → Parent link (if applicable) → Sub-arcs section (if children exist) → Entry creation input (always visible) → Entries in reverse-chronological order (newest first). Like a journal / shared fiction log. Entry authors see edit/delete buttons on their own entries. GM sees edit/delete on all entries plus story-level edit controls.
- **Rationale**: Stories are fundamentally a writing space. Journal-style with newest entries at the top encourages regular contribution and makes it easy to see recent activity. Entry input at the top (before entries) reduces friction.
- **Implications**: Entries paginated with "Load more" at the bottom (older entries). Shared page for GM and players with role-based controls.

### Entry Creation: Always-Visible Textarea

- **Decision**: Multi-line textarea always visible at the top of the entries area with placeholder "Write an entry...". Submit via "Add Entry" button. Character attribution auto-set from the player's character (`character_id`). GM can choose which character to attribute via a dropdown (or no character). `game_object_refs` deferred to post-MVP — not in the entry creation form.
- **Rationale**: "Low-friction" is the design goal. An always-visible input is the lowest friction possible — no clicks to start writing. Auto-attribution eliminates a step for players.
- **Implications**: Entry input component with textarea + character selector (GM only) + submit button. Optimistic update on submit (append entry to list immediately).

### Entry Editing: Inline

- **Decision**: Clicking the edit button transforms the entry text into an editable textarea in-place. Save/Cancel buttons appear below. Changes saved via `PATCH /stories/{id}/entries/{entry_id}`.
- **Rationale**: Inline editing matches the low-friction design goal. No modal or navigation needed.
- **Implications**: Entry component has a display/edit state toggle. Only the entry's `text` field is editable.

### Story Status: Always Open for Entries

- **Decision**: All story statuses (active, completed, abandoned) allow new entries and editing of existing entries. Status is a narrative label, not a lock. Only the GM changes status via `PATCH /stories/{id}`.
- **Rationale**: Players may want to add retrospective entries, epilogue notes, or corrections to completed stories. Locking would add friction without clear benefit in a narrative game.
- **Implications**: Entry input is always visible regardless of status. No status-based entry locking logic needed.

### Sub-Stories: Section Below Header

- **Decision**: If the story has a parent, show a breadcrumb link ("← Parent Story Name") above the story name. If the story has children (sub-arcs), show a "Sub-arcs" section between the header and the entry input, listing child stories as clickable cards with name and entry count.
- **Rationale**: Parent link gives upward navigation. Sub-arcs section surfaces the hierarchy without requiring users to go back to the stories list. Positioned before entries so the narrative structure is clear before diving into content.
- **Implications**: Sub-arcs require querying stories with `parent_id` matching the current story. Parent link uses the `parent_id` field from the story response.

### My Stories: Compact Card List

- **Decision**: On the Player Feed Page, a "My Stories" sidebar/section showing active stories where the player's character is an owner. Each card: story name, status dot (filled for active, outline for completed/abandoned), latest entry preview (truncated), entry count. Completed/abandoned stories shown below active ones. Clickable to story detail.
- **Rationale**: Gives players instant access to their narrative arcs without navigating away from the feed. Latest entry preview encourages engagement.
- **Implications**: Requires filtering the stories list by owner (player's character_id). Needs denormalized latest entry text (or client-side extraction from the entries array).

### Story List: Filterable

- **Decision**: Paginated list in the World Browser with filter controls: status dropdown (default: "active"), tags multi-select, and search by name. Cards show: name, status badge, tags as chips, owner names (linked), entry count. Clickable to story detail.
- **Rationale**: Stories accumulate over time. Filters let players and GM find relevant stories quickly. Defaulting to "active" shows current narrative arcs.
- **Implications**: Query params: `?status=active&tag=investigation&limit=20`. Tags filter may need to be client-side if the API doesn't support tag filtering (check contract).

---

## UI Responsibilities

### Player Feed Page — My Stories Section

- Compact card list of stories owned by the player's character
- Active stories first, then completed/abandoned
- Each card: name, status dot, latest entry preview, entry count
- Clickable to story detail

### World Browser Story List

- Filterable paginated list
- Filters: status (default: active), tags (multi-select), search by name
- Story cards: name, status badge, tags, owner names, entry count
- Clickable to story detail

### Story Detail Page (`/world/stories/[id]`) — Shared

- **Parent link**: "← Parent Story Name" breadcrumb if story has a parent
- **Header**: Story name, status badge, tags as chips, summary, owners list (linked names)
  - GM: [Edit] for name/summary/status/tags/visibility. Manage owners (add/remove).
- **Sub-arcs section**: Only shown when children exist. List of child story cards with name and entry count. Clickable.
- **Entry input**: Always-visible multi-line textarea + "Add Entry" button. Character auto-attributed for players. GM sees character selector dropdown. Visible regardless of story status.
- **Entries list**: Reverse-chronological (newest first). Each entry: author character name, relative timestamp, text content. Authors see [Edit] [Delete] buttons. GM sees these on all entries. "Load more" pagination for older entries.

### Entry Interaction

- **Create**: Submit textarea → optimistic append to list → POST to API
- **Edit**: Click edit → textarea replaces text in-place → Save/Cancel
- **Delete**: Click delete → confirmation → soft-delete via API → remove from list

### Proposal Wizard Integration

- `work_on_project` action type includes a story selector (searchable dropdown of active stories the character owns or is visible to)

### Polling

- Story list: 30s staleTime (moderate cache, entries added by any player)
- Story detail: 30s staleTime (entries may be added during active play)
- My Stories on feed page: follows feed polling conventions

## Design Note

Stories are the primary outlet for player narrative agency between proposals. The UI should make entry creation feel low-friction — always-visible textarea, not a modal. Think "shared journal" rather than "document editor."
