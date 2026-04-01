# Users

> Status: Deepened
> Last verified: 2026-03-26
> Related: [../architecture/auth.md](../architecture/auth.md), [characters.md](characters.md)

## Overview

Users represent the real people playing the game. Each user has a role (GM or player), an optional linked character, and a magic-link login code.

## Key Properties

- **display_name**: Editable via `PATCH /me`
- **role**: `"gm"` or `"player"` — immutable after creation
- **character_id**: Links to the user's PC (null for GM without a character)
- **login_code**: Used for magic-link auth. Rotatable via `POST /me/refresh-link`

## Two Roles

| Role | Count | Can Do |
|------|-------|--------|
| `gm` | Exactly 1 | Everything: approve/reject proposals, manage world, run sessions, GM actions |
| `player` | 4–6 | Submit proposals, view own character, explore visible world, write story entries |

## Player Management (GM)

- `GET /players` — list all users (GM sees `login_url`; players see it omitted)
- `POST /players/{id}/regenerate-token` — rotate a player's login code (GM only)

## Invites

GM generates invite codes for new players:

- `POST /game/invites` — generate invite code, returns `{id, is_consumed, login_url}`
- `GET /game/invites` — list all invites (paginated)
- `DELETE /game/invites/{id}` — delete unconsumed invite (409 if consumed)

When a new player visits the invite's magic link:
1. `POST /auth/login` with the code returns `{}` (invite signal)
2. Frontend shows the join form
3. `POST /game/join` with `{code, character_name, display_name}` creates user + character atomically

## Profile

The profile page shows:
- Display name (editable)
- Role badge
- Starred objects list
- Refresh magic link button

## UI Responsibilities

- **Profile Page** (`/profile`): Display name edit, starred feed link, refresh magic link button
- **GM Players Page** (`/gm/players`): Player roster with login links, invite management
- **Auth Provider**: Store user identity in React Context for role-based rendering

---

## Interrogation Decisions (2026-03-26)

### Starred Objects: On Feed Page + Profile Link

- **Decision**: Starred game objects appear as a clickable list on the Feed page sidebar/section, alongside the main feed stream. Profile page also links to the starred feed.
- **Rationale**: The Feed page is the player's home base — surfacing starred objects here keeps important entities one tap away without leaving the primary view.
- **Implications**: Feed page renders `GET /me/starred` as a compact list of entity links (type icon + name). Profile page retains the starred feed link for chronological activity view. Star/unstar happens on entity detail pages.

### Invite Display: All with Status Badges

- **Decision**: GM invites page shows both consumed and unconsumed invites
- **Rationale**: Gives GM full visibility into invite history. Consumed invites are greyed out with "Used" badge. Unconsumed invites show copy-link button and delete action.
- **Implications**: Single list, no tabs. Uses `InviteResponse.is_consumed` for conditional styling. Note: no `consumed_by` field exists — consumed invites don't show which player used them.
