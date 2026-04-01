# Backend Questionnaire — Frontend Outstanding Questions

> Created: 2026-03-29
> Purpose: Questions about backend API behavior that the frontend team needs answered to finalize implementation specs. These are not change requests — they are clarification questions about existing or planned behavior.
> Related: [OUTSTANDING_QUESTIONS.md](../OUTSTANDING_QUESTIONS.md), [contract.md](contract.md), [response-shapes.md](response-shapes.md)

---

## How to Use

Each question has a unique ID matching the parent tracking doc (`Q-NNN`). Please answer inline by filling in the **Answer** field. If a question reveals a gap in the backend, note whether it requires a code change or just documentation.

---

## Event System

### BQ-01: Event Type Catalog (Q-029)

The frontend needs to map event types to icons and labels. `response-shapes.md` lists some known types (`proposal.approved`, `character.updated`, `clock.advanced`, etc.) and calls them "convention strings."

**Questions:**
1. Is there a definitive list of all event type strings the backend can produce?
2. If a new event type is added in the future, is it safe for the frontend to render unknown types with a generic fallback icon + the raw type string?
3. Can you provide the complete list of current event types?

**Answer:**

---

### BQ-02: Rider Event Type Restrictions (Q-030)

The rider event payload accepts a `type: string`. The frontend needs to know what to offer in the rider type selector.

**Questions:**
1. Are there restrictions on which event types can be used as rider events?
2. If restricted, what is the allowed set? (e.g., only GM-action-derived types like `character.stress_changed`?)
3. Does the backend validate the rider type, or does it accept any string?

**Answer:**

---

### BQ-03: Session Timeline Visibility (Q-031)

The player feed uses bond-graph visibility to filter events. Session detail pages show a timeline of events from that session.

**Questions:**
1. Are session timeline events filtered by the requesting player's bond-graph visibility? Or do session participants see all events from that session regardless of bond distance?
2. If a non-participant views a session detail page, do they see any events?

**Answer:**

---

### BQ-04: Rejected Proposal Events (Q-032)

When the GM rejects a proposal, no approval event is created. The rejection only sets `status: "rejected"` on the proposal.

**Questions:**
1. Does rejecting a proposal create any event at all? (e.g., a `proposal.rejected` event visible to the submitting player?)
2. Or are rejected proposals only discoverable via `GET /proposals?status=rejected`?

**Answer:**

---

### BQ-05: Retroactive Visibility Changes (Q-050)

`PATCH /events/{id}/visibility` can change an event's visibility level.

**Questions:**
1. Can the GM make a previously public event silent (retroactively hiding it from player feeds)?
2. If yes, is this immediate — does the event disappear from player feed responses on the next GET?

**Answer:**

---

### BQ-06: Riders in Batch GM Actions (Q-051)

Rider events are currently documented as part of proposal approval. The batch GM actions endpoint processes multiple actions.

**Questions:**
1. Can individual actions within a batch include rider events?
2. Or are rider events exclusively available on proposal approvals (not on standalone GM actions)?

**Answer:**

---

## Proposals & Validation

### BQ-07: GM Queue Sort Order (Q-034)

The frontend spec says "priority-sorted" queue with system proposals pinned at top.

**Questions:**
1. What is the sort order for player proposals returned by `GET /proposals?status=pending`? Creation time descending (newest first)?
2. Is there any urgency weighting (e.g., stress-near-max characters sorted higher)?
3. Does the API return them pre-sorted, or does the frontend need to sort client-side?

**Answer:**

---

### BQ-08: System Proposal Calculated Effect (Q-035)

`resolve_clock` and `resolve_trauma` system proposals have `null` calculated_effect.

**Questions:**
1. Is this confirmed — `calculated_effect` is always `null` for system proposals?
2. Is there any other data on the system proposal response that the frontend should display in lieu of a calculated effect (e.g., the clock's current state, the character's stress/trauma info)?
3. Or does the frontend need to separately fetch the related entity (clock or character) to show context?

**Answer:**

---

### BQ-09: GM Action Valid Changes Fields (Q-036)

`response-shapes.md` documents valid `changes` fields for 7 of 14 GM action types (`modify_character`, `modify_group`, `modify_location`, `modify_clock`, `modify_bond`, `modify_trait`, `modify_effect`). The remaining 7 types are undocumented.

**Questions:**
1. For `create_bond`, `retire_bond`, `create_trait`, `retire_trait`, `create_effect`, `retire_effect`, `award_xp` — what is the request body shape for each?
2. Do the `create_*` types use the same `changes` dict pattern, or do they have a different request structure (e.g., a full entity definition)?
3. Does `award_xp` use `changes: { xp: { delta: N } }` or a different shape?

**Answer:**

---

### BQ-10: Proposal Concurrency — Optimistic Locking (Q-015, Q-016)

We've decided the frontend should use optimistic locking with `updated_at` to handle the race condition where a player edits a proposal while the GM approves it.

**Questions:**
1. Does `PATCH /proposals/{id}` support an `If-Unmodified-Since` header or an `updated_at` field in the request body for concurrency control?
2. If the proposal was modified since the provided timestamp, does the API return 409?
3. If this doesn't exist yet, this becomes a change request (CR).

**Answer:**

---

## Auth & Identity

### BQ-11: Logout Mechanism (Q-037)

No explicit logout endpoint is documented. Users authenticate via magic-link httpOnly cookies.

**Questions:**
1. Is there a logout endpoint (e.g., `POST /auth/logout` or `DELETE /auth/session`)?
2. If not, is `POST /me/refresh-link` (which rotates the login code) the intended way to invalidate a session?
3. Or is there no logout — users simply wait for cookie expiry?

**Answer:**

---

### BQ-12: Login Code Format (Q-039)

The login page needs a code input form, but the code format is undefined.

**Questions:**
1. What format are login codes? (UUID, short alphanumeric, word-based phrase, etc.)
2. What is the length?
3. Are they case-sensitive?
4. Are they the same format as invite codes?

**Answer:**

---

### BQ-13: Cookie Max-Age (Q-054)

The auth spec states cookies have `Max-Age = 1 year`.

**Questions:**
1. Can you confirm the actual `Max-Age` set by the backend on the `login_code` cookie?
2. Is there any session timeout independent of cookie expiry (e.g., server-side session TTL)?

**Answer:**

---

## Visibility & Permissions

### BQ-14: Bond-Graph Filtered Entity Access (Q-042)

When a player requests a game object detail that's outside their bond-graph visibility range.

**Questions:**
1. Does the API return 404? 403? Or a minimal/sanitized response with reduced fields?
2. Is the behavior consistent across characters, groups, and locations?
3. For list endpoints — are invisible entities simply omitted from the results?

**Answer:**

---

### BQ-15: Other Character's Data in World Browser (Q-043)

Players can view other characters via `GET /characters/{id}`.

**Questions:**
1. Does the API return full detail (meters, skills, magic stats, traits, bonds, feed) for any character the player requests?
2. Or does it return `detail_level: "simplified"` for characters outside a certain bond distance?
3. Is the feed on another character's detail page also visibility-filtered?

**Answer:**

---

### BQ-16: GM Self-Approval (Q-044)

The GM can own a character and submit proposals.

**Questions:**
1. Can the GM approve their own proposals?
2. Do GM-submitted proposals appear in the GM queue alongside player proposals?
3. Or are GM proposals auto-approved (bypassing the queue)?

**Answer:**

---

### BQ-17: Story Visibility Overrides Shape (Q-045)

`StoryDetailResponse` includes `visibility_overrides: unknown[]`.

**Questions:**
1. What is the shape of each entry in `visibility_overrides`?
2. Is it a list of character IDs, user IDs, or something more structured (e.g., `{ type: "character", id: "..." }`)?
3. How are overrides added — GM action only, or can players opt in?

**Answer:**

---

### BQ-18: Duplicate Bond Uniqueness (Q-046)

A character has max 8 PC bond slots, but uniqueness per target is unspecified.

**Questions:**
1. Can a character have two active bonds to the same target?
2. If a player submits `new_bond` targeting an entity they already have an active bond with, does the API reject it?
3. What error code?

**Answer:**

---

## Data Shapes & Edge Cases

### BQ-19: Location Presence Tier Labels (Q-052)

The location detail response returns `{ common: EntityRef[], familiar: EntityRef[], known: EntityRef[] }`.

**Questions:**
1. Are the keys `common`, `familiar`, `known` the only tier keys, guaranteed to always be present (even if empty arrays)?
2. Should the frontend hardcode the display labels ("Commonly present", "Often present", "Sometimes present") based on these keys?
3. Or does the API include display labels somewhere?

**Answer:**

---

### BQ-20: 422 Without details.fields (Q-062)

The error envelope has `details?: { fields?: Record<string, string> }`.

**Questions:**
1. Under what circumstances does a 422 response lack `details.fields`? (e.g., body-level validation vs field-level?)
2. Is the `message` field always human-readable enough to display to the user as a fallback?

**Answer:**

---

### BQ-21: 201 Response Body Completeness (Q-056)

TanStack Query can update the cache directly from mutation responses, avoiding a refetch.

**Questions:**
1. Do all POST endpoints that return 201 include the full created entity in the response body (same shape as the corresponding GET)?
2. Are there any 201 responses that return a partial entity or just an ID?

**Answer:**

---

## Decisions to Verify

The following decisions were made during frontend spec interrogation and touch backend behavior. Please confirm or correct.

### BV-01: Clock Progression on work_on_project Approval (Q-001, Q-002)

**Frontend assumption:** When the GM approves a `work_on_project` proposal targeting a clock, progress increments (defaulting to +1). The GM can also modify progress directly via `modify_clock`.

**Question:** Is this how the backend works? Does approving `work_on_project` auto-increment the targeted clock, or is it a separate GM step?

**Answer:**

---

### BV-02: Clock Resolution Auto-Generation (Q-002, Q-003)

**Frontend assumption:** When a clock's `progress == segments`, the backend auto-generates a `resolve_clock` system proposal. After resolution, the clock gets `is_completed: true` and stays visible (not soft-deleted).

**Question:** Correct? Does the system proposal auto-generate, or does the GM manually trigger resolution?

**Answer:**

---

### BV-03: No-Cascade Soft-Delete (Q-005, Q-006)

**Frontend assumption (from game-objects.md):** Soft-deleting a game object does NOT cascade. Bonds stay active but become dead ends. Pending proposals stay pending for GM to resolve. Story entries remain attributed. References always resolvable.

**Question:** Confirmed? Specifically: does `GET /characters/{deleted_id}` still return the full character (with `is_deleted: true`), or does it return 404?

**Answer:**

---

### BV-04: Group Membership Derived from Active Bonds Only (Q-009)

**Frontend assumption:** A group's `members[]` list is server-computed from active bonds. When a bond to a group retires to Past, the character disappears from the members list.

**Question:** Correct? Does the API derive membership dynamically, or is membership a stored field?

**Answer:**

---

### BV-05: Proposal Optimistic Locking (Q-015, Q-016)

**Frontend decision:** Use `updated_at`-based optimistic locking for proposal edits. PATCH includes `updated_at`; backend returns 409 if the proposal was modified since that timestamp.

**Question:** Does this mechanism exist? If not, this becomes a change request. See also BQ-10.

**Answer:**

---

### BV-06: Narrative Field Optionality (Q-018)

**Frontend assumption:** The `narrative` field on proposals is always optional — it's player flavor text, not mechanically validated. This applies to both `POST /proposals/calculate` and `POST /proposals`.

**Question:** Correct? Or is `narrative` required for certain action types (e.g., `work_on_project`)?

**Answer:**

---

### BV-07: Dual-Use Bond/Trait as Modifier + Sacrifice (Q-020)

**Frontend assumption:** A player can use the same bond or trait as both a modifier (+1d) and a sacrifice in a single magic proposal. Both costs apply.

**Question:** Does the backend allow this? Or does it validate against dual-use?

**Answer:**

---

### BV-08: FT Sacrifice Rate at Magic Stat 0 (Q-021)

**Frontend assumption:** The formula `3 + lowest_magic_stat` works at 0, giving a rate of 3 FT per sacrifice die. No floor or special case.

**Question:** Confirmed?

**Answer:**

---

### BV-09: Trauma Threshold and Stress Max (Q-022)

**Frontend assumption:** There's no hard system cap on trauma count. Whether a character is "retired" at a certain trauma level is a narrative/GM decision. The frontend just renders whatever the backend returns.

**Question:** Is there a backend-enforced cap on trauma count? Or can `effective_stress_max` theoretically reach 0?

**Answer:**

---

### BV-10: Session Mechanics (Q-025, Q-026, Q-027, Q-028)

**Frontend assumptions:**
- Re-join after leaving a session is allowed (POST after DELETE for same participant doesn't 409)
- GM cannot start a session with 0 participants (API returns error)
- `time_now` is non-negative, can repeat across sessions (no strict ordering)
- `additional_contribution` grants +2 Plot (vs +1 base) and has a narrative meaning (GM can contextualize it, e.g., "MVP", "notable RP")

**Question:** Please confirm or correct each.

**Answer:**
