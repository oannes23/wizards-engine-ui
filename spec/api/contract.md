# API Endpoint Contract

> Status: Deepened
> Last verified against backend Pydantic schemas: 2026-03-26

All paths are relative to `/api/v1/`. Auth column: `None` = no auth required, `Any` = any authenticated user, `GM` = GM role only, `Owner/GM` = resource owner or GM.

---

## Authentication & Onboarding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | None | Login with magic link code |
| `POST` | `/auth/logout` | None | Clear auth cookie (204 No Content) |
| `POST` | `/setup` | None | Bootstrap GM account (one-time) |
| `POST` | `/game/join` | None | Redeem invite: create player/viewer + character atomically |

### POST /auth/login

Request: `{ code: string }`

Response (user exists): `{ id, display_name, role, character_id }` + sets cookie. `role` can be `"gm"`, `"player"`, or `"viewer"`.

Response (invite code): `{}` (empty object — signals join flow)

Error: 404 if code not found

### POST /auth/logout

No request body. Returns 204 No Content. Clears the `login_code` httpOnly cookie. Does NOT invalidate the login code — the magic link remains usable. No authentication required.

### POST /setup

Request: `{ display_name: string }`

Response: `{ id, display_name, role, login_url }`

Error: 409 if GM already exists

### POST /game/join

Request: `{ code: string, character_name: string, display_name: string }`

For viewer invites, `character_name` is not required: `{ code: string, display_name: string }`

Response: UserResponse + sets cookie. Viewer response has `character_id: null`.

---

## Identity & Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me` | Any | Current user identity (includes `can_view_gm_content`, `can_take_gm_actions`) |
| `PATCH` | `/me` | Any | Update display name |
| `POST` | `/me/character` | GM | Create full (PC) character linked to GM |
| `POST` | `/me/refresh-link` | Any | Rotate own login code |

---

## Players & Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/players` | Any | List all users (GM sees login_url) |
| `POST` | `/players/{id}/regenerate-token` | GM | Rotate player's login code |
| `POST` | `/game/invites` | GM | Generate invite code (optional body: `{ role?: "player" \| "viewer" }`) |
| `GET` | `/game/invites` | GM/Viewer | List all invites (paginated, response includes `role` field) |
| `DELETE` | `/game/invites/{id}` | GM | Delete unconsumed invite (409 if consumed) |

---

## Characters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters` | GM | Create simplified (NPC) character |
| `GET` | `/characters` | Any | List characters (paginated, filterable) |
| `GET` | `/characters/summary` | Any | Compact PC overview |
| `GET` | `/characters/{id}` | Any | Character detail (full or simplified) |
| `PATCH` | `/characters/{id}` | Owner/GM | Update name, description, notes |
| `DELETE` | `/characters/{id}` | GM | Soft-delete |

Filters on GET /characters: `detail_level?`, `has_player?`, `include_deleted?`, `name?`, `sort_by?`, `sort_dir?`

### Player Direct Actions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters/{id}/find-time` | Owner/GM | 3 Plot → 1 FT |
| `POST` | `/characters/{id}/recharge-trait` | Owner/GM | Restore trait to 5 charges (1 FT) |
| `POST` | `/characters/{id}/maintain-bond` | Owner/GM | Restore bond to effective max charges (1 FT) |

Recharge trait body: `{ trait_instance_id, narrative }`

Maintain bond body: `{ bond_instance_id, narrative }`

### Magic Effects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters/{id}/effects/{effect_id}/use` | Owner/GM | Use charged effect (−1 charge) |
| `POST` | `/characters/{id}/effects/{effect_id}/retire` | Owner/GM | Retire effect |

---

## Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/sessions` | GM | Create draft session |
| `GET` | `/sessions` | Any | List sessions (paginated, filterable by status) |
| `GET` | `/sessions/{id}` | Any | Session detail with participants |
| `PATCH` | `/sessions/{id}` | GM | Update draft/active session (400 if ended) |
| `DELETE` | `/sessions/{id}` | GM | Hard-delete draft only (400 if active/ended) |
| `POST` | `/sessions/{id}/start` | GM | Draft → Active (409 if another active) |
| `POST` | `/sessions/{id}/end` | GM | Active → Ended (clamps Plot to 5) |
| `GET` | `/sessions/{id}/timeline` | Any | Session events (paginated, visibility-filtered) |
| `POST` | `/sessions/{id}/participants` | Owner/GM | Add participant |
| `DELETE` | `/sessions/{id}/participants/{character_id}` | Owner/GM | Remove participant |
| `PATCH` | `/sessions/{id}/participants/{character_id}` | Owner/GM | Update contribution (draft only) |

Create body: `{ time_now?, date?, summary?, notes? }`

Filters on GET /sessions: `status?` (`draft`, `active`, `ended`). Unknown values return empty list, not error.

Participant body: `{ character_id, additional_contribution? }`

---

## Proposals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/proposals` | Player | Submit proposal |
| `GET` | `/proposals` | Any | List proposals (paginated, filterable) |
| `GET` | `/proposals/{id}` | Any | Single proposal detail |
| `PATCH` | `/proposals/{id}` | Owner/GM | Update pending/rejected proposal |
| `DELETE` | `/proposals/{id}` | Owner/GM | Hard-delete pending/rejected only |
| `POST` | `/proposals/{id}/approve` | GM | Approve with optional overrides |
| `POST` | `/proposals/{id}/reject` | GM | Reject with optional note |
| `POST` | `/proposals/calculate` | Player | Dry-run: compute calculated_effect without persisting |

Filters on GET /proposals: `status?`, `character_id?`, `action_type?`

Submit body: `{ character_id, action_type, narrative?, selections? }`

Calculate body: Same as submit body. Returns `{ calculated_effect }` without creating a proposal. Safe to call repeatedly. 422 for validation errors.

Approve body: `{ narrative?, gm_overrides?, rider_event? }`

Reject body: `{ rejection_note? }`

### Selections by Action Type

| Action Type | Key Selection Fields |
|-------------|---------------------|
| `use_skill` | `skill`, `modifiers: {core_trait_id?, role_trait_id?, bond_id?}`, `plot_spend?` |
| `use_magic` | `magic_stat`, `intention`, `symbolism`, `sacrifices[]`, `modifiers` |
| `charge_magic` | `effect_id`, `intention`, `symbolism`, `sacrifices[]`, `modifiers` |
| `regain_gnosis` | `modifiers` |
| `rest` | `modifiers` |
| `work_on_project` | `story_id?`, `clock_id?`, `narrative` |
| `new_trait` | `slot_type`, `template_id?`, `proposed_name?`, `proposed_description?`, `retire_trait_id?` |
| `new_bond` | `target_type`, `target_id`, `name?`, `description?`, `retire_bond_id?` |

---

## Clocks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/clocks` | GM | Create clock |
| `POST` | `/groups/{id}/clocks` | GM | Create clock associated with group |
| `GET` | `/clocks` | Any | List clocks (paginated, filterable) |
| `GET` | `/clocks/{id}` | Any | Clock detail |
| `PATCH` | `/clocks/{id}` | GM | Update name, notes, segments |
| `DELETE` | `/clocks/{id}` | GM | Soft-delete |

Filters: `associated_type?`, `associated_id?`, `include_deleted?`

---

## Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/groups` | GM | Create group |
| `GET` | `/groups` | Any | List groups (paginated, filterable) |
| `GET` | `/groups/{id}` | Any | Group detail (traits, bonds, computed members) |
| `PATCH` | `/groups/{id}` | GM | Update name, description, notes |
| `DELETE` | `/groups/{id}` | GM | Soft-delete |

---

## Locations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/locations` | GM | Create location |
| `GET` | `/locations` | Any | List locations (paginated, filterable) |
| `GET` | `/locations/{id}` | Any | Location detail (traits, bonds, presence tiers) |
| `PATCH` | `/locations/{id}` | GM | Update name, description, notes |
| `DELETE` | `/locations/{id}` | GM | Soft-delete |

---

## Stories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/stories` | GM | Create story |
| `GET` | `/stories` | Any | List stories (paginated, visibility-filtered) |
| `GET` | `/stories/{id}` | Any | Story detail (owners, entries, visibility-filtered) |
| `PATCH` | `/stories/{id}` | GM | Update name, summary, status, tags, visibility |
| `DELETE` | `/stories/{id}` | GM | Soft-delete |
| `POST` | `/stories/{id}/owners` | GM | Add owner `{ type, id }` |
| `DELETE` | `/stories/{id}/owners/{type}/{id}` | GM | Remove owner |
| `POST` | `/stories/{id}/entries` | Any | Add narrative entry |
| `PATCH` | `/stories/{id}/entries/{entry_id}` | Owner/GM | Edit entry text |
| `DELETE` | `/stories/{id}/entries/{entry_id}` | Owner/GM | Soft-delete entry |
| `GET` | `/stories/{id}/entries` | Any | Paginated entries (cursor-based, oldest-first, default limit 50, max 100) |

---

## Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/events` | Any | List events (paginated, visibility-filtered) |
| `GET` | `/events/{id}` | Any | Single event detail |
| `PATCH` | `/events/{id}/visibility` | GM | Override visibility level |

Filters: `type?`, `target_type?`, `target_id?`, `session_id?`, `actor_type?`, `proposal_id?`, `since?`, `until?`, `sort_by?`, `sort_dir?`

---

## Feeds

All feed endpoints share filters: `type?`, `target_type?`, `target_id?`, `actor_type?`, `session_id?`, `since?`, `until?`, `after?`, `limit?`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me/feed` | Any | Personal feed |
| `GET` | `/me/feed/starred` | Any | Starred objects feed |
| `GET` | `/me/feed/silent` | GM | Silent events only (audit log) |
| `GET` | `/characters/{id}/feed` | Any | Character feed |
| `GET` | `/groups/{id}/feed` | Any | Group feed |
| `GET` | `/locations/{id}/feed` | Any | Location feed |

---

## Starred Objects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me/starred` | Any | List starred objects |
| `POST` | `/me/starred` | Any | Star object `{ type, id }` (idempotent) |
| `DELETE` | `/me/starred/{type}/{id}` | Any | Unstar (idempotent) |

---

## Trait Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/trait-templates` | GM | Create template |
| `GET` | `/trait-templates` | Any | List templates (paginated) |
| `GET` | `/trait-templates/{id}` | Any | Template detail |
| `PATCH` | `/trait-templates/{id}` | GM | Update name, description (type immutable) |
| `DELETE` | `/trait-templates/{id}` | GM | Soft-delete |

---

## GM Actions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/gm/actions` | GM | Execute single GM action |
| `POST` | `/gm/actions/batch` | GM | Execute 1–50 actions atomically |
| `GET` | `/gm/dashboard` | GM | Aggregated state |
| `GET` | `/gm/queue-summary` | GM | Queue view cards |

### GM Action Types (14)

`modify_character`, `modify_group`, `modify_location`, `modify_clock`, `create_bond`, `modify_bond`, `retire_bond`, `create_trait`, `modify_trait`, `retire_trait`, `create_effect`, `modify_effect`, `retire_effect`, `award_xp`

Request shape:
```json
{
  "action_type": "modify_character",
  "targets": [{"target_type": "character", "target_id": "...", "is_primary": true}],
  "changes": {"stress": {"op": "delta", "value": 2}},
  "narrative": "optional",
  "visibility": "public"
}
```

Change operations: `delta` (relative offset) and `set` (absolute value) only. See [response-shapes.md](response-shapes.md) GM Action Request Shapes for valid fields per action type.

### Approve Proposal Request

```typescript
interface ApproveProposalRequest {
  narrative?: string | null
  gm_overrides?: Record<string, unknown> | null  // see response-shapes.md GM Override Shapes
  rider_event?: RiderEventPayload | null          // see response-shapes.md Rider Event Shape
}
```

For `resolve_trauma` approval, `gm_overrides` is **required** with `trauma_bond_id`, `trauma_name`, `trauma_description`.
For `resolve_clock` approval, only `narrative` and optional `rider_event` are needed.

### POST /me/character

Same body as `POST /characters`: `{ name: string, description?: string, notes?: string, attributes?: Record<string, unknown> }`. Creates a **full** (PC) character with all meters/skills/magic_stats defaulting to 0, and links it to the GM's user account. Response is `CharacterResponse` (not detail — no bonds/traits/effects populated).
