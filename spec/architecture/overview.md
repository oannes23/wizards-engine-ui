# Architecture Overview

> Status: Draft
> Last verified: 2026-03-23
> Related: [auth.md](auth.md), [routing.md](routing.md), [api-client.md](api-client.md), [data-fetching.md](data-fetching.md)

## System Topology

```
┌─────────────────────┐       REST / JSON        ┌─────────────────────┐
│   Next.js Frontend  │  ◄──────────────────────► │  FastAPI Backend    │
│   (This Repo)       │   credentials: 'include'  │  (Separate Repo)    │
│                     │   httpOnly cookie auth     │                     │
│   Client-side SPA   │                           │  /api/v1/*          │
└─────────────────────┘                           └─────────────────────┘
```

The frontend is a pure API consumer. All game state lives on the backend. The frontend renders UI, manages client-side cache, and sends mutations through the REST API.

## Code Layer Separation

```
src/
├── lib/api/          # API client layer — HTTP requests, types, error handling
│   ├── client.ts     # Base fetch wrapper
│   ├── errors.ts     # ApiError class
│   ├── types.ts      # All TypeScript types (response shapes, enums, constants)
│   └── services/     # One module per domain (auth, characters, proposals, etc.)
│
├── lib/hooks/        # Data hooks layer — TanStack Query hooks per domain
│                     # Wraps API calls. Handles cache invalidation.
│
├── features/         # Feature modules — domain-specific UI + logic
│   ├── characters/   # Character sheet components, meter bars, trait/bond displays
│   ├── proposals/    # Proposal wizard, proposal cards, selection schemas
│   ├── sessions/     # Session management, participant management
│   ├── world/        # World browser, game object cards
│   ├── stories/      # Story detail, entry management
│   ├── clocks/       # Clock visualization, clock management
│   ├── feed/         # Feed list, feed item renderers
│   └── gm-actions/   # GM action type selector, dynamic action forms
│
├── components/ui/    # Shared UI primitives — domain-agnostic
│                     # MeterBar, ChargeDots, ClockPie, Toast, Modal, etc.
│                     # Pure presentation. No API calls. No domain knowledge.
│
└── app/              # Route pages — composition layer
    ├── (auth)/       # Login, setup, join
    ├── (player)/     # Player routes with player nav layout
    └── (gm)/         # GM routes with GM nav layout
```

### Boundary Rules

1. **Route pages never call API functions directly.** They use hooks or feature components.
2. **UI primitives (`components/ui/`) never import from `lib/api/` or `lib/hooks/`.** Pure visual components.
3. **API client modules (`lib/api/services/`) never import from each other.** Each imports only from `client.ts` and `types.ts`.
4. **Feature modules may import from other features' exported components**, but not their internal files.
5. **Business logic lives in feature modules or utility functions**, not in API client modules or route pages.

## Key Architectural Decisions

### All Data Fetching is Client-Side

Cookie-based auth requires browser context — the httpOnly cookie is sent automatically by the browser but is not accessible to Next.js server components. Therefore:

- All data fetching happens in `'use client'` components via TanStack Query
- Server components are used only for layout structure and static content
- No SSR data fetching, no `getServerSideProps` equivalent

### No Client-Side State Store

TanStack Query v5 is the primary state manager. No Zustand, Redux, or Jotai.

- **Server state** (95% of app state): TanStack Query handles caching, refetching, deduplication, invalidation
- **Auth identity**: Single React Context (`AuthProvider`) storing `{id, display_name, role, character_id}`
- **Form wizard state**: `useReducer` local to the wizard component tree
- **UI state**: `useState` local to components

### Keep API Responses Nested

The API returns denormalized responses (character detail includes bonds, traits, effects inline). Do NOT normalize into a flat entity store. Reasons:

- Small data volume (one character sheet is ~100 fields)
- Server is source of truth for derived values (effective_stress_max, members, presence tiers)
- Update unit is the whole entity (refetch on mutation, not surgical normalized updates)
- No client-side graph traversal needed (server handles visibility)
