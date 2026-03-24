# Epic 2.2 — GM Queue & Proposal Review

> Phase: 2
> Status: Not Started
> Depends on: Epic 2.1

## Goal

Enable the GM to review, approve, and reject proposals from a centralized queue — the GM's primary workflow.

## Stories

### 2.2.1 — GM Queue Page

**As a** GM, **I want** to see pending proposals **so that** I can review and adjudicate player actions.

**Files to create:**
- `src/app/(gm)/page.tsx`
- `src/lib/hooks/useGmQueue.ts`

**Acceptance criteria:**
- [ ] Lists pending proposals from `GET /proposals?status=pending`
- [ ] System proposals (`origin: "system"`) shown first with urgency indicator
- [ ] Player proposals sorted by created_at (oldest first)
- [ ] Polling at 10–15s
- [ ] Empty state when no pending proposals

### 2.2.2 — Proposal Review Card

**As a** GM, **I want** to expand a proposal to see full details **so that** I can make informed decisions.

**Files to create:**
- `src/features/proposals/GmProposalCard.tsx`
- `src/features/proposals/CalculatedEffectSummary.tsx`

**Acceptance criteria:**
- [ ] Accordion card: collapsed shows summary, expanded shows full detail
- [ ] Expanded view: narrative, selections, calculated_effect breakdown
- [ ] Character's current meter state shown alongside for context
- [ ] System proposals surface GM-required fields (which bond for trauma, etc.)
- [ ] Accordion state preserved across poll refreshes

### 2.2.3 — Approve Form

**As a** GM, **I want** to approve proposals with optional overrides **so that** I can adjudicate with flexibility.

**Files to create:**
- `src/features/proposals/ApproveForm.tsx`
- `src/features/proposals/RiderEventForm.tsx`

**Acceptance criteria:**
- [ ] Simple "Approve" button for quick approval (most common path)
- [ ] Expandable overrides section: narrative override, boolean flags (force, bond_strained)
- [ ] Optional rider event section (mini GM Actions form)
- [ ] `POST /proposals/{id}/approve` with optional body
- [ ] On success: proposal removed from queue, success toast
- [ ] On 409 (already acted on): error toast, queue refresh

### 2.2.4 — Reject Form

**As a** GM, **I want** to reject proposals with a note **so that** the player knows what to fix.

**Acceptance criteria:**
- [ ] "Reject" button with optional rejection note textarea
- [ ] `POST /proposals/{id}/reject` with optional body
- [ ] On success: proposal removed from queue, success toast

### 2.2.5 — Queue Summary

**As a** GM, **I want** contextual dashboard info **so that** I have situational awareness while reviewing proposals.

**Files to create:**
- `src/features/gm/QueueSummary.tsx`
- `src/lib/hooks/useGmDashboard.ts`

**Acceptance criteria:**
- [ ] `GET /gm/queue-summary` data displayed as cards
- [ ] PC summaries with meter mini-bars
- [ ] Near-completion clocks highlighted
- [ ] Stress proximity warnings
- [ ] Desktop: sidebar layout. Mobile: collapsible section.

### 2.2.6 — Nav Badge for Pending Count

**As a** GM, **I want** to see the pending count on the Queue tab **so that** I know when new proposals arrive.

**Acceptance criteria:**
- [ ] Badge on Queue nav tab shows pending proposal count
- [ ] Updates with polling
- [ ] `aria-label="Pending proposals: N"`
