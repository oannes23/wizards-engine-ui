# Naming Conventions

> Status: Draft
> Last verified: 2026-03-23

## Files and Directories

| Type | Convention | Example |
|------|-----------|---------|
| Page/layout files | Lowercase (Next.js convention) | `page.tsx`, `layout.tsx`, `loading.tsx` |
| Route directories | Lowercase with hyphens | `proposals/new/`, `trait-templates/` |
| Component files | PascalCase matching export | `MeterBar.tsx`, `ProposalCard.tsx` |
| Hook files | camelCase with `use` prefix | `useCharacter.ts`, `usePolling.ts` |
| API service files | camelCase | `characters.ts`, `proposals.ts` |
| Type files | camelCase | `types.ts` or `proposal.types.ts` |
| Utility files | camelCase | `formatDate.ts`, `gnosisEquivalent.ts` |
| Test files | Match source with `.test` suffix | `MeterBar.test.tsx`, `useCharacter.test.ts` |

## Component Organization

- One component per file. Filename equals the default export name.
- Shared/reusable components: `src/components/ui/`
- Route-specific components (used on only one page): co-located under `_components/`
  ```
  app/(player)/character/_components/MeterSection.tsx
  ```

## TypeScript Types

### String Literals over Enums

Use TypeScript string literal union types, not `enum`:

```typescript
// Do this:
type ProposalStatus = 'pending' | 'approved' | 'rejected'

// Not this:
enum ProposalStatus { Pending = 'pending', ... }
```

String literal unions match JSON round-trips without conversion and produce no runtime code.

### Naming Patterns

| Pattern | Convention | Example |
|---------|-----------|---------|
| API response types | Suffix with `Response` | `CharacterDetailResponse`, `ProposalResponse` |
| API request body types | Suffix with `Request` | `ApproveProposalRequest`, `GmActionRequest` |
| Internal UI types | No suffix or descriptive | `FeedItem`, `MeterConfig`, `WizardStep` |
| Discriminated unions | `type` as discriminant key | `type: 'event' \| 'story_entry'` |
| Polymorphic type fields | Match API field names exactly | `action_type`, `slot_type`, `detail_level` |

### API Types Match API Names

Use the exact type names from FRONTEND_SEED.md response shapes (e.g., `CharacterDetailResponse`, `ProposalResponse`). This minimizes translation effort and aligns with any future OpenAPI-generated types.

## Hooks

| Pattern | Convention | Example |
|---------|-----------|---------|
| Data-fetching | `use{Entity}(id)` | `useCharacter(id)`, `useProposals(filters)` |
| Auth | `useAuth()` | Returns `{ user, isGm, isLoading }` |
| Mutations | `use{Action}{Entity}()` | `useApproveProposal()`, `useCreateSession()` |
| Utility | `use{Capability}()` | `usePolling()`, `useMediaQuery()` |

## Constants

### Game Constants

Use SCREAMING_SNAKE_CASE matching the names from FRONTEND_SEED.md Section 6:

```typescript
export const GAME_CONSTANTS = {
  STRESS_MAX: 9,
  FREE_TIME_MAX: 20,
  PLOT_MAX: 5,
  GNOSIS_MAX: 23,
  PC_BOND_LIMIT: 8,
  CHARGE_MAX: 5,
  MAX_ACTIVE_EFFECTS: 9,
  SKILL_MAX: 3,
  // ...
} as const
```

### Color Constants

Named by game concept, not by color value. Brand colors from the studio logo, meter colors for game semantics:

```typescript
export const BRAND_COLORS = {
  navy: '#1e1b5e',
  blue: '#2e6eb5',
  teal: '#5bbfc4',
} as const

export const METER_COLORS = {
  stress: '#e05545',
  free_time: '#34d399',
  plot: '#f59e0b',
  gnosis: '#a78bfa',
} as const
```

## Action Types

The 12 proposal action types and 14 GM action types are string literals defined by the backend. Use them verbatim — do not create renamed aliases:

```typescript
type ActionType =
  | 'use_skill' | 'use_magic' | 'charge_magic'
  | 'regain_gnosis' | 'work_on_project' | 'rest'
  | 'new_trait' | 'new_bond'
  | 'resolve_clock' | 'resolve_trauma'
```
