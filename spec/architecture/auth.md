# Authentication & Authorization

> Status: Deepened
> Last verified: 2026-03-26
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
  isViewer: boolean       // derived: user?.role === 'viewer'
  canViewGmContent: boolean  // derived: user?.can_view_gm_content (GM + viewer)
  canTakeGmActions: boolean  // derived: user?.can_take_gm_actions (GM only)
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

---

## Interrogation Decisions (2026-03-26)

### Auth Race Condition: Block Children

- **Decision**: AuthProvider blocks rendering of children while `isLoading` is true
- **Rationale**: Prevents premature API calls from child components that would 401 before auth resolves. Simple gate — children only mount once auth state is known.
- **Pattern**:
  ```tsx
  function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading, error } = useQuery({
      queryKey: ['auth', 'me'],
      queryFn: () => api.get<User>('/me'),
      retry: false,
    })

    if (isLoading) return <AppLoadingSkeleton />
    if (error) return <OfflineErrorPage onRetry={() => window.location.reload()} />

    return (
      <AuthContext.Provider value={{ user: user ?? null, isGm: user?.role === 'gm', ... }}>
        {children}
      </AuthContext.Provider>
    )
  }
  ```
- **Implications**: `AppLoadingSkeleton` is a full-page branded skeleton in `components/layout/`. `OfflineErrorPage` shows logo + "Unable to connect" + retry button.

### GM Routing: Separate Layouts

- **Decision**: Keep `(player)/layout.tsx` and `(gm)/layout.tsx` as distinct layouts with separate role checks. Viewers use the `(gm)/` layout in read-only mode.
- **Rationale**: Clean separation. Player layout rejects non-players. GM layout accepts GM and viewer roles (`can_view_gm_content === true`). GM accesses character views via `(gm)/character/` route that reuses character feature components (not by navigating to player routes).
- **Implications**: GM nav and player nav are separate components. GM character page at `(gm)/character/page.tsx` imports the same feature components as `(player)/character/page.tsx` but with GM layout wrapper. Viewer uses GM layout but all mutation buttons (approve, reject, create, edit, delete) are hidden when `can_take_gm_actions === false`.

### Viewer Routing

- **Decision**: Viewers route to the GM dashboard (read-only) after login. They share the `(gm)/` layout with action buttons hidden.
- **Rationale**: Viewers need the same views as the GM (dashboard, queue, all proposals, all characters) but without mutation capabilities. Reusing the GM layout with capability-based rendering is simpler than a third layout.
- **Pattern**:
  ```
  role === "gm"     → GM dashboard (full access)
  role === "viewer" → GM dashboard (read-only — hide action buttons)
  role === "player" → Player character sheet
  ```
- **Implications**: Use `can_take_gm_actions` (not `role === "gm"`) to gate action buttons. Use `can_view_gm_content` (not `role === "gm"`) to gate GM-level read access.

### Login Deep-Link UX: Branded Loading

- **Decision**: Show logo + "Signing in..." during auto-submit, with error fallback
- **Rationale**: Feels intentional and polished. On slow networks, users see something reassuring. On failure, they get clear error + retry option.
- **Pattern**:
  - `/login/[code]/page.tsx` renders branded loading on mount, auto-submits POST to `/auth/login`
  - Success → redirect based on role (player home or GM dashboard)
  - Failure → show error message: "This link is invalid or has expired" + link to request a new one
  - Invite code (empty `{}` response) → redirect to `/join?code=<code>`
- **Implications**: The loading state uses `AppLoadingSkeleton` (same as AuthProvider loading) for consistency

### Offline / Network Error: Full-Page Error

- **Decision**: Branded full-page error when the initial `/me` call fails due to network error
- **Rationale**: Nothing works without the backend — a full-page error is honest and clear. No point showing a stale shell.
- **Pattern**: Logo + "Unable to connect to server" + "Retry" button that reloads the page. No auto-retry loop.
- **Implications**: `OfflineErrorPage` component in `components/layout/`

### Session Expiry: Redirect + Toast

- **Decision**: On mid-use 401 from any API call, redirect to `/login` with a toast
- **Rationale**: Clean break — no stale state, no confusing overlay. The magic link model has no refresh flow, so re-auth requires a new magic link.
- **Pattern**: TanStack Query global `onError` detects 401 → clears auth context → `router.push('/login')` → toast "Session expired — please sign in again"
- **Implications**: Aligns with the api-client.md decision to handle 401s in TanStack Query's global onError. Toast uses the arch-level toast system.

### Logout

- **Decision**: Use `POST /api/v1/auth/logout` (204 No Content, no auth required) to clear the httpOnly cookie server-side. For a secure logout that also invalidates the magic link, call `POST /me/refresh-link` first to rotate the code, then `POST /auth/logout` to clear the cookie.
- **Rationale**: The logout endpoint clears the cookie but does NOT invalidate the login code — the magic link remains usable. This is a "soft logout" (browser session ends, link still works). For a "hard logout" (code revoked), rotate the code first. Login codes: ULID format (26 chars) for initial invites, URL-safe base64 (43 chars) after refresh. Case-sensitive.
- **Pattern**:
  - Soft logout: `POST /auth/logout` → clear local auth context → redirect to `/login`
  - Secure logout: `POST /me/refresh-link` → `POST /auth/logout` → clear local auth context → redirect to `/login`

### Auth Retry

- **Decision**: 3 retries with exponential backoff (1s, 2s, 4s) for `GET /me` on app load. After 3 failures, show full-page error with manual "Retry" button. No infinite loop.
- **Rationale**: Handles transient network issues without blocking the user indefinitely.
