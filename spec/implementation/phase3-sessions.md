# Epic 3.3 — Session Management

> Phase: 3
> Status: Complete
> Depends on: Epic 1.2
> Last verified: 2026-04-03

## Goal

Enable the GM to create, manage, and run play sessions with lifecycle controls and participant management.

## Stories

### 3.3.1 — Session List Page

**Files to create:**
- `src/app/(gm)/sessions/page.tsx`
- `src/lib/hooks/useSessions.ts`
- `src/lib/api/services/sessions.ts`

**Acceptance criteria:**
- [ ] List all sessions with status badges (Draft/Active/Ended)
- [ ] "Create Session" button
- [ ] Most recent first

### 3.3.2 — Create Session Form

**Acceptance criteria:**
- [ ] Fields: time_now (integer), date, summary, notes
- [ ] `POST /sessions` creates draft session
- [ ] Success → redirect to session detail

### 3.3.3 — Session Detail Page

**Files to create:**
- `src/app/(gm)/sessions/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Session info: status badge, time_now, date, summary, notes
- [ ] Participant list (see 3.3.5)
- [ ] Session timeline feed (see Epic 2.3)
- [ ] Lifecycle controls (see 3.3.4)
- [ ] Edit fields for draft/active sessions

### 3.3.4 — Lifecycle Controls

**Acceptance criteria:**
- [ ] **Start button** (Draft only):
  - Warning: "This will distribute FT and Plot to participants"
  - Disabled if another session is active
  - `POST /sessions/{id}/start`
  - On 409: "Another session is already active" error
- [ ] **End button** (Active only):
  - Warning: "Plot will be clamped to 5 for all participants"
  - `POST /sessions/{id}/end`
- [ ] **Delete button** (Draft only):
  - Confirmation dialog
  - `DELETE /sessions/{id}`
  - On 400: error toast
- [ ] Controls hidden for inappropriate states

### 3.3.5 — Participant Management

**Files to create:**
- `src/features/sessions/ParticipantList.tsx`

**Acceptance criteria:**
- [ ] List participants with character name and contribution flag
- [ ] Add participant: character selector → `POST /sessions/{id}/participants`
- [ ] Remove participant: `DELETE /sessions/{id}/participants/{character_id}`
- [ ] Toggle contribution: `PATCH /sessions/{id}/participants/{character_id}` (draft only)

### 3.3.6 — GM Dashboard

**Files to create:**
- `src/features/gm/Dashboard.tsx`

**Acceptance criteria:**
- [ ] `GET /gm/dashboard` data displayed
- [ ] Pending proposals count
- [ ] PC summaries with mini meter bars (CharacterSummaryRow)
- [ ] Near-completion clocks
- [ ] Stress proximity warnings
- [ ] Polling at 15–20s
