# Users

> Status: Draft
> Last verified: 2026-03-23
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

- **Profile Page** (`/profile`): Display name edit, starred list, refresh link
- **GM Players Page** (`/gm/players`): Player roster with login links, invite management
- **Auth Provider**: Store user identity in React Context for role-based rendering
