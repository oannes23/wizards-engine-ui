# Wizards Engine UI — Project Specification

This directory contains the full project specification for the Wizards Engine frontend. It is organized into five areas:

- **[Architecture](architecture/)** — System topology, tech stack decisions, auth, routing, data fetching, naming conventions
- **[Domains](domains/)** — Game domain concepts: characters, bonds, traits, magic, proposals, sessions, groups, locations, stories, events, users
- **[API](api/)** — Backend API contract: endpoints, response shapes, enums, constants
- **[UI](ui/)** — Component catalog, player and GM view specs, design system
- **[Testing](testing/)** — Test strategy, MSW setup, fixtures, critical scenarios
- **[Implementation](implementation/)** — Epic breakdown, dependency graph, story-level specs
  - **[Orchestration](implementation/ORCHESTRATION.md)** — Master execution plan: batches, agent assignments, review gates
  - **[Agent Assignments](implementation/AGENT_ASSIGNMENTS.md)** — Per-story mapping to OPS agents
  - **[Execution Order](implementation/EXECUTION_ORDER.md)** — Batch definitions, prerequisites, parallelism
  - **[Review Checkpoints](implementation/REVIEW_CHECKPOINTS.md)** — Gate/inline/final review protocols

The canonical backend/game reference is [FRONTEND_SEED.md](../FRONTEND_SEED.md). These specs decompose that monolithic document into addressable, maintainable pieces for development.

**[Deepening Roadmap](DEEPENING_ROADMAP.md)** — Tracks the spec interrogation order and progress.

**[Outstanding Questions](OUTSTANDING_QUESTIONS.md)** — 69 implementation gaps, ambiguities, and edge cases to resolve before writing epics/stories.

**[Backend Change Requests](api/backend-change-requests.md)** — Requested API changes for handoff to the backend agent.

**[Backend Questionnaire](api/BACKEND_QUESTIONNAIRE.md)** — 21 questions + 10 decision verifications sent to the backend team for clarification.

---

## Tech Stack Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS | Dark theme trivial, responsive built-in, utility-first speed |
| UI Primitives | Radix UI (headless) | Accessible behavior layer; game-specific components built from scratch |
| Server State | TanStack Query v5 | 95% of state is server-originated; handles caching, polling, invalidation |
| Client State | React Context (auth only) | Auth identity is the only global client state needed |
| Forms | React Hook Form + Zod | Handles the complex proposal wizard (12 action types) and GM actions (14 types) |
| Icons | Lucide React | Tree-shakeable, ~1000 icons, consistent stroke style |
| Variants | class-variance-authority (cva) | Type-safe variant mapping for Tailwind components |
| Testing | Vitest + RTL + MSW + Playwright | 4-layer stack: unit, component, integration, E2E |
| Data Fetching | Client-side only | Cookie auth requires browser context; server components for layout only |

---

## Spec Document Status

| Document | Status | Last Verified |
|----------|--------|---------------|
| [architecture/overview.md](architecture/overview.md) | Deepened | 2026-03-26 |
| [architecture/auth.md](architecture/auth.md) | Deepened | 2026-03-26 |
| [architecture/routing.md](architecture/routing.md) | Deepened | 2026-03-26 |
| [architecture/api-client.md](architecture/api-client.md) | Deepened | 2026-03-26 |
| [architecture/data-fetching.md](architecture/data-fetching.md) | Deepened | 2026-03-26 |
| [architecture/naming-conventions.md](architecture/naming-conventions.md) | Deepened | 2026-03-26 |
| [domains/characters.md](domains/characters.md) | Verified against implementation | 2026-04-03 |
| [domains/bonds.md](domains/bonds.md) | Verified against implementation | 2026-04-03 |
| [domains/traits.md](domains/traits.md) | Verified against implementation | 2026-04-03 |
| [domains/magic.md](domains/magic.md) | Verified against implementation | 2026-04-03 |
| [domains/proposals.md](domains/proposals.md) | Verified against implementation | 2026-04-03 |
| [domains/sessions.md](domains/sessions.md) | Deepened | 2026-03-27 |
| [domains/groups.md](domains/groups.md) | Deepened | 2026-03-27 |
| [domains/locations.md](domains/locations.md) | Deepened | 2026-03-27 |
| [domains/stories.md](domains/stories.md) | Deepened | 2026-03-27 |
| [domains/events-and-feeds.md](domains/events-and-feeds.md) | Verified against implementation | 2026-04-03 |
| [domains/users.md](domains/users.md) | Verified against implementation | 2026-04-03 |
| [api/contract.md](api/contract.md) | Deepened | 2026-03-26 |
| [api/response-shapes.md](api/response-shapes.md) | Deepened | 2026-03-26 |
| [ui/components.md](ui/components.md) | Partially verified (Phase 0+1+2) | 2026-04-03 |
| [ui/player-views.md](ui/player-views.md) | Deepened | 2026-03-27 |
| [ui/gm-views.md](ui/gm-views.md) | Deepened | 2026-03-27 |
| [ui/design-system.md](ui/design-system.md) | Deepened | 2026-03-26 |
| [testing/strategy.md](testing/strategy.md) | Deepened | 2026-03-27 |
| [glossary.md](glossary.md) | Deepened | 2026-03-27 |

---

## Epic Status

| Phase | Epic | Status | Depends On |
|-------|------|--------|------------|
| 0 | [0.1 Scaffolding](implementation/phase0-scaffolding.md) | Complete | — |
| 1 | [1.1 Auth & Onboarding](implementation/phase1-auth-onboarding.md) | Complete | 0.1 |
| 1 | [1.2 Character Sheet](implementation/phase1-character-sheet.md) | Complete | 0.1 |
| 2 | [2.1 Proposals](implementation/phase2-proposals.md) | Complete | 1.1, 1.2 |
| 2 | [2.2 GM Queue](implementation/phase2-gm-queue.md) | Complete | 2.1 |
| 2 | [2.3 Feeds & Events](implementation/phase2-feeds.md) | Complete (Batch H + Batch N done) | 0.1 |
| 3 | [3.1 World Browser](implementation/phase3-world-browser.md) | Not Started | 1.2 |
| 3 | [3.2 GM World Management](implementation/phase3-gm-world-management.md) | Not Started | 3.1 |
| 3 | [3.3 Sessions](implementation/phase3-sessions.md) | Not Started | 1.2 |
| 3 | [3.4 Players & Invites](implementation/phase3-players-invites.md) | Not Started | 1.1 |
