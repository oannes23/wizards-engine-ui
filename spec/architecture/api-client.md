# API Client

> Status: Deepened
> Last verified: 2026-03-26
> Related: [../api/contract.md](../api/contract.md), [../api/response-shapes.md](../api/response-shapes.md)

## Base Client

A thin async wrapper around `fetch` at `src/lib/api/client.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL

async function apiFetch<T>(
  path: string,
  init?: RequestInit & {
    params?: Record<string, string | number | boolean | null | undefined>
  }
): Promise<T>
```

### Responsibilities

1. **Base URL**: Prepend `${API_BASE}/api/v1` to all paths
2. **Credentials**: Every request includes `credentials: 'include'`
3. **Query params**: Build from `params` object, omitting `undefined`/`null` values
4. **JSON serialization**: Auto-set `Content-Type: application/json` for POST/PATCH/PUT
5. **Response parsing**: Parse JSON, handle 204 No Content (return `undefined`)
6. **Error normalization**: Parse error envelope into typed `ApiError`, throw

### Convenience Methods

```typescript
api.get<T>(path, params?)
api.post<T>(path, body?, params?)
api.patch<T>(path, body?, params?)
api.del<T>(path, params?)
```

## Error Handling

### Error Envelope

All API errors follow this shape:

```json
{
  "error": {
    "code": "error_code_string",
    "message": "Human-readable description",
    "details": {
      "fields": {
        "field_name": "Field-specific error message"
      }
    }
  }
}
```

### ApiError Class

```typescript
class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details: { fields?: Record<string, string> } | null,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### Error Code Handling

| Code | Status | Handling |
|------|--------|----------|
| `cookie_missing` | 401 | Global: redirect to `/login` |
| `cookie_invalid` | 401 | Global: redirect to `/login` |
| `account_inactive` | 401 | Global: redirect to `/login` |
| `insufficient_role` | 403 | Toast: "Permission denied" |
| `not_found` | 404 | Toast or inline "Not found" |
| `already_setup` | 409 | Inline on setup page |
| `validation_error` | 422 | Map `details.fields` to form field errors |
| `insufficient_resources` | 422 | Inline on proposal wizard |
| `proposal_not_pending` | 409 | Toast + queue refresh |

## Service Module Organization

13 service modules under `src/lib/api/services/`:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `auth.ts` | 6 | Login, setup, join, me, refresh-link |
| `players.ts` | 5 | Player list, invites, token regeneration |
| `characters.ts` | 12 | CRUD + direct actions + effects |
| `sessions.ts` | 11 | CRUD + lifecycle + participants + timeline |
| `proposals.ts` | 7 | CRUD + approve/reject |
| `clocks.ts` | 6 | CRUD + group-associated creation |
| `groups.ts` | 5 | CRUD |
| `locations.ts` | 5 | CRUD |
| `stories.ts` | 10 | CRUD + owners + entries |
| `events.ts` | 3 | List, detail, visibility override |
| `feeds.ts` | 6 | Personal, starred, silent, entity feeds |
| `starred.ts` | 3 | List, star, unstar |
| `traitTemplates.ts` | 5 | CRUD |
| `gm.ts` | 4 | Single/batch actions, dashboard, queue summary |

**Total: ~55 endpoints**

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000    # dev
# NEXT_PUBLIC_API_URL=https://api.example.com  # prod
```

The `/api/v1/` path prefix is hardcoded in the client, not configurable per environment.

---

## Interrogation Decisions (2026-03-26)

### 401 Handling: TanStack Query Global onError

- **Decision**: All 401 responses are handled by a global `onError` callback on the QueryClient, not in apiFetch
- **Rationale**: Single place for auth redirect logic. Works for all queries and mutations automatically. apiFetch stays pure — it throws `ApiError`, the query layer handles side effects.
- **Pattern**:
  ```typescript
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) return false
          return failureCount < 3
        },
      },
      mutations: {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            // clear auth context + redirect to /login
          }
        },
      },
    },
  })
  ```
- **Implications**: apiFetch never redirects or has side effects. All 401 handling lives in the QueryClient config. Non-TanStack API calls (e.g., the initial auth login POST) handle 401 locally.

### No Middleware / No Client-Level Retries

- **Decision**: apiFetch is minimal — no request/response middleware, no retry logic
- **Rationale**: TanStack Query handles retries (3 attempts, exponential backoff). Adding retry in apiFetch would create duplicate behavior. Middleware adds complexity for no current need.
- **Implications**: If dev logging is needed, add it directly to apiFetch with a simple `if (process.env.NODE_ENV === 'development')` check — no plugin system.

### Pagination Helper

- **Decision**: Generic `apiFetchPaginated<T>()` wrapper for cursor-based pagination
- **Rationale**: ~15 endpoints use the same `{items, next_cursor, has_more}` shape with `after`/`limit` params. DRY.
- **Pattern**:
  ```typescript
  interface PaginationParams {
    after?: string
    limit?: number
  }

  interface PaginatedResponse<T> {
    items: T[]
    next_cursor: string | null
    has_more: boolean
  }

  async function apiFetchPaginated<T>(
    path: string,
    params?: PaginationParams & Record<string, string | number | boolean>
  ): Promise<PaginatedResponse<T>> {
    const { after, limit = 20, ...rest } = params ?? {}
    return apiFetch<PaginatedResponse<T>>(path, {
      params: { after, limit, ...rest },
    })
  }
  ```
- **Implications**: Service functions for paginated endpoints use `apiFetchPaginated` instead of `apiFetch`. Non-paginated endpoints continue using `apiFetch`.

### Form Validation Error Flow

- **Decision**: Mutation `onError` catches 422, maps `details.fields` to React Hook Form `setError()`
- **Rationale**: Clean separation — API client just throws ApiError, mutation hooks translate field errors into form state. No custom abstraction layer; the pattern is explicit at each call site.
- **Pattern**:
  ```typescript
  const mutation = useMutation({ mutationFn: submitProposal })

  async function onSubmit(data: FormValues) {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      if (err instanceof ApiError && err.details?.fields) {
        Object.entries(err.details.fields).forEach(
          ([field, msg]) => setError(field as keyof FormValues, { message: msg })
        )
      }
    }
  }
  ```
- **Implications**: Every form that submits to the API uses this try/catch pattern. No shared hook wrapper — explicit is better than implicit here.

### Canonical Env Var Name

- **Decision**: `NEXT_PUBLIC_API_URL` (not `NEXT_PUBLIC_API_BASE_URL`)
- **Rationale**: Shorter, matches the overview spec. Updated throughout this document.
- **Implications**: Updated env config section above

### Retry Strategy

- **Decision**: Use TanStack Query's built-in retry (3 attempts with exponential backoff) for queries (GET). Mutations do NOT retry. Auth retry (GET /me) uses separate 3-retry logic with 1s/2s/4s delays.
- **Rationale**: Safe reads can retry transparently. Mutations are not idempotent and should not retry.

### 422 Error Handling

- **Decision**: All 422 responses use the standard `{error: {code, message, details: {fields}}}` envelope. The backend has normalized Pydantic validation errors into this shape (shipped 2026-03-29). The frontend only needs one 422 parser.
- **Rationale**: Backend implemented a normalization handler wrapping `RequestValidationError` into the standard envelope. No dual-shape handling needed.
