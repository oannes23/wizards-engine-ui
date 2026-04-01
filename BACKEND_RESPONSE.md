# Backend Response — Frontend Outstanding Questions

> Created: 2026-03-29
> Purpose: Answers to the backend questionnaire from the frontend team.
> Authority: Spec files in `spec/domains/` and `spec/architecture/`. Code in `src/wizards_engine/`.
> Companion: [BACKEND_QUESTIONNAIRE.md](BACKEND_QUESTIONNAIRE.md)

---

## Conventions

- **Spec ref**: `(spec/domains/file.md, Section)` — links to the authoritative spec.
- **Gap (documentation)**: Missing documentation; no code change needed.
- **Gap (code change required)**: Missing feature; becomes a Change Request (CR).

---

## Event System

### BQ-01: Event Type Catalog (Q-029)

**Answer:**

1. Yes. The definitive list is in `spec/domains/events.md`, Event Types section. Event types are convention-based strings following `{domain}.{action}` naming — not a hardcoded enum, so new types can be added without schema changes.

2. Yes, rendering unknown types with a generic fallback icon + raw type string is the correct approach. The spec explicitly states: "New types can be added without schema changes."

3. Complete list of current event types:

| Domain | Event Types |
|--------|------------|
| `proposal` | `proposal.approved`, `proposal.rejected`, `proposal.revised` |
| `character` | `character.created`, `character.updated`, `character.deleted`, `character.stress_changed`, `character.gnosis_changed`, `character.meter_updated`, `character.resolve_trauma_generated` |
| `trait` | `trait.charge_spent`, `trait.recharged`, `trait.retired`, `trait.created` |
| `bond` | `bond.stress_changed`, `bond.degraded`, `bond.maintained`, `bond.retired`, `bond.created` |
| `magic` | `magic.effect_created`, `magic.effect_used`, `magic.effect_retired`, `magic.effect_charged` |
| `clock` | `clock.advanced`, `clock.completed`, `clock.created`, `clock.modified`, `clock.resolve_generated` |
| `session` | `session.started`, `session.ended`, `session.ft_distributed`, `session.plot_distributed`, `session.participant_added`, `session.participant_removed` |
| `group` | `group.created`, `group.updated`, `group.bond_changed` |
| `location` | `location.created`, `location.updated` |
| `story` | `story.created`, `story.updated` |
| `player` | `player.find_time`, `player.recharge_trait`, `player.maintain_bond` |

Additional notes:
- NPCs use `character.*` event types (same as PCs) — no separate `npc.*` types.
- GM actions reuse domain event types (e.g., `character.stress_changed`) with `actor_type: "gm"` to distinguish origin.
- Story entries do NOT produce events — they appear as `story_entry` feed items directly.
- User-level actions (profile changes, starring) do NOT produce events.

*(spec/domains/events.md, Event Types)*

---

### BQ-02: Rider Event Type Restrictions (Q-030)

**Answer:**

1. No restrictions. Rider events reuse domain event types — any valid `{domain}.{action}` string is accepted.

2. N/A — the set is not restricted.

3. The backend does NOT validate the rider `type` string against the event type catalog. The GM provides the rider event payload on approval with `{targets, changes, narrative, visibility, metadata?}` and sets the type to whatever domain event type fits the side effect (e.g., `character.stress_changed`, `clock.advanced`).

*(spec/domains/events.md, Rider Events; spec/domains/actions.md, Rider Events)*

---

### BQ-03: Session Timeline Visibility (Q-031)

**Answer:**

1. Yes, session timeline events ARE filtered by the requesting player's bond-graph visibility. The endpoint `GET /api/v1/sessions/{id}/timeline` applies the unified 7-level visibility model. `silent` events are excluded for ALL callers, including the GM (silent events are only accessible via the dedicated `/me/feed/silent` endpoint).

2. Non-participants see only events they would see via the bond graph — there is no special "session participant" visibility grant. If a non-participant has no bond-graph path to any event target, they see nothing.

*(spec/domains/downtime.md, API Endpoints — Session Timeline)*

---

### BQ-04: Rejected Proposal Events (Q-032)

**Answer:**

1. Yes, rejecting a proposal DOES create a `proposal.rejected` event with `private` visibility. Only the proposer and GM see rejections.

2. Rejected proposals are discoverable both ways — via the `proposal.rejected` event in the proposer's feed AND via `GET /proposals?status=rejected`.

*(spec/domains/events.md, Event Sources and Defaults Per Event Type)*

---

### BQ-05: Retroactive Visibility Changes (Q-050)

**Answer:**

1. Yes, the GM can change any event's visibility to any of the 7 levels, including `silent` (which removes it from all normal feeds) or `gm_only`. This is explicitly supported for narrative flexibility — "making a secret Group event `gm_only` to prevent spoilers" or "elevating a private event to `global` for dramatic reveals."

2. Yes, it is immediate. Visibility is computed on read (not cached), so the event disappears from player feed responses on the very next GET.

Note: `visibility` is the ONLY mutable field on events. All other fields are read-only after creation.

*(spec/domains/events.md, GM Override and Append-Only Guarantees)*

---

### BQ-06: Riders in Batch GM Actions (Q-051)

**Answer:**

1. No. The batch GM actions endpoint body shape is `{actions: [{action_type, targets, changes, narrative, visibility?}, ...]}` — no `rider_event` field.

2. Correct — rider events are exclusively available on proposal approvals (`POST /api/v1/proposals/{id}/approve`). The batch endpoint reuses the standard GM action dispatch, which does not support riders.

*(spec/implementation/phase55-api-additions.md, Story 5.5.5; spec/domains/actions.md, Rider Events)*

---

## Proposals & Validation

### BQ-07: GM Queue Sort Order (Q-034)

**Answer:**

1. All list endpoints (including `GET /proposals?status=pending`) return items in ULID order — newest first (creation time descending). This is consistent across all endpoints.

2. No urgency weighting exists. No priority sorting. The API does not pin system proposals.

3. The API returns proposals pre-sorted by ULID (creation time, newest first). Any "priority-sorted queue" with system proposals pinned at top is a **frontend concern** — the client would need to sort/partition client-side.

> **Gap (documentation)**: The frontend spec's "priority-sorted queue" language should be clarified as a UI-layer responsibility, not API behavior.

*(spec/architecture/api-conventions.md, Sorting)*

---

### BQ-08: System Proposal Calculated Effect (Q-035)

**Answer:**

1. Confirmed — `calculated_effect` is `{}` (empty dict) for both `resolve_clock` and `resolve_trauma`. These have no calculation; the GM fills in narrative and outcome on approval.

2. The system proposal response includes a `details` field with context data:
   - `resolve_clock`: `{clock_id, associated_object_type, associated_object_id}` — auto-populated from the clock's polymorphic association. Also includes an auto-generated narrative stub (e.g., the clock's name).
   - `resolve_trauma`: `{character_id}` — auto-populated. Narrative stub: "Stress max reached — Trauma must be resolved."

3. Yes, the frontend needs to separately fetch the related entity (clock or character) to show context. The proposal response does not embed the full entity data.

*(spec/domains/actions.md, System Proposals: resolve_clock and resolve_trauma)*

---

### BQ-09: GM Action Valid Changes Fields (Q-036)

**Answer:**

The `create_*`, `retire_*`, and `award_xp` types do NOT use the `changes: {field: {before, after}}` dict pattern. Only `modify_*` types use that pattern.

All GM actions go through `POST /api/v1/gm/actions` with this envelope:
```
{
  action_type: string,
  targets: [{type, id}],
  changes: {...},          // Type-specific payload (shape varies — see below)
  narrative: string,
  visibility?: string
}
```

**Request body shapes per type:**

1. **`create_bond`**: `targets` includes source and target Game Objects. `changes` contains: `{source_label?, target_label?, description?, bidirectional?}`. The system auto-infers `bidirectional` from the pairing type; the GM can override.

2. **`retire_bond`**: `targets` includes the bond's owning Game Object. `changes` contains: `{bond_id}`. Sets `is_active = false`.

3. **`create_trait`**: `targets` includes the owning Game Object. `changes` contains: `{slot_type, template_id?, name?, description?}`. For PCs, either `template_id` (from Trait Template catalog) or `name`/`description` (inline freeform). For Group/Location traits, always inline.

4. **`retire_trait`**: `targets` includes the owning Game Object. `changes` contains: `{trait_id}`. Sets `is_active = false`.

5. **`create_effect`**: `targets` includes the character. `changes` contains: `{name, description, effect_type: "instant"|"charged"|"permanent", power_level: 1-5, charges_current?, charges_max?}`. `charges_*` fields required for `charged` type.

6. **`retire_effect`**: `targets` includes the character. `changes` contains: `{effect_id}`. Sets `is_active = false`, frees cap slot.

7. **`award_xp`**: `targets` includes the character. `changes` contains: `{magic_stat: string, xp_amount: int}`. Increments the specified Magic Stat's XP. If XP reaches the 5-per-level threshold, auto-levels and resets XP to 0 (no overflow carry).

*(spec/domains/actions.md, GM Action Type Catalog and GM Action Endpoint)*

---

### BQ-10: Proposal Concurrency — Optimistic Locking (Q-015, Q-016)

**Answer:**

1. No. `PATCH /proposals/{id}` does not support `If-Unmodified-Since` headers or an `updated_at` field in the request body.

2. N/A — the mechanism does not exist.

3. **This becomes a CR.**

The current concurrency model is re-validation on approval: if resources changed between submission and approval, the system returns 409 Conflict with insufficient resources listed, and the GM can retry with `force: true`. But there is no edit-level concurrency control for the race condition where a player edits while the GM approves simultaneously.

> **Gap (code change required)**: Implement `updated_at`-based optimistic locking on `PATCH /proposals/{id}`. Accept `updated_at` in the request body; return 409 if the proposal was modified since that timestamp.

*(spec/domains/actions.md, Concurrency and Resource Validation & Timing)*

---

## Auth & Identity

### BQ-11: Logout Mechanism (Q-037)

**Answer:**

1. No explicit logout endpoint exists. No `POST /auth/logout` or `DELETE /auth/session`.

2. `POST /me/refresh-link` is the closest mechanism — it generates a new login code, invalidates the old one, updates the cookie, and returns a new magic link URL. The old cookie immediately stops working.

3. For a lightweight "logout" the frontend can: (a) call `POST /me/refresh-link` to invalidate the current code, then clear local state, or (b) simply clear the cookie client-side (the server doesn't track sessions — the cookie IS the session). Option (b) leaves the old code valid but removes the user's local auth.

> **Gap (documentation)**: The intended logout UX should be documented. Recommendation: the frontend clears the cookie client-side for a soft logout. `POST /me/refresh-link` serves as a "secure logout" that invalidates the code server-side.

*(spec/domains/auth.md, Magic Link Auth and Link Refresh)*

---

### BQ-12: Login Code Format (Q-039)

**Answer:**

1. Two formats depending on lifecycle:
   - **Initial codes (from invites)**: ULID format — 26-character alphanumeric string (e.g., `01H5K3J...`).
   - **Refreshed/regenerated codes**: `secrets.token_urlsafe(32)` — 43-character URL-safe base64 string (A-Z, a-z, 0-9, `-`, `_`).

2. Initial: 26 characters (ULID). Refreshed: 43 characters.

3. Yes, they are case-sensitive. The database column is TEXT with no case normalization.

4. Initial invite codes ARE ULIDs (same format as entity IDs). After a refresh, the code switches to the 43-character URL-safe format. The login code column accommodates both formats (TEXT type, no fixed length constraint).

*(spec/domains/auth.md, Login Code Format)*

---

### BQ-13: Cookie Max-Age (Q-054)

**Answer:**

1. Confirmed: `Max-Age = 365 * 24 * 60 * 60` seconds (1 year). Cookie properties: `httpOnly`, `Secure` (HTTPS), `SameSite=Lax`.

2. No server-side session TTL. Login codes never expire. The cookie's `Max-Age` is the only expiry mechanism. Codes are permanent until explicitly refreshed by the user (`POST /me/refresh-link`) or regenerated by the GM (`POST /players/{id}/regenerate-token`).

*(spec/domains/auth.md, Magic Link Auth and No Login Code Expiry)*

---

## Visibility & Permissions

### BQ-14: Bond-Graph Filtered Entity Access (Q-042)

**Answer:**

1. For Game Object detail endpoints (`GET /characters/{id}`, `GET /groups/{id}`, `GET /locations/{id}`): **no bond-graph filtering**. Any authenticated user can view any Game Object's full detail. If the entity doesn't exist or is soft-deleted (and `include_deleted` is not set), the API returns 404. There is no 403 for entity access — 403 is reserved for role-based access (player hitting a GM-only endpoint).

2. Yes, this is consistent across characters, groups, and locations. All players have read-only access to all game objects.

3. For list endpoints, soft-deleted entities are omitted by default (use `?include_deleted=true` to include them). Entities are NOT filtered by bond-graph visibility — all non-deleted entities are returned.

**Important clarification**: Bond-graph visibility applies to the **feed/events layer** (Events, Story entries, Story visibility), NOT to entity access. Players can see all characters, groups, and locations. They cannot see all events about those entities.

*(spec/domains/auth.md, Permission Model — "Can read all public game state"; spec/architecture/api-conventions.md, Authorization Errors)*

---

### BQ-15: Other Character's Data in World Browser (Q-043)

**Answer:**

1. The API returns the same response shape for any character regardless of who is requesting. Full detail for PCs (meters, skills, magic stats, traits, bonds, session history), simplified view for NPCs (name, description, notes, attributes, bonds). There is no `detail_level: "simplified"` downgrade for distant PCs.

2. No — the `detail_level` field distinguishes PCs (`full`) from NPCs (`simplified`). It is NOT used for bond-distance-based access control.

3. Yes, the feed on a Game Object's detail page IS visibility-filtered per the requesting player's bond-graph proximity. A player viewing another character's page will see events filtered through the unified visibility model.

*(spec/domains/character-core.md, Sheet API; spec/domains/auth.md, Permission Model)*

---

### BQ-16: GM Self-Approval (Q-044)

**Answer:**

1. Yes, the GM can approve their own proposals. The spec explicitly states: "GM's character uses the same proposal workflow — the GM must explicitly approve their own proposals."

2. Yes, GM-submitted proposals appear in the GM queue (`GET /proposals?status=pending`) alongside player proposals. They can be filtered by `?origin=player` or `?character_id=`.

3. GM proposals are NOT auto-approved. The explicit approval step is required for audit trail consistency.

*(spec/domains/auth.md, GM Self-Play and GM Self-Play Proposals)*

---

### BQ-17: Story Visibility Overrides Shape (Q-045)

**Answer:**

1. `visibility_overrides` is a flat list of **player (user) IDs** — `list[string]`. Each entry is a user ULID.

2. It is a list of user IDs (strings), not a structured object. Example:
   ```json
   "visibility_overrides": ["01H5K3J...", "01H5K4M..."]
   ```

3. Overrides are added by the **GM only** via `PATCH /api/v1/stories/{id}`. Players cannot opt in. The GM grants specific players visibility regardless of bond-graph distance.

How it works: Stories have an optional `visibility_level` (overrides the default `familiar`) combined with `visibility_overrides` (player ID list). A story is visible to the union of (players within the visibility level via bond-graph) + (players explicitly listed in overrides).

*(spec/domains/game-objects.md, Stories/Arcs; spec/domains/feed.md, Story Visibility)*

---

### BQ-18: Duplicate Bond Uniqueness (Q-046)

**Answer:**

1. No. A character cannot have two active bonds to the same target. The system enforces at most one active bond per (source, target) pair.

2. Yes, the API rejects it. For player `new_bond` proposals, the calculator validates this on submission and returns 422 with a field-level error. For GM `create_bond` actions, the service layer validates and rejects as well.

3. 422 Unprocessable Entity with a validation error message.

Past bonds (`is_active = false`) don't count against the uniqueness constraint. A character can have multiple retired bonds to the same target in their history.

*(spec/domains/bonds.md, No Duplicate Active Bonds)*

---

## Data Shapes & Edge Cases

### BQ-19: Location Presence Tier Labels (Q-052)

**Answer:**

1. Yes, `common`, `familiar`, `known` are the only three tier keys. They are always present in the response, even if their arrays are empty.

2. Yes, the frontend should hardcode display labels based on these keys. Recommended mapping:
   - `common` (1-hop) → "Commonly present"
   - `familiar` (2-hop) → "Often present"
   - `known` (3-hop) → "Sometimes present"

3. The API does NOT include display labels. These are semantic tier names only.

Response shape:
```json
{
  "locations": {
    "common": [{"id": "...", "name": "..."}],
    "familiar": [{"id": "...", "name": "..."}],
    "known": [{"id": "...", "name": "..."}]
  }
}
```

*(spec/domains/character-core.md, Bond-distance locations; spec/domains/game-objects.md, Bond-Distance Presence)*

---

### BQ-20: 422 Without details.fields (Q-062)

**Answer:**

1. A 422 response lacks `details.fields` in two cases:
   - **Domain/business-logic validation**: When a `BusinessRuleViolation` is raised without field-specific context (e.g., "character doesn't belong to user", "action type invalid for current state"). These have `details: null` or omit `details` entirely.
   - **Pydantic schema validation**: FastAPI's built-in request validation produces a different 422 shape — `{"detail": [...]}` (note: `detail` not `error`) with a list of validation error objects. This does NOT follow the `{error: {code, message, details}}` envelope.

2. Yes, the `message` field is always human-readable for domain validation errors (the `{error: {...}}` envelope). For Pydantic validation errors (the `{"detail": [...]}` shape), the individual error entries contain human-readable `msg` fields.

> **Gap (documentation)**: The two 422 shapes (domain validation envelope vs. Pydantic's default shape) should be documented explicitly so the frontend can handle both.

*(spec/architecture/api-conventions.md, Error Format)*

---

### BQ-21: 201 Response Body Completeness (Q-056)

**Answer:**

1. Yes, all POST endpoints that return 201 include the full created entity in the response body — same shape as the corresponding GET. This is an explicit architectural decision: "Return the full created resource with `201 Created`. Saves a follow-up GET. The client immediately has the complete object with server-generated fields (id, timestamps, defaults)."

2. No. There are no 201 responses that return partial entities or just an ID.

*(spec/architecture/api-conventions.md, Successful Responses — Create)*

---

## Decisions to Verify

### BV-01: Clock Progression on work_on_project Approval (Q-001, Q-002)

**Answer: Partially incorrect.**

Approving `work_on_project` does NOT auto-increment any clock. It adds a narrative entry to the targeted Story/Arc and deducts 1 FT. That's it.

Clock advancement is always a separate, manual GM step via `modify_clock` GM actions. The UI pre-fills a suggested +1 tick per clock as a UX convenience during Active sessions, but the system does not auto-advance clocks.

`work_on_project` targets a **Story**, not a clock. Stories and clocks are independent concepts — a Group may have both a project Story and an associated clock, but `work_on_project` only touches the Story.

*(spec/domains/actions.md, Downtime Effect Calculations; spec/domains/downtime.md, Group Clock Adjustments)*

---

### BV-02: Clock Resolution Auto-Generation (Q-002, Q-003)

**Answer: Mostly correct, with one clarification.**

- Correct: When `progress >= segments`, the system auto-generates a `resolve_clock` system proposal in `pending` status.
- Correct: After resolution (approval), the clock stays visible (not soft-deleted).
- **Clarification**: There is no stored `is_completed` flag. Completion is **computed on read** from `progress >= segments`. The frontend should derive completion status from this comparison, not from a stored boolean.
- Idempotency: Only one `resolve_clock` proposal is generated per clock, ever. If a pending or approved `resolve_clock` already exists for that clock, no new one is generated.

*(spec/domains/game-objects.md, Clock Completion — Computed + Auto-Propose)*

---

### BV-03: No-Cascade Soft-Delete (Q-005, Q-006)

**Answer: Confirmed.**

- Soft-deleting a Game Object does NOT cascade. Associated records (Clocks, Story entries, etc.) remain accessible independently.
- Bonds to deleted entities still exist but are **dead ends** during bond-graph traversal — deleted entities are excluded from visibility, presence, and feed computations.
- Pending proposals stay pending for the GM to resolve.
- `GET /characters/{deleted_id}` returns the full character with `is_deleted: true` — NOT 404. Deleted entities are hidden from list endpoints by default but accessible via direct lookup. Use `?include_deleted=true` on list endpoints to include them.

*(spec/domains/game-objects.md, No Cascade Soft-Delete and Soft Delete Excludes from Bond Graph)*

---

### BV-04: Group Membership Derived from Active Bonds Only (Q-009)

**Answer: Confirmed.**

Group membership is server-computed from active bonds: "all bonds where target = this Group and source_type = character." This is computed on read — no stored membership table.

When a Character→Group bond retires to Past (`is_active = false`), that character disappears from the Group's computed members list.

*(spec/domains/game-objects.md, Group Bond Types — Relations, Holdings, and Members)*

---

### BV-05: Proposal Optimistic Locking (Q-015, Q-016)

**Answer: Does NOT exist.**

See BQ-10. There is no `updated_at`-based concurrency control on proposal PATCH. The current model relies on re-validation at approval time (409 + `force: true` retry), not on edit-level locking.

> **Gap (code change required)**: Same as BQ-10. This becomes a CR if the frontend team requires edit-level concurrency control.

---

### BV-06: Narrative Field Optionality (Q-018)

**Answer: Partially correct.**

The `narrative` field is NOT universally optional. The rules are:

| Action Category | Narrative on Submission |
|----------------|----------------------|
| **Session actions** (`use_skill`, `use_magic`, `charge_magic`) | **Optional** (nullable). Players can PATCH narrative onto pending proposals later. |
| **Downtime actions** (`regain_gnosis`, `work_on_project`, `rest`, `new_trait`, `new_bond`) | **Required**. |
| **Direct actions** (`recharge_trait`, `maintain_bond`) | **Required**. |
| **System proposals** (`resolve_clock`, `resolve_trauma`) | Auto-generated stub (system-provided). |

This applies to both `POST /proposals` and `POST /proposals/calculate`.

*(spec/domains/actions.md, Narrative Requirements)*

---

### BV-07: Dual-Use Bond/Trait as Modifier + Sacrifice (Q-020)

**Answer: Yes, dual-use is allowed.**

A player CAN use the same bond or trait as both a modifier (+1d) and a sacrifice (destroyed, 10 Gnosis equivalent) in a single magic proposal. Both costs apply: the trait/bond provides +1d to the dice pool AND is destroyed for 10 Gnosis equivalent of sacrifice dice. The modifier charge cost is moot since the entity is being destroyed anyway.

This is intentional — it represents a character drawing every last bit of power from a relationship or identity before letting it go. The spec describes sacrifice and use as "two distinct options on the same action," and combining them on the same entity is the dramatic extreme.

---

### BV-08: FT Sacrifice Rate at Magic Stat 0 (Q-021)

**Answer: Confirmed.**

The formula is `1 FT = 3 + lowest_magic_stat` Gnosis equivalent. At lowest Magic Stat = 0: `1 FT = 3 Gnosis`. No floor, no special case. This is intentional.

*(spec/domains/magic-system.md, Sacrifice table)*

---

### BV-09: Trauma Threshold and Stress Max (Q-022)

**Answer: Confirmed with clarification.**

- No backend-enforced cap on trauma count beyond the physical limit of bond slots.
- PCs have 8 bond slots. All 8 can become Trauma.
- `effective_stress_max = 9 - count(trauma_bonds)`. With 8 Traumas: effective max = **1** (not 0).
- If all 8 bonds are already Trauma and Stress hits max again, "the GM handles narratively (no mechanical rule)." The system does not auto-generate another `resolve_trauma` in this edge case because there are no non-trauma bonds left to convert.
- The frontend should render whatever the backend returns. The "retirement" of a character at extreme trauma levels is a narrative/GM decision.

*(spec/domains/character-core.md, Stress Range and Consequences and No Trauma Cap)*

---

### BV-10: Session Mechanics (Q-025, Q-026, Q-027, Q-028)

**Answer:**

**Re-join after leaving**: Confirmed. Removing a participant is a hard delete of the participant record. A subsequent POST for the same character succeeds. Distribution runs again on re-add. The spec explicitly notes: "No double-distribution protection. This is rare — the GM corrects any overshoot via direct actions."

**0 participants**: **Incorrect assumption.** The GM CAN start a session with 0 participants. The start_session function does not validate participant count — it iterates whatever participants exist (which can be an empty list). No FT or Plot is distributed, and the session transitions to Active normally. The frontend may want to add a confirmation dialog as a UX safeguard, but the API will not reject it.

**`time_now`**: Confirmed. `time_now` must be >= the most recent ended session's `time_now`. Equal values are allowed (producing 0 FT delta). The first session has no constraint (any non-negative value). Time Now is non-negative and is not strictly ordered across all sessions — only the monotonicity rule against the last ended session applies.

**`additional_contribution`**: Confirmed. Grants +2 Plot (vs +1 base). Per-participant boolean, defaults to `false`. Can be PATCHed while the session is Draft. **Locks on Start** — cannot be changed after FT/Plot distribution. Late-joining participants have their `additional_contribution` locked at the moment they join (distribution runs immediately on late-join). The "meaning" of Additional Contribution (MVP, notable RP, etc.) is a social/GM convention, not enforced by the backend.

*(spec/domains/downtime.md, Session Lifecycle, Session Participants, Time Now Monotonicity, and Additional Contribution Flag)*

---

## Gap Summary

| ID | Type | Description |
|----|------|-------------|
| BQ-07 | Documentation | "Priority-sorted queue with pinned system proposals" is a frontend concern; API returns ULID order only |
| BQ-10 / BV-05 | Deferred | Proposal optimistic locking — deferred. Existing re-validation-on-approval covers the most dangerous race. |
| BQ-11 | **Code change required** | Add `POST /auth/logout` endpoint that clears the httpOnly cookie |
| BQ-20 | **Code change required** | Normalize Pydantic 422 errors into standard `{error: {code, message, details}}` envelope |
| BV-01 | Documentation | `work_on_project` does not auto-increment clocks — frontend assumption was incorrect |
| BV-07 | Resolved | Dual-use allowed — same bond/trait can be both modifier and sacrifice. No code change needed. |
| BV-10 | **Code change required** | Add validation: reject session start with 0 participants |
