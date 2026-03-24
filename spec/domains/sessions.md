# Sessions

> Status: Draft
> Last verified: 2026-03-23
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

## Timeline

`GET /sessions/{id}/timeline` returns a paginated, visibility-filtered list of events that occurred during the session. This is the session's event feed.

## UI Responsibilities

### GM Sessions Page (`/gm/sessions`)

- Session list with status badges (Draft/Active/Ended)
- Create new session form (time_now, date, summary, notes)

### GM Session Detail (`/gm/sessions/[id]`)

- Session info display
- Participant management (add/remove characters, toggle contribution flag)
- Lifecycle controls:
  - **Start button**: Only on Draft sessions. Warn about FT/Plot distribution. Disabled if another session is active.
  - **End button**: Only on Active sessions. Warn about Plot clamping.
- Session timeline feed

### Polling

Poll `GET /sessions/{id}` at 30s when viewing a non-ended session.

## Known Gaps

- Exact FT distribution formula based on `time_now` delta
- Whether the GM dashboard shows the active session prominently
