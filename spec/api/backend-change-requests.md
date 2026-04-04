# Backend Change Requests

> This document tracks requested changes to the Wizards Engine backend API.
> Send this file to the backend repo's Claude Code agent for implementation.

---

## How to Use

When a frontend spec requires a backend API change (new endpoint, modified response shape, new field, etc.), add an entry below. Each entry should be self-contained enough for a backend developer (or agent) to implement without additional context.

## Format

```markdown
### CR-NNN: Short Title

- **Status**: Proposed | Accepted | Implemented | Rejected
- **Priority**: Blocking | High | Medium
- **Spec reference**: Which frontend spec discovered this need
- **Description**: What change is needed and why
- **Proposed contract**: Request/response shapes if applicable
- **Notes**: Any constraints, alternatives considered, etc.
```

---

## Summary

| CR | Title | Priority | Status |
|----|-------|----------|--------|
| CR-001 | Proposal dry-run / pre-calculate endpoint | Blocking | **Implemented** (2026-03-27) |
| CR-002 | Document `calculated_effect` shape per action type | Blocking | **Resolved** (documented 2026-03-26) |
| CR-003 | Document `MagicSacrifice` type | Blocking | **Resolved** (documented 2026-03-26) |
| CR-004 | Enumerate `gm_overrides` flags per action type | Blocking | **Resolved** (documented 2026-03-26) |
| CR-005 | Document `resolve_clock` / `resolve_trauma` approval schemas | Blocking | **Resolved** (documented 2026-03-26) |
| CR-006 | Document `POST /me/character` full body shape | Blocking | **Resolved** (documented 2026-03-26) |
| CR-007 | Add `?status=` filter to `GET /sessions` | High | **Implemented** (commit 14994ee, 2026-03-26) |
| CR-008 | Add character name to `SessionResponse.participants[]` | High | **Implemented** (commit 14994ee, 2026-03-26) |
| CR-009 | Paginate story entries or add `GET /stories/{id}/entries` | High | **Implemented** (2026-03-27) |
| CR-010 | Clarify bidirectional bond representation | High | **Resolved** (documented 2026-03-26) |
| CR-011 | Add domain-specific error codes to catalog | Medium | **Resolved** (documented 2026-03-26) |
| CR-012 | Define `InviteResponse` shape for `GET /game/invites` | Medium | **Resolved** (documented 2026-03-26) |
| CR-013 | Bond-distance field on entity detail responses | High | **Implemented** (2026-04-02) |
| CR-014 | Proposal `revision_count` field | Low | **Implemented** (2026-04-02) |

---

## Blocking Change Requests

### CR-001: Proposal dry-run / pre-calculate endpoint

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/domains/proposals.md` (Known Gaps), `spec/implementation/phase2-proposals.md` Story 2.1.9
- **Description**: The Proposal Wizard Step 3 needs to display the server-computed `calculated_effect` (dice pool, costs, consequences) before the player commits to submitting. Currently, the only way to get `calculated_effect` is to `POST /proposals` which creates a real pending proposal. This forces awkward Back-button cleanup (must DELETE the just-created proposal) and creates orphaned proposals if the user abandons the wizard.
- **Proposed contract**:
  ```
  POST /proposals/calculate
  Auth: Any
  Body: Same as POST /proposals
  Response: { calculated_effect: CalculatedEffect }
  ```
  Returns the computed effect without persisting anything. No side effects.
- **Notes**: If a dry-run endpoint is not feasible, the alternative is: `POST /proposals` creates a `draft` status proposal that can be confirmed or abandoned. Either approach works for the frontend, but the dry-run endpoint is simpler.

### CR-002: Document `calculated_effect` shape per action type

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/api/response-shapes.md` (typed as `Record<string, unknown>`), `spec/domains/proposals.md`
- **Description**: `ProposalResponse.calculated_effect` is the most prominently displayed data in both the Proposal Wizard Step 3 and the GM Queue. The frontend cannot build typed components for this without knowing the shape. Currently typed as `Record<string, unknown>`.
- **Proposed contract**: Document the TypeScript shape for each action type. At minimum needed per action type:
  ```typescript
  // use_skill
  { dice_pool: number, modifier_sources: Array<{source: string, bonus: number}>, plot_successes: number, costs: { trait_charges?: Record<string, number>, free_time?: number } }

  // use_magic / charge_magic
  { dice_pool: number, gnosis_equivalent_total: number, sacrifice_breakdown: Array<{type: string, amount: number, gnosis_equiv: number}>, costs: { gnosis?: number, stress?: number, free_time?: number, retired_bonds?: string[], retired_traits?: string[] } }

  // downtime actions (regain_gnosis, rest, work_on_project, new_trait, new_bond)
  { dice_pool?: number, costs: { free_time: 1 }, effect_summary: string }
  ```
- **Notes**: Even approximate shapes are better than `Record<string, unknown>`. The frontend can handle minor variations, but needs the basic structure to build typed renderers.

### CR-003: Document `MagicSacrifice` type

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/domains/proposals.md` (use_magic selections), `spec/domains/magic.md`
- **Description**: The `use_magic` and `charge_magic` proposal selections include `sacrifices: MagicSacrifice[]`. The element type is never defined. The Sacrifice Builder cannot be implemented without knowing the exact discriminated union shape.
- **Proposed contract**:
  ```typescript
  type MagicSacrifice =
    | { type: 'gnosis'; amount: number }
    | { type: 'stress'; amount: number }
    | { type: 'free_time'; amount: number }
    | { type: 'bond'; bond_id: string }
    | { type: 'trait'; trait_id: string }
    | { type: 'other'; description: string }
  ```
- **Notes**: Confirm whether `other` type exists. Confirm the gnosis-equivalent conversion rates are: gnosis 1:1, stress 1:2, free_time uses formula `3 + lowest_magic_stat`, bond/trait flat 10 each.

### CR-004: Enumerate `gm_overrides` flags per action type

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/domains/proposals.md` (Known Gaps), `spec/ui/gm-views.md`
- **Description**: `ApproveProposalRequest.gm_overrides` shows `{ force?: boolean, bond_strained?: boolean, ... }` — the `...` hides the complete set. The GM approval form cannot render override checkboxes without knowing all available flags and which flags apply to which action types.
- **Proposed contract**: Provide a table:
  ```
  | Flag | Type | Applies To | Description |
  |------|------|------------|-------------|
  | force | boolean | all | Override all validation checks |
  | bond_strained | boolean | use_skill, use_magic | GM declares a bond was strained |
  | ... | ... | ... | ... |
  ```
- **Notes**: If overrides are free-form (`Record<string, unknown>`), document that instead and the frontend will render a generic key-value editor.

### CR-005: Document `resolve_clock` / `resolve_trauma` approval schemas

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/domains/proposals.md`, `spec/ui/gm-views.md`
- **Description**: System proposals (`resolve_clock`, `resolve_trauma`) appear in the GM queue and require the GM to provide specific input when approving. Neither the approval body shape for these system proposal types nor the required `selections` fields are documented.
- **Proposed contract**:
  ```typescript
  // resolve_trauma approval
  { trauma_bond_id: string }  // which existing bond becomes the trauma scar

  // resolve_clock approval
  { outcome_narrative: string }  // GM describes what happens when the clock completes
  ```
- **Notes**: Confirm whether these fields go in `gm_overrides`, `selections`, or a dedicated field on the approve request.

### CR-006: Document `POST /me/character` full body shape

- **Status**: Proposed
- **Priority**: Blocking
- **Spec reference**: `spec/api/contract.md`
- **Description**: The endpoint `POST /me/character` (GM creating their own character) shows `Body: { name, ... }` — the `...` is unexpanded. The GM character creation form cannot be built without knowing the full body shape.
- **Proposed contract**: Document all fields. Expected to include at minimum: `name`, `detail_level` (always `"full"`), and possibly initial skill/stat allocations.
- **Notes**: This may mirror `POST /characters` for NPC creation but with PC-specific fields.

---

## High Priority Change Requests

### CR-007: Add `?status=` filter to `GET /sessions`

- **Status**: Proposed
- **Priority**: High
- **Spec reference**: `spec/domains/sessions.md`, `spec/domains/proposals.md`
- **Description**: Multiple UI views need to know whether an active session exists (nav badges, proposal wizard session-action availability). Currently the only way is to fetch the full session list and scan for `status === 'active'`. A query filter would be cleaner.
- **Proposed contract**: `GET /sessions?status=active` returns only sessions matching the filter. Accepts `draft`, `active`, `ended`.
- **Notes**: Alternatively, include an `active_session_id` field in `GET /gm/dashboard` or `GET /me` response.

### CR-008: Add character name to `SessionResponse.participants[]`

- **Status**: Proposed
- **Priority**: High
- **Spec reference**: `spec/domains/sessions.md`, `spec/api/response-shapes.md`
- **Description**: `participants[].character_id` is present but no `character_name`. Every UI rendering a participant list must either enrich via character lookup or have the name inline. Inline is standard practice (bonds already include `target_name`).
- **Proposed contract**: Add `character_name: string` to each participant object.
- **Notes**: Also consider adding `display_name` (user display name) alongside `character_name`.

### CR-009: Paginate story entries or add `GET /stories/{id}/entries`

- **Status**: Proposed
- **Priority**: High
- **Spec reference**: `spec/domains/stories.md`, `spec/api/response-shapes.md`
- **Description**: `StoryDetailResponse.entries[]` is returned inline as an unpaginated array. Stories with many entries will make every `GET /stories/{id}` response heavy and slow.
- **Proposed contract**: Either (a) add `GET /stories/{id}/entries` as a paginated endpoint, or (b) cap the inline entries and add `has_more_entries: boolean` + `entries_cursor: string | null`.
- **Notes**: Option (a) is preferred as it follows the existing pattern for other sub-resources.

### CR-010: Clarify bidirectional bond representation

- **Status**: Proposed
- **Priority**: High
- **Spec reference**: `spec/domains/bonds.md` (Known Gaps)
- **Description**: When `bidirectional: true` on a bond, does `GET /characters/{id}` return the bond in both characters' `bonds[]` arrays (two separate instances with swapped source/target), or only from the source? This affects character sheet bond counts and deduplication logic.
- **Proposed contract**: Document the behavior. If two instances: confirm they share the same `id` or have different IDs.
- **Notes**: This also affects group membership computation and world browser bond display.

---

## Medium Priority Change Requests

### CR-011: Add domain-specific error codes to catalog

- **Status**: Proposed
- **Priority**: Medium
- **Spec reference**: `spec/architecture/api-client.md`, `spec/testing/strategy.md`
- **Description**: The documented error codes are generic. Missing domain-specific codes needed for precise user-facing messages. Examples: `no_active_session` (session action without active session), `bond_is_trauma` (trying to maintain a trauma bond), `already_at_max` (recharging already-full trait), specific 409 codes for session/invite conflicts.
- **Proposed contract**: A table per endpoint group listing all possible error codes with HTTP status and `details` shape.
- **Notes**: Even a "best effort" list is better than the current generic set. The frontend needs these to map errors to actionable user messages.

### CR-012: Define `InviteResponse` shape for `GET /game/invites`

- **Status**: Proposed
- **Priority**: Medium
- **Spec reference**: `spec/api/response-shapes.md`
- **Description**: `POST /game/invites` returns `{id, is_consumed, login_url}` but `InviteResponse` is never formally defined. The GM invites list page needs the full shape including `created_at` and any other metadata.
- **Proposed contract**:
  ```typescript
  interface InviteResponse {
    id: string
    is_consumed: boolean
    login_url: string
    created_at: string  // ISO 8601
    consumed_by?: string  // user_id if consumed
  }
  ```
- **Notes**: Confirm whether consumed invites show which user consumed them.
