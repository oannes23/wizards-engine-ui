# Epic 0.1 — Project Scaffolding & Core Infrastructure

> Phase: 0
> Status: Not Started
> Depends on: —

## Goal

Establish the project foundation: Next.js app, API client, auth context, layout shells, and base UI components that all subsequent Epics depend on.

## Stories

### 0.1.1 — Project Initialization

**As a** developer, **I want** a configured Next.js project **so that** I can begin building features.

**Files to create:**
- `package.json` — Next.js, TypeScript, Tailwind, TanStack Query, Radix UI, React Hook Form, Zod, Vitest
- `tsconfig.json`
- `tailwind.config.ts` — custom colors (meter colors), dark mode config
- `next.config.ts`
- `.env.example` — `NEXT_PUBLIC_API_BASE_URL`
- `src/app/layout.tsx` — root layout with providers

**Acceptance criteria:**
- [ ] `pnpm dev` starts the dev server
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` runs without errors
- [ ] Tailwind CSS working with dark theme
- [ ] TanStack Query provider wraps the app

### 0.1.2 — API Client Module

**As a** developer, **I want** a typed API client **so that** all API calls go through a single configured layer.

**Files to create:**
- `src/lib/api/client.ts` — base fetch wrapper with credentials, error parsing
- `src/lib/api/errors.ts` — ApiError class
- `src/lib/api/services/auth.ts` — login, setup, join, me endpoints

**Acceptance criteria:**
- [ ] `apiFetch` includes `credentials: 'include'` on all requests
- [ ] Non-2xx responses throw typed `ApiError` with code, message, details
- [ ] 401 responses trigger redirect to `/login`
- [ ] Base URL read from `NEXT_PUBLIC_API_BASE_URL`

### 0.1.3 — TypeScript Domain Types & Constants

**As a** developer, **I want** all API types defined **so that** the codebase is type-safe from day one.

**Files to create:**
- `src/lib/api/types.ts` — all enums, response shapes, constants from [api/response-shapes.md](../api/response-shapes.md)
- `src/lib/constants.ts` — game constants (STRESS_MAX, etc.), meter colors

**Acceptance criteria:**
- [ ] All enums from FRONTEND_SEED.md §6 defined as string literal unions
- [ ] All entity response interfaces defined
- [ ] FeedItem discriminated union working (`type: 'event' | 'story_entry'`)
- [ ] Game constants exported as `const` object

### 0.1.4 — Auth Provider & Context

**As a** developer, **I want** auth state available throughout the app **so that** components can check the user's role and identity.

**Files to create:**
- `src/lib/auth/AuthProvider.tsx` — context provider, calls `GET /me` on mount
- `src/lib/auth/useAuth.ts` — hook returning `{ user, isGm, isPlayer, isLoading, characterId }`

**Acceptance criteria:**
- [ ] AuthProvider calls `GET /me` on mount
- [ ] `useAuth()` returns correct role booleans
- [ ] 401 from `/me` sets user to null
- [ ] Loading state while `/me` is pending

### 0.1.5 — Toast Notification System

**As a** user, **I want** to see success/error notifications **so that** I know when actions succeed or fail.

**Files to create:**
- `src/components/ui/Toast.tsx` — toast component using Radix Toast
- `src/lib/toast/ToastProvider.tsx` — provider and `useToast()` hook

**Acceptance criteria:**
- [ ] Error toasts: red, 6s duration
- [ ] Success toasts: green, 3s duration
- [ ] `aria-live` regions for accessibility
- [ ] Auto-dismiss pauses on hover

### 0.1.6 — Polling Hook

**As a** developer, **I want** a reusable polling hook **so that** views can subscribe to live updates consistently.

**Files to create:**
- `src/lib/hooks/usePolling.ts`

**Acceptance criteria:**
- [ ] Configurable interval
- [ ] Pauses when `document.visibilityState === 'hidden'`
- [ ] Resumes on tab focus
- [ ] Stops when component unmounts

### 0.1.7 — Layout Shells & Navigation

**As a** user, **I want** role-appropriate navigation **so that** I can access the views relevant to my role.

**Files to create:**
- `src/app/(auth)/layout.tsx` — minimal layout, no nav
- `src/app/(player)/layout.tsx` — player nav bar
- `src/app/(gm)/layout.tsx` — GM nav bar
- `src/components/NavBar.tsx` — responsive nav (bottom mobile, top desktop)
- `src/middleware.ts` — cookie presence check, role redirect

**Acceptance criteria:**
- [ ] Player nav: Feed, Character, Proposals, World, Profile tabs
- [ ] GM nav: Queue, Feed, World, Sessions, More dropdown
- [ ] Responsive: bottom bar < 768px, top bar >= 768px
- [ ] Badge support on nav tabs
- [ ] Middleware redirects unauthenticated to `/login`

### 0.1.8 — Base UI Components

**As a** developer, **I want** shared UI primitives **so that** feature Epics can compose from them.

**Files to create:**
- `src/components/ui/MeterBar.tsx`
- `src/components/ui/ChargeDots.tsx`
- `src/components/ui/ClockSvg.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/LoadMoreButton.tsx`
- `src/components/ui/ExpandableSection.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/StepIndicator.tsx`

**Acceptance criteria:**
- [ ] MeterBar renders with correct color, current/max, effective_max
- [ ] ChargeDots renders filled/empty/degraded states
- [ ] ClockSvg renders N segments with M filled as SVG pie
- [ ] All components pass axe accessibility checks
- [ ] All components work in dark theme
