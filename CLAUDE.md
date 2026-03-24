# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **greenfield React + Next.js frontend** for the Wizards Engine API — a backend state tracker for a narrative tabletop RPG campaign. The comprehensive design document is `FRONTEND_SEED.md`. The backend is a separate FastAPI server; this repo is purely the frontend consumer.

Two user roles with distinct UIs: **Player** (owns one character, submits proposals, explores world) and **GM** (full control, reviews proposals, manages sessions and game state).

## Tech Stack

- **Next.js** with App Router and TypeScript
- **Cookie-based auth** — all API requests need `credentials: 'include'` for cross-origin cookie auth
- Backend API base: `/api/v1/` — configure backend URL via environment variable
- CORS: backend's `CORS_ORIGINS` must include this frontend's origin

## Build & Dev Commands

```bash
pnpm install         # install dependencies
pnpm dev             # start dev server
pnpm build           # production build
pnpm lint            # run linter
pnpm test            # run tests (if configured)
```

**Always use pnpm** — not npm or yarn.

## Architecture

### Route Groups (App Router)

The app uses Next.js route groups to separate concerns:
- `(auth)/` — unauthenticated routes: login, setup, join
- `(player)/` — player routes with player nav layout
- `(gm)/` — GM routes with GM nav layout

Role-based routing: middleware or layout-level guards redirect players away from GM routes.

### Auth Flow

- Magic link login: users visit `/login/<code>`, no passwords
- `POST /api/v1/auth/login` with code — sets `login_code` httpOnly cookie
- If code matches an invite (not a user), API returns `{}` signaling the join flow
- `GET /api/v1/me` on app load to check auth state and get user role/character_id
- GM bootstrap: one-time `POST /api/v1/setup`

### Core Domain Concepts

**Bond Graph Visibility** — the most unique architectural concept. Who can see what is computed by traversing relationship bonds between game objects (Characters, Groups, Locations). Hop distance (1-3) determines visibility tier. After a non-Character node, the next hop must go through a Character.

**Proposal Workflow** — the central UI mechanic:
1. Player submits proposal (action type + narrative + selections)
2. System computes `calculated_effect` (dice pool, costs)
3. GM reviews in queue, approves (with optional overrides) or rejects
4. On approval, system auto-applies all consequences

**12 Action Types** with different selection schemas — see `FRONTEND_SEED.md` section 3. The proposal wizard must dynamically render fields based on `action_type`.

**Modifier Stacking Rule** — max +3d per proposal: 1 Core Trait + 1 Role Trait + 1 Bond.

### Key API Patterns

- **ULID IDs** everywhere, cursor-based pagination: `?after=<ulid>&limit=N`
- **Paginated response**: `{items: T[], next_cursor: string | null, has_more: boolean}`
- **Soft delete**: most entities have `is_deleted`, excluded from lists by default
- **Error envelope**: `{error: {code, message, details: {fields: {...}}}}`
- **Polling** for live updates (no SSE/WebSocket support on backend) — pause when tab hidden, resume on focus
- **Feeds** merge Events and Story entries into one chronological stream (discriminated union on `type` field)

### Brand & Color Palette

The studio logo (`public/logo.png`) defines three brand anchor colors:
- **Navy** `#1e1b5e` — dark backgrounds, nav bar, card surfaces
- **Blue** `#2e6eb5` — interactive elements, links, focus rings
- **Teal** `#5bbfc4` — accents, selected tabs, highlights

The dark theme uses navy tones (not generic grays) for backgrounds and surfaces.

### Character Meters

Four resource meters on PC characters, each with distinct color and range:
| Meter | Range | Color |
|-------|-------|-------|
| Stress | 0–9 (minus trauma count) | `#e05545` red |
| Free Time | 0–20 | `#34d399` emerald |
| Plot | 0–5 | `#f59e0b` amber |
| Gnosis | 0–23 | `#a78bfa` violet |

### Complex UI Components

- **Proposal Wizard**: 3-step form (choose action → fill details → review). Most complex UI — each of 12 action types has different selection fields.
- **Character Sheet**: Most data-rich view — meters, traits with charge dots, bonds with charges/degradation, magic effects, skills, magic stats, and feed all on one page.
- **Clock Visualization**: Blades-in-the-Dark style pie chart with N segments, M filled. SVG rendering.
- **Sacrifice Builder**: Multi-step UI for magic sacrifice selection (gnosis, stress, FT, bonds, traits).
- **GM Actions Interface**: 14 action types with different payloads — type-selector → dynamic form.

### UI Conventions

- Dark theme by default
- Mobile-first responsive: bottom nav (mobile) ↔ top nav (desktop) at 768px
- Toast notifications: error (6s, red), success (3s, green)
- Nav badges show counts (pending proposals, approved/rejected status)
