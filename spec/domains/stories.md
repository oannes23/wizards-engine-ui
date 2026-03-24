# Stories

> Status: Draft
> Last verified: 2026-03-23
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

- Any authenticated user can add entries (`POST /stories/{id}/entries`)
- Body: `{ text, character_id?, game_object_refs? }`
- Author is auto-set from the authenticated user
- Owners and GM can edit/delete entries

Story entries appear in feeds alongside events (as `type: "story_entry"` items).

## UI Responsibilities

- **World Browser**: Story list, filterable by status, tag, owner
- **Story Detail Page**: Name, summary, status, tags, owners list, entries list with add/edit/delete
- **Player Feed**: Story entries merged with events in chronological order
- **Proposal Wizard**: Story selector for `work_on_project` action type

## Design Note

Stories are the primary outlet for player narrative agency between proposals. Players can add entries to stories they're associated with, creating a shared fiction log. The UI should make entry creation feel low-friction — inline editing, not a modal.
