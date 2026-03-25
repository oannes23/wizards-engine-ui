# Wizards Engine UI — Project Specification

This directory contains the full project specification for the Wizards Engine frontend. It is organized into five areas:

- **[Architecture](architecture/)** — System topology, tech stack decisions, auth, routing, data fetching, naming conventions
- **[Domains](domains/)** — Game domain concepts: characters, bonds, traits, magic, proposals, sessions, groups, locations, stories, events, users
- **[API](api/)** — Backend API contract: endpoints, response shapes, enums, constants
- **[UI](ui/)** — Component catalog, player and GM view specs, design system
- **[Testing](testing/)** — Test strategy, MSW setup, fixtures, critical scenarios
- **[Implementation](implementation/)** — Epic breakdown, dependency graph, story-level specs

The canonical backend/game reference is [FRONTEND_SEED.md](../FRONTEND_SEED.md). These specs decompose that monolithic document into addressable, maintainable pieces for development.

**[Deepening Roadmap](DEEPENING_ROADMAP.md)** — Tracks the spec interrogation order and progress.

**[Backend Change Requests](api/backend-change-requests.md)** — Requested API changes for handoff to the backend agent.

---

## Tech Stack Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS | Dark theme trivial, responsive built-in, utility-first speed |
| UI Primitives | Radix UI (headless) | Accessible behavior layer; game-specific components built from scratch |
| Server State | TanStack Query v5 | 95% of state is server-originated; handles caching, polling, invalidation |
| Client State | React Context (auth only) | Auth identity is the only global client state needed |
| Forms | React Hook Form + Zod | Handles the complex proposal wizard (12 action types) and GM actions (14 types) |
| Testing | Vitest + RTL + MSW + Playwright | 4-layer stack: unit, component, integration, E2E |
| Data Fetching | Client-side only | Cookie auth requires browser context; server components for layout only |

---

## Spec Document Status

| Document | Status | Last Verified |
|----------|--------|---------------|
| [architecture/overview.md](architecture/overview.md) | Draft | 2026-03-23 |
| [architecture/auth.md](architecture/auth.md) | Draft | 2026-03-23 |
| [architecture/routing.md](architecture/routing.md) | Draft | 2026-03-23 |
| [architecture/api-client.md](architecture/api-client.md) | Draft | 2026-03-23 |
| [architecture/data-fetching.md](architecture/data-fetching.md) | Draft | 2026-03-23 |
| [architecture/naming-conventions.md](architecture/naming-conventions.md) | Draft | 2026-03-23 |
| [domains/characters.md](domains/characters.md) | Draft | 2026-03-23 |
| [domains/bonds.md](domains/bonds.md) | Draft | 2026-03-23 |
| [domains/traits.md](domains/traits.md) | Draft | 2026-03-23 |
| [domains/magic.md](domains/magic.md) | Draft | 2026-03-23 |
| [domains/proposals.md](domains/proposals.md) | Draft | 2026-03-23 |
| [domains/sessions.md](domains/sessions.md) | Draft | 2026-03-23 |
| [domains/groups.md](domains/groups.md) | Draft | 2026-03-23 |
| [domains/locations.md](domains/locations.md) | Draft | 2026-03-23 |
| [domains/stories.md](domains/stories.md) | Draft | 2026-03-23 |
| [domains/events-and-feeds.md](domains/events-and-feeds.md) | Draft | 2026-03-23 |
| [domains/users.md](domains/users.md) | Draft | 2026-03-23 |
| [api/contract.md](api/contract.md) | Draft | 2026-03-23 |
| [api/response-shapes.md](api/response-shapes.md) | Draft | 2026-03-23 |
| [ui/components.md](ui/components.md) | Draft | 2026-03-23 |
| [ui/player-views.md](ui/player-views.md) | Draft | 2026-03-23 |
| [ui/gm-views.md](ui/gm-views.md) | Draft | 2026-03-23 |
| [ui/design-system.md](ui/design-system.md) | Draft | 2026-03-23 |
| [testing/strategy.md](testing/strategy.md) | Draft | 2026-03-23 |
| [glossary.md](glossary.md) | Draft | 2026-03-23 |

---

## Epic Status

| Phase | Epic | Status | Depends On |
|-------|------|--------|------------|
| 0 | [0.1 Scaffolding](implementation/phase0-scaffolding.md) | Not Started | — |
| 1 | [1.1 Auth & Onboarding](implementation/phase1-auth-onboarding.md) | Not Started | 0.1 |
| 1 | [1.2 Character Sheet](implementation/phase1-character-sheet.md) | Not Started | 0.1 |
| 2 | [2.1 Proposals](implementation/phase2-proposals.md) | Not Started | 1.1, 1.2 |
| 2 | [2.2 GM Queue](implementation/phase2-gm-queue.md) | Not Started | 2.1 |
| 2 | [2.3 Feeds & Events](implementation/phase2-feeds.md) | Not Started | 0.1 |
| 3 | [3.1 World Browser](implementation/phase3-world-browser.md) | Not Started | 1.2 |
| 3 | [3.2 GM World Management](implementation/phase3-gm-world-management.md) | Not Started | 3.1 |
| 3 | [3.3 Sessions](implementation/phase3-sessions.md) | Not Started | 1.2 |
| 3 | [3.4 Players & Invites](implementation/phase3-players-invites.md) | Not Started | 1.1 |
