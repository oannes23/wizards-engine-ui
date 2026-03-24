# Epic 1.1 — Authentication & Onboarding

> Phase: 1
> Status: Not Started
> Depends on: Epic 0.1

## Goal

Enable users to log in, join the game, and manage their profile so the app is accessible to all participants.

## Stories

### 1.1.1 — Login Page

**As a** user, **I want** to enter my magic link code **so that** I can access the app.

**Files to create:**
- `src/app/(auth)/login/page.tsx`
- `src/lib/api/services/auth.ts` (extend with login call)

**Acceptance criteria:**
- [ ] Code input form with submit button
- [ ] On valid user code: cookie set, redirect to role-appropriate home
- [ ] On invite code (`{}` response): redirect to `/join` with code
- [ ] On invalid code: 404 → error message displayed
- [ ] Loading state during API call

### 1.1.2 — Magic Link Deep-Link

**As a** user, **I want** magic link URLs to auto-login **so that** I don't need to type a code.

**Files to create:**
- `src/app/(auth)/login/[code]/page.tsx`

**Acceptance criteria:**
- [ ] Extracts code from URL on mount
- [ ] Auto-submits login request
- [ ] Shows loading spinner during call
- [ ] Same three-way branch handling as login page

### 1.1.3 — Setup Page

**As a** GM, **I want** to bootstrap my account **so that** I can start running the game.

**Files to create:**
- `src/app/(auth)/setup/page.tsx`

**Acceptance criteria:**
- [ ] Display name input form
- [ ] `POST /setup` on submit
- [ ] On 409: "GM account already exists" message
- [ ] On success: show login URL, redirect

### 1.1.4 — Join Page

**As a** new player, **I want** to redeem my invite **so that** I can join the game with a character.

**Files to create:**
- `src/app/(auth)/join/page.tsx`

**Acceptance criteria:**
- [ ] Display name + character name input form
- [ ] Invite code passed from login redirect
- [ ] `POST /game/join` creates user + character atomically
- [ ] On success: cookie set, redirect to player feed

### 1.1.5 — Profile Page

**As a** user, **I want** to manage my profile **so that** I can update my display name and refresh my login link.

**Files to create:**
- `src/app/(player)/profile/page.tsx`

**Acceptance criteria:**
- [ ] Display name shown, inline editable
- [ ] Role badge displayed
- [ ] Starred objects list with unstar buttons
- [ ] Refresh magic link button with confirmation
- [ ] Success toast on save

### 1.1.6 — Auth Redirect Middleware

**As a** developer, **I want** route protection **so that** unauthorized users are redirected appropriately.

**Files to modify:**
- `src/middleware.ts` (extend)
- `src/app/(player)/layout.tsx` (add role guard)
- `src/app/(gm)/layout.tsx` (add role guard)

**Acceptance criteria:**
- [ ] No cookie → redirect to `/login` (all protected routes)
- [ ] Player on GM route → redirect to `/`
- [ ] GM on player routes → allowed
- [ ] Auth pages accessible without cookie
