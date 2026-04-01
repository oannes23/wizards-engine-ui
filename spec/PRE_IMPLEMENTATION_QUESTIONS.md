# Pre-Implementation Questions

> **Purpose**: Conceptual and vision gaps that need resolution before or during early implementation.  
> **Status**: In Progress  
> **Created**: 2026-04-01  

Each question is tagged: `[You]` (game design), `[Backend]` (needs backend dev), `[Both]`.

---

## 1. Bond Graph — Player Experience Weight `[You]`

**Context**: The backend confirmed bond-graph visibility applies **only to feeds/events**, not entity access. All players can freely browse all game objects (characters, groups, locations) regardless of bond distance. The bond graph — described in the spec as "the most unique architectural concept" — shapes *what news reaches you*, not *what you can see*.

### Q1: World Browser Bond Awareness

Should the World Browser reflect bond distance at all?

**Options**:
- (a) **Bond-aware browsing**: Show "connected to you" badges, sort bonded entities first, visual grouping by proximity tier
- (b) **Subtle hints**: No sorting changes, but show a small bond indicator on entities you're connected to
- (c) **Flat directory**: Bonds are invisible in the World Browser; it's a neutral reference tool
- (d) Other

**Answer**: _pending_

### Q2: Entity Detail Bond Context

When a player views a character/group/location they have no bond to, should the UI indicate the lack of connection?

**Answer**: _pending_

### Q3: Feed as Primary Bond Expression

If feeds are the *only* place bonds shape the player experience, should the feed feel more central/prominent in the UI (e.g., the default "home" view, richer presentation) rather than a flat news ticker?

**Answer**: _pending_

---

## 2. GM Queue & Workflow `[You]`

**Context**: The backend returns proposals in ULID order (newest first) with no built-in priority or sorting. The original spec described "priority-sorted queue with system proposals pinned at top." All sorting/prioritization logic is the frontend's responsibility.

### Q4: Queue Sort Algorithm

What ordering best serves the GM?

**Options**:
- (a) System proposals pinned at top, then oldest-pending-first (FIFO)
- (b) System proposals pinned at top, then newest-first
- (c) Grouped by character (all of Alice's proposals together, then Bob's, etc.)
- (d) Other

**Answer**: _pending_

### Q5: Clock + work_on_project Disconnect

Approving `work_on_project` does NOT auto-advance the associated clock (backend confirmed). The GM must separately use `modify_clock`. 

Should the UI prompt the GM to advance the clock after approving a work_on_project? Or is the two-step dance intentional (GM decides *if* and *how much* the clock advances independently)?

**Answer**: _pending_

### Q6: System Proposal Urgency

`resolve_clock` and `resolve_trauma` system proposals have empty `calculated_effect` and require the GM to fill in resolution details (e.g., bond selection for trauma, narrative for clock resolution).

How urgent are these relative to player proposals?

**Options**:
- (a) Visually pinned and blocking — can't easily ignore them
- (b) Visually distinct (different card styling, icon) but same position in queue flow
- (c) Separate section entirely (e.g., "System Actions" sidebar)
- (d) Other

**Answer**: _pending_

---

## 3. Session Mode & Game Loop Feel `[You]`

**Context**: When an active session exists, polling rates increase (5s instead of 10-20s) and session-only action types (use_skill, use_magic, charge_magic) unlock. Session is the "live play" mode; downtime is between sessions. The spec specifies an `ActiveSessionBanner` component but doesn't describe how dramatically the UI should shift.

### Q7: Session Indicator Prominence

How much should the UI change when a session is active?

**Options**:
- (a) **Subtle**: A persistent banner/badge, but layout and navigation unchanged
- (b) **Moderate**: Banner + nav badge + session-related views (feed, proposals) gain visual emphasis
- (c) **Dramatic**: Color/accent shift, different navigation emphasis, session-specific dashboard
- (d) Other

**Answer**: _pending_

### Q8: Action Availability Across Modes

Should actions unavailable in the current mode (e.g., downtime actions during a session) be:

**Options**:
- (a) **Hidden**: Only show available actions in the proposal wizard
- (b) **Disabled**: Show all actions, grey out unavailable ones with a tooltip explaining why
- (c) **Grouped**: Show available actions first, then a collapsed "unavailable" section

**Answer**: _pending_

### Q9: time_now Visibility

`time_now` is an abstract integer tracking campaign time progression. Is it ever shown to players?

**Options**:
- (a) **GM-only**: Players never see it; purely bookkeeping
- (b) **Visible but passive**: Shown on session cards/detail for both roles, but players can't interact with it
- (c) **Named concept**: Give it an in-world name (e.g., "Chapter", "Cycle") and display prominently
- (d) Other

**Answer**: _pending_

---

## 4. Narrative Voice & Copy `[You]`

**Context**: The spec is mechanically thorough but silent on tone. The UI needs copy for ~15+ empty states, toast messages, confirmation dialogs, error messages, and inline helper text. The studio logo features a stylized open book in navy/teal.

### Q10: Tone Register

What narrative register should the UI use?

**Options**:
- (a) **Diegetic/in-world**: "The threads of fate reveal nothing here..." / "No echoes reach this far..."
- (b) **Functional/neutral**: "No proposals yet" / "Session ended successfully"
- (c) **Warm/encouraging**: "Your story begins when you submit your first proposal" / "Ready for the next chapter?"
- (d) **Hybrid**: Functional for system messages (errors, confirmations), warm/thematic for empty states and onboarding

**Answer**: _pending_

### Q11: Deleted Entity Display

When a character, location, or bond target has been soft-deleted, what should appear?

**Options**:
- (a) **Bracket placeholder**: "[Deleted]" or "[Removed]"
- (b) **Name + visual indicator**: Original name with strikethrough, ghost styling, or faded opacity
- (c) **Narrative treatment**: "Lost to the mists" or similar in-world phrasing
- (d) Other

**Answer**: _pending_

---

## 5. Backend Coordination `[Backend]`

**Context**: Three items identified during spec review that need backend dev confirmation.

### Q12: Logout Endpoint

A CR was identified for `POST /auth/logout` to clear the httpOnly cookie server-side. Has this been implemented? If not, frontend will use `POST /me/refresh-link` (rotates login code) for secure logout and client-side cookie clearing for soft logout.

**Backend Status**: _pending_

### Q13: Pydantic 422 Normalization

The backend produces two 422 error shapes: the domain envelope `{error: {code, message, details}}` and raw Pydantic `{detail: [{loc, msg, type}]}`. A CR was filed to normalize Pydantic errors into the standard envelope. Has this been implemented? If not, the frontend will build a dual-parser.

**Backend Status**: _pending_

### Q14: Event Type Catalog Completeness

~43 event types documented with `{domain}.{action}` convention. Is this list exhaustive for the current backend codebase, or should the frontend expect unknown/future event types? This determines whether we need a graceful fallback renderer for unrecognized events.

**Backend Status**: _pending_

---

## 6. Minor UX Decisions `[Both]`

### Q15: Story Reading Order

Story detail endpoint returns most-recent entries first; the paginated entries endpoint returns oldest-first. What's the intended primary reading experience?

**Options**:
- (a) **Chronological** (oldest at top): Natural narrative reading order; "load more" loads older entries above/below
- (b) **Journal-style** (newest at top): Latest developments first; "load more" loads older entries below
- (c) **Configurable**: Let the user toggle sort order

**Answer**: _pending_

### Q16: 0-Participant Sessions

Backend allows starting a session with 0 participants. What's the use case?

**Options**:
- (a) **Warn + allow**: Show confirmation dialog ("No participants added — start anyway?")
- (b) **Block**: Require at least 1 participant to start
- (c) **Allow freely**: No special handling; GM knows what they're doing

**Answer**: _pending_

### Q17: Proposal Revision Flow

Players can edit rejected proposals. What happens mechanically?

**Options**:
- (a) **Edit-in-place**: Editing a rejected proposal keeps its status; player must explicitly "resubmit" (separate action) to move it back to pending
- (b) **Auto-resubmit**: Any edit to a rejected proposal automatically changes status back to pending
- (c) **New proposal**: Rejected proposals are read-only; player creates a new proposal (possibly pre-filled from the rejected one)

**Answer**: _pending_

**Follow-up**: Does the GM see revision history, or just the current state?

**Answer**: _pending_
