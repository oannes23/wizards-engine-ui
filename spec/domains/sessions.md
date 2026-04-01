# Sessions

> Status: Deepened
> Last verified: 2026-03-27
> Related: [characters.md](characters.md), [../api/contract.md#sessions](../api/contract.md#sessions)

## Overview

Sessions represent play sessions. They have a strict lifecycle and drive resource distribution (Free Time, Plot) to participants.

## Session Lifecycle

```
Draft → Active → Ended
```

- **Draft**: Created by GM. Set `time_now`, date, summary, notes. Add/remove participants. Editable.
- **Active**: Started by GM (`POST /sessions/{id}/start`). FT and Plot distributed. Only one active session at a time (409 if another exists).
- **Ended**: Ended by GM (`POST /sessions/{id}/end`). Plot clamped to 5 for all participants. Read-only.

### Constraints

- Draft sessions can be hard-deleted. Active/ended cannot (400).
- `time_now` is an abstract integer representing campaign time passage.
- `additional_contribution` flag on participants can only be changed during Draft (400 after start).

## Resource Distribution on Start

When a session transitions from Draft to Active:

- **Free Time**: Distributed to all participants based on the `time_now` delta from their `last_session_time_now`. The exact formula is server-side.
- **Plot**: +1 base for all participants, +2 additional if `additional_contribution` is true.

## Plot Clamping on End

When a session ends, each participant's Plot is clamped to `PLOT_MAX (5)`.

## Participants

- Added via `POST /sessions/{id}/participants` with `{ character_id, additional_contribution? }`
- Removed via `DELETE /sessions/{id}/participants/{character_id}`
- Contribution flag updated via `PATCH /sessions/{id}/participants/{character_id}` (draft only)

Players can add/remove themselves (Owner auth). GM can manage all participants.

### Start Confirmation

- **Decision**: Modal shows time_now delta only: "time_now will advance from X to Y. Free Time and Plot will be distributed to N participants." No exact per-participant FT numbers.
- **Rationale**: FT distribution formula is server-side. Showing the delta provides context without requiring formula knowledge.

### Session Edge Cases

- **Decision**: Re-join after leaving is allowed (DELETE + POST for same character succeeds). No double-distribution protection — GM corrects overshoot via direct actions. Backend allows starting with 0 participants; frontend shows a confirmation dialog: "No participants added. Starting will distribute nothing. Continue anyway?" (allows GM solo prep sessions). time_now is non-negative, must be >= last ended session's time_now (equal values allowed, producing 0 FT delta). additional_contribution grants +2 Plot (vs +1 base), is a narrative+mechanical toggle (GM convention like "MVP", "notable RP"), locks on session start.

## Timeline

`GET /sessions/{id}/timeline` returns a paginated, visibility-filtered list of events that occurred during the session. This is the session's event feed.

---

## Interrogation Decisions

### GM Sessions List: Status Sections

- **Decision**: Three sections on the list page — Active (pinned at top, max 1), Draft, Ended (collapsed by default with "Show ended" toggle).
- **Rationale**: Active session is the most important; ended sessions are archival. Sections are more scannable than tabs for a short list.
- **Implications**: No separate tabs or pagination needed for MVP. Section collapse state is ephemeral (not persisted).

### GM Dashboard: Active Session Card

- **Decision**: When a session is active, show a prominent card at the top of the GM Dashboard with session name, participant count, and quick links to session detail and the proposal queue.
- **Rationale**: Active sessions are the GM's primary operating context. Surfacing it on the dashboard prevents missed state.
- **Implications**: Dashboard needs to consume `useActiveSession()` hook. Card disappears when no session is active.

### Session Create Form: Inline on List Page

- **Decision**: Collapsible inline form at the top of the GM Sessions list page. Fields: `time_now` (number input), date (date picker), summary (single line), notes (textarea). "Create Draft" button. Editing happens on the detail page (Edit button in header).
- **Rationale**: Sessions are created infrequently; a dedicated route is overkill. Inline keeps context. Editing on the detail page where all session info is visible.
- **Implications**: No `/gm/sessions/new` route. The detail page needs an edit mode for the header fields.

### Session Detail: Header + Tabs (Shared Page)

- **Decision**: Sticky header with session info (name, status badge, date, time_now, summary) and lifecycle controls. Two tabs below: "Participants" (management table) and "Timeline" (event feed). Same page shared by GM and players — players see reduced controls (join/leave self only, no lifecycle buttons, no add/remove others, read-only for ended sessions).
- **Rationale**: Tabs keep the page focused. Shared page avoids duplicating layouts. Role-based visibility follows the pattern established in other domain detail pages (`isGm` prop).
- **Implications**: Route is `/sessions/[id]` (not under `/gm/`). Layout determines which controls render. Player can view any session they have visibility to.

### Start Session Confirmation: Full Preview Modal

- **Decision**: Modal showing participant list with their current FT and Plot values, the `time_now` value and delta, and a note explaining that FT will be distributed based on time_now delta and Plot will be +1 base (+2 with contribution). Requires explicit "Start Session" button.
- **Rationale**: Starting a session has irreversible mechanical consequences (resource distribution). Showing current meter values helps the GM catch issues (e.g., a character already at max FT).
- **Implications**: Modal needs to fetch current character meter data for all participants. The `time_now` delta is computed client-side from `time_now - participant.last_session_time_now`.

### End Session Confirmation: Warn If Lossy

- **Decision**: Simple confirm dialog. If any participant has Plot > 5, show a warning listing who will lose Plot and by how much (e.g., "Maren: 7 → 5 (-2)"). Otherwise, just "End session?".
- **Rationale**: Plot clamping is usually a no-op (Plot rarely exceeds 5). Only warn when there's actual data loss.
- **Implications**: Modal needs to check current Plot values of participants. Can reuse participant data already loaded on the detail page.

### Add Participant: Searchable Dropdown + Add All

- **Decision**: "Add Participant" button opens a searchable dropdown of all PCs (full characters) not yet in the session. Select to add immediately (contribution defaults to false). Also an "Add All" button to add all remaining PCs at once. Inline remove (X button) per participant row. Contribution flag toggled inline.
- **Rationale**: Most sessions include all or most PCs. "Add All" then remove exceptions is the fastest workflow. Inline actions keep the flow tight.
- **Implications**: Needs to fetch character list and diff against current participants. "Add All" fires multiple `POST /sessions/{id}/participants` calls (or batch — check API). Remove fires `DELETE`.

### Player Session Experience: Banner + Full List

- **Decision**: When a session is active, show a persistent banner across all player pages: "[Session name] active" with a Join button (if not joined) or "Joined" status + Leave button (if joined). Banner links to the full player Sessions list page.
- **Rationale**: Players need to know a session is active without navigating to a separate page. The banner is lightweight and always visible. Full list page gives players a complete history.
- **Implications**: Banner consumes `useActiveSession()`. Needs participant status check for the player's character. Banner renders in the player layout component. Adds `/sessions` route to the player nav (or accessible from banner link).

### Player Sessions List: All Sessions Visible

- **Decision**: Reverse-chronological list of all non-deleted sessions. Each card shows: status badge, date, participant count, and the player's participation status ("Joined" / "Not joined"). Active/draft sessions show Join/Leave actions inline. Contribution toggle visible on draft sessions the player has joined.
- **Rationale**: Full transparency — players should see the campaign's session history even if they missed a session. Participation status helps them track their involvement.
- **Implications**: Player list page shows all sessions from `GET /sessions`, not filtered by participation. Client-side checks participant list to show status.

### Player Ended Session Detail: Read-Only Shared Page

- **Decision**: Clicking any session in the player list navigates to the shared session detail page. Ended sessions are fully read-only for everyone. Players can browse the timeline tab.
- **Rationale**: Session timelines are valuable historical records. Reusing the shared detail page avoids duplicate UI.
- **Implications**: No additional routes or components needed beyond the shared detail page.

### Contribution Flag: Toggle with Tooltip

- **Decision**: Labeled toggle/checkbox: "Additional contribution (+2 Plot)". Visible on both the player session list (inline) and the session detail participant row. Disabled with explanatory tooltip after session starts ("Can only change during draft").
- **Rationale**: Players need to understand what the flag does and when they can change it. Tooltip prevents confusion about the disabled state.
- **Implications**: Contribution toggle calls `PATCH /sessions/{id}/participants/{character_id}`. Disabled state derived from `session.status !== 'draft'`.

---

## UI Responsibilities

### GM Sessions Page (`/gm/sessions`)

- Status-sectioned list: Active (pinned), Draft, Ended (collapsed)
- Inline collapsible create form at top
- "New Session" button to expand form
- Session cards show: name/summary, date, status badge, participant count

### Session Detail Page (`/sessions/[id]`) — Shared

- **Header**: Session name, status badge, date, `time_now`, summary, notes
  - GM Draft: [Edit] [Delete] [Start Session] buttons
  - GM Active: [Edit] [End Session] buttons
  - GM Ended: Read-only
  - Player Draft (not joined): [Join] button
  - Player Draft (joined): Contribution toggle, [Leave] button
  - Player Active (not joined): [Join] button
  - Player Active (joined): [Leave] button
  - Player Ended: Read-only
- **Participants tab**: Table with character name, current FT, current Plot, contribution flag, remove button (GM only, draft/active only). "Add Participant" searchable dropdown + "Add All" button (GM only, draft/active only).
- **Timeline tab**: Paginated event feed from `GET /sessions/{id}/timeline`. "Load more" button.

### Player Active Session Banner

- Persistent banner in player layout when any session is active
- Shows: session name, participation status
- Actions: Join (if not joined), Leave (if joined)
- Links to `/sessions` list page and `/sessions/[id]` detail

### GM Dashboard Active Session Card

- Prominent card at top of GM dashboard when a session is active
- Shows: session name, participant count
- Quick links to session detail and proposal queue (with pending count)

### Polling

- `GET /sessions` list: 60s staleTime (moderate cache)
- `GET /sessions/{id}` detail: 30s when viewing a non-ended session
- Active session detection: `useActiveSession()` hook (60s staleTime)
- Session timeline: follows feed polling conventions (10s normal, 5s during active session)

---

## Resolved Gaps

- ~~Exact FT distribution formula~~ — Server-side only. Frontend shows "FT will be distributed based on time_now delta" in the start confirmation. No client-side formula needed.
- ~~Whether the GM dashboard shows the active session prominently~~ — Yes, active session card pinned at top of dashboard.
