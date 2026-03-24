# Wizards Engine UI

A Next.js frontend for a narrative tabletop RPG campaign tracker.

## What This Is

This is a React + Next.js frontend that consumes the [Wizards Engine](FRONTEND_SEED.md) REST API — a backend state tracker for a single narrative-heavy, low-crunch tabletop RPG campaign. The system serves a small fixed group of 4–6 players and 1 GM (Game Master), with two distinct user experiences:

- **Player**: Owns one character. Views their character sheet, submits action proposals for GM approval, explores the game world, and reads event feeds.
- **GM (Game Master)**: Full visibility and control. Reviews and approves/rejects proposals, manages sessions, makes direct state changes, and manages players and world objects.

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL to your backend server (e.g., http://localhost:8000)

# Start dev server
pnpm dev
```

The backend's `CORS_ORIGINS` environment variable must include this frontend's origin for cookie-based auth to work cross-origin.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Package Manager | pnpm |
| Server State | TanStack Query (React Query) v5 |
| UI Primitives | Radix UI (headless) |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Unit/Component Tests | Vitest + React Testing Library |
| E2E Tests | Playwright |

## Architecture Overview

The app uses Next.js **route groups** to separate concerns:

- `(auth)/` — Unauthenticated routes: login, setup, join
- `(player)/` — Player routes with player navigation layout
- `(gm)/` — GM routes with GM navigation layout

**Auth**: Magic-link login via httpOnly cookies. All API requests include `credentials: 'include'`. Next.js middleware checks cookie presence; layout-level guards verify role via `GET /api/v1/me`.

**Data fetching**: All data fetching is client-side via TanStack Query. The backend has no SSE/WebSocket support, so polling with tab-visibility pausing provides near-real-time updates.

**API client**: A thin typed fetch wrapper organized into 13 service modules covering ~55 endpoints under `/api/v1/`.

## Key Design Concepts

These are the non-obvious architectural concepts that shape the frontend. See [FRONTEND_SEED.md](FRONTEND_SEED.md) for full details.

- **Bond Graph Visibility** — Who can see what is computed by traversing relationship bonds between game objects. Hop distance (1–3) determines visibility tier. The server handles all filtering; the frontend displays what the API returns.
- **Proposal Workflow** — The central UI mechanic. Players submit proposals (action type + narrative + selections), the system computes effects, the GM approves or rejects, and consequences are auto-applied. 12 action types with different selection schemas.
- **Character Sheet** — The most data-rich view. Four resource meters (Stress, Free Time, Plot, Gnosis), traits with charges, bonds with degradation, magic effects, skills, and magic stats — all on one page with inline direct actions.

## Project Documentation

- **[FRONTEND_SEED.md](FRONTEND_SEED.md)** — Comprehensive backend API reference, game mechanics, and UI design document
- **[spec/](spec/MASTER.md)** — Full project specification: architecture, domain models, API contract, UI design, testing strategy, and implementation epics
- **[CLAUDE.md](CLAUDE.md)** — Claude Code guidance for working in this repository
