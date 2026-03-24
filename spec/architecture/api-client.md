# API Client

> Status: Draft
> Last verified: 2026-03-23
> Related: [../api/contract.md](../api/contract.md), [../api/response-shapes.md](../api/response-shapes.md)

## Base Client

A thin async wrapper around `fetch` at `src/lib/api/client.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000    # dev
# NEXT_PUBLIC_API_BASE_URL=https://api.example.com  # prod
```

The `/api/v1/` path prefix is hardcoded in the client, not configurable per environment.
