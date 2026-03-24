# Authentication & Authorization

> Status: Draft
> Last verified: 2026-03-23
> Related: [routing.md](routing.md), [api-client.md](api-client.md), [../domains/users.md](../domains/users.md)

## Auth Model

The backend uses **magic-link login** with **httpOnly cookie** session management:

- No passwords. Users authenticate via unique codes embedded in URLs (`/login/<code>`)
- On successful login, the backend sets a `login_code` httpOnly cookie (Secure, SameSite=Lax, Max-Age=1 year)
- The frontend never reads or writes this cookie directly — the browser manages it
- Every API request must include `credentials: 'include'` so the browser sends the cookie cross-origin

## Auth Flows

### Login (`POST /api/v1/auth/login`)

Three-way branch based on the code:

1. **Valid user code** → Response contains `{id, display_name, role, character_id}`. Cookie is set. Redirect to role-appropriate home (`/` for player, `/gm` for GM).
2. **Valid invite code** → Response is `{}` (empty object). Frontend redirects to `/join` with the code, showing the join form.
3. **Unknown code** → 404 error. Show error message, stay on login page.

The magic link deep-link route `/login/[code]/page.tsx` auto-submits the code from the URL on mount.

### Join (`POST /api/v1/game/join`)

Invite redemption flow:

- Request: `{code, character_name, display_name}`
- Creates a User + Character atomically
- Sets cookie
- Redirect to player feed

### Setup (`POST /api/v1/setup`)

One-time GM bootstrap:

- Request: `{display_name}`
- Creates the GM account
- Returns `{id, display_name, role, login_url}`
- 409 if a GM already exists

### Refresh Link (`POST /api/v1/me/refresh-link`)

Rotates the user's login code. Returns `{login_url}` with the new magic link.

## AuthProvider Context

A React Context wrapping the root layout:

```typescript
interface AuthState {
  user: User | null       // null = unauthenticated or still loading
  isLoading: boolean      // true during initial /me check
  isGm: boolean           // derived: user?.role === 'gm'
  isPlayer: boolean       // derived: user?.role === 'player'
  characterId: string | null  // user?.character_id
}
```

On app load, `AuthProvider` calls `GET /api/v1/me`:
- **200**: Populate user state, proceed
- **401**: Set `user: null`, redirect to `/login`
- **Network error**: Show offline/error state

## Route Protection

### Layer 1: Next.js Middleware (Fast Path)

`middleware.ts` at project root checks for cookie presence:

- If `login_code` cookie is absent on a protected route → redirect to `/login`
- Public routes (`/login`, `/setup`, `/join`) are always accessible
- This is a fast, edge-compatible check — it does NOT validate the cookie's value

### Layer 2: Layout Guards (Full Validation)

- `(player)/layout.tsx` and `(gm)/layout.tsx` use `AuthProvider` to call `GET /me`
- If the user's role doesn't match the route group, redirect:
  - Player on `(gm)/` routes → redirect to `/`
  - GM can access both `(gm)/` and `(player)/` routes (GM has full visibility)
- If 401 (cookie expired/invalid) → redirect to `/login`

### Global Error Handling

In the base API client:
- **401 responses**: Clear local auth state, redirect to `/login`
- **403 responses**: Show toast "Permission denied" — do NOT redirect

## GM Character Duality

The GM may optionally own a character (`character_id` on the User). When `character_id` is set:

- GM can access `(gm)/character/page.tsx` to view their own character sheet
- GM-submitted proposals appear in the queue alongside player proposals
- The GM navigation includes a "My Character" link

## CORS Requirements

The frontend and backend run on different origins. Required backend configuration:

- `CORS_ORIGINS` must include the frontend's origin (e.g., `http://localhost:3000` for dev)
- `SameSite=Lax` cookies work when frontend and backend share the same registrable domain (e.g., both on `localhost`)
- For different domains in production, the backend may need `SameSite=None; Secure` or a reverse proxy to put both on the same origin
