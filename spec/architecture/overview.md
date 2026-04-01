# Architecture Overview

> Status: Deepened
> Last verified: 2026-03-26
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
│   ├── types.ts      # All API response types, enums, constants
│   └── services/     # One module per domain (auth, characters, proposals, etc.)
│
├── lib/hooks/        # Data hooks layer — TanStack Query hooks per domain
│   ├── query-keys.ts # Centralized query key factory (all domains)
│   └── use*.ts       # One hooks file per domain
│
├── lib/utils/        # Shared pure utility functions — no side effects
│                     # dates.ts, meters.ts, display.ts, dice.ts, etc.
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
├── components/
│   ├── ui/           # Shared UI primitives — domain-agnostic
│   │                 # MeterBar, ChargeDots, ClockPie, Toast, Modal, etc.
│   │                 # Pure presentation. No API calls. No domain knowledge.
│   └── layout/       # App shell components — NavBar, BottomNav, ToastProvider,
│                     # ModalHost, PageHeader, ErrorBoundary wrappers
│
└── app/              # Route pages — composition layer
    ├── (auth)/       # Login, setup, join
    ├── (player)/     # Player routes with player nav layout
    └── (gm)/         # GM routes with GM nav layout
```

### Boundary Rules

1. **Route pages never call API functions directly.** They use hooks or feature components.
2. **UI primitives (`components/ui/`) never import from `lib/api/` or `lib/hooks/`.** Pure visual components.
3. **Layout components (`components/layout/`) may import from `lib/hooks/`** (e.g., auth context) but not from `features/`.
4. **API client modules (`lib/api/services/`) never import from each other.** Each imports only from `client.ts` and `types.ts`.
5. **Feature modules export via barrel files (`index.ts`).** External consumers (route pages, other features) import only from the barrel, never internal files.
6. **Feature modules may import from other features' barrel exports**, but not their internal files.
7. **Business logic lives in feature modules or `lib/utils/`**, not in API client modules or route pages.
8. **API types live in `lib/api/types.ts`; UI types live in `features/<name>/types.ts`.** No mixing.

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

---

## Interrogation Decisions (2026-03-26)

### Feature Module Structure

- **Decision**: Prescribed internal structure with barrel file exports
- **Rationale**: Predictable file placement across all features; barrel files enforce clear public/internal boundary
- **Convention**:
  ```
  features/<name>/
  ├── components/    # React components (one per file)
  ├── hooks/         # Feature-specific hooks (not query hooks — those are in lib/hooks/)
  ├── utils/         # Feature-specific helpers
  ├── types.ts       # UI-only types (form state, wizard steps, display models)
  └── index.ts       # Barrel re-export of public API
  ```
- **Implications**: Not every feature needs all subfolders — only create what's used

### Error Boundary Strategy

- **Decision**: Per-section error boundaries
- **Rationale**: A failed feed fetch shouldn't nuke the entire character sheet. Granular degradation at section level balances resilience with simplicity.
- **Pattern**:
  - One error boundary per route group layout (`(player)`, `(gm)`, `(auth)`)
  - Additional boundaries around independent sections in complex pages (character sheet: meters, bonds, traits, feed each get their own)
  - Error boundaries render an inline error message with retry button, not a full-page error screen
- **Implications**: Need a reusable `<SectionErrorBoundary>` component in `components/ui/`

### Environment Variables

- **Decision**: Standard `NEXT_PUBLIC_*` env vars, defined in spec
- **Rationale**: Simple, standard Next.js pattern. No extra config module needed.
- **Defined vars**:
  | Variable | Default | Description |
  |----------|---------|-------------|
  | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |
  | `NEXT_PUBLIC_POLL_INTERVAL_MS` | `5000` | Default polling interval for TanStack Query refetchInterval |
- **Implications**: `.env.example` ships with defaults; `.env.local` is gitignored

### Loading States

- **Decision**: Purpose-built skeleton screens
- **Rationale**: Match the shape of real content to prevent layout shift and feel polished
- **Pattern**: Each feature that renders fetched data provides a skeleton variant (e.g., `<MeterBarSkeleton />`, `<BondListSkeleton />`). Skeletons live alongside their real component in the feature's `components/` folder.
- **Implications**: Skeleton components are part of the feature's barrel export; route pages render them via `isLoading` from TanStack Query

### Layout Components

- **Decision**: `src/components/layout/` directory
- **Rationale**: NavBar, BottomNav, ToastProvider, PageHeader are neither pure UI primitives nor domain features — they need their own home
- **Contents**: `NavBar`, `BottomNav`, `ToastProvider`, `PageHeader`, `SectionErrorBoundary`
- **Implications**: Layout components may import from `lib/hooks/` (e.g., auth context for nav badges) but never from `features/`

### Page Composition

- **Decision**: Flat composition — route pages directly assemble feature section components
- **Rationale**: Each section manages its own data fetching via hooks. Simple, readable, and each section loads/errors independently (pairs with per-section error boundaries).
- **Pattern**:
  ```tsx
  // app/(player)/character/page.tsx
  <SectionErrorBoundary><MetersSection characterId={id} /></SectionErrorBoundary>
  <SectionErrorBoundary><TraitsSection characterId={id} /></SectionErrorBoundary>
  <SectionErrorBoundary><BondsList characterId={id} /></SectionErrorBoundary>
  <SectionErrorBoundary><FeedSection characterId={id} /></SectionErrorBoundary>
  ```
- **Implications**: No page-level data orchestration; no compound "page" components in features

### Empty States

- **Decision**: Per-domain contextual empty states
- **Rationale**: "No bonds yet — bonds form through play" is more helpful than a generic "No items" message
- **Pattern**: Each feature defines its own empty state component with domain-aware messaging and optional icon. No shared `<EmptyState>` generic.
- **Implications**: Empty state components live in the feature's `components/` folder

### Query Key Management

- **Decision**: Centralized query key factory at `src/lib/hooks/query-keys.ts`
- **Rationale**: Mutation hooks need to invalidate queries across domains (e.g., approve proposal → invalidate proposals + character + feed). A single key map prevents missed invalidations.
- **Pattern**:
  ```ts
  export const queryKeys = {
    characters: {
      all: ['characters'] as const,
      detail: (id: string) => ['characters', id] as const,
    },
    proposals: {
      all: ['proposals'] as const,
      pending: () => ['proposals', 'pending'] as const,
    },
    // ...
  };
  ```
- **Implications**: All TanStack Query hooks import keys from this file; no inline key strings

### Type Location

- **Decision**: Split between API and UI types
- **Rationale**: API response shapes are shared across the app; UI-specific types (form state, wizard steps) are feature-local
- **Pattern**:
  - `src/lib/api/types.ts` — all API response types, enums, shared constants
  - `src/features/<name>/types.ts` — UI-only types (form state, component props, display models)
- **Implications**: Feature types.ts may import from `lib/api/types.ts` but not vice versa

### Shared Utilities

- **Decision**: `src/lib/utils/` for cross-cutting pure functions
- **Rationale**: Date formatting, ULID helpers, dice display, meter calculations are used across features
- **Pattern**: One file per concern (e.g., `dates.ts`, `meters.ts`, `display.ts`, `dice.ts`). Pure functions only, no side effects.
- **Implications**: Feature-specific helpers stay in the feature's `utils/` folder; promote to `lib/utils/` when reuse appears

### Modal / Dialog Pattern

- **Decision**: Radix Dialog with portal rendering, declared inline
- **Rationale**: Radix's default portal behavior handles z-index and overflow issues. No global modal manager needed — each feature controls its own modals.
- **Pattern**: Modal triggers and content declared inline in the component that opens them. Radix Dialog.Portal renders to document body.
- **Implications**: No `<ModalHost>` in the layout; no imperative `openModal()` API

### Toast Notification System

- **Decision**: Architecture-owned toast system with provider and hook
- **Rationale**: Toasts are cross-cutting (mutations from any feature can trigger them) so the provider and hook belong in the architecture, not a single feature
- **Pattern**:
  - `<ToastProvider>` in root layout (`components/layout/ToastProvider`)
  - `useToast()` hook for imperative triggers
  - Error toasts: 6 seconds, red (`#e05545`)
  - Success toasts: 3 seconds, green (`#34d399`)
  - Toast visuals: design-system spec owns the styling details
- **Implications**: Mutation hooks in `lib/hooks/` call `useToast()` on error/success; visual design deferred to `ui/design-system.md`
