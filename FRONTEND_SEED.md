# Wizards Engine Frontend — Seed Document

This document is the comprehensive reference for building a React + Next.js frontend for the **Wizards Engine** API server. It contains everything needed to understand the backend, its API, game mechanics, and the current UI that this new frontend will replace.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Domain Concepts](#2-core-domain-concepts)
3. [Game Mechanics Reference](#3-game-mechanics-reference)
4. [API Server Reference](#4-api-server-reference)
5. [Complete Endpoint Reference](#5-complete-endpoint-reference)
6. [Data Model & Response Shapes](#6-data-model--response-shapes)
7. [Current UI Reference](#7-current-ui-reference)
8. [Architecture Notes for Next.js](#8-architecture-notes-for-nextjs)

---

## 1. Project Overview

### What This Is

Wizards Engine is a backend state tracker for a **single narrative-heavy, low-crunch tabletop RPG campaign**. It tracks character sheets, game world state, and provides a proposal workflow for player actions. It is designed for a small fixed group: **4-6 players + 1 GM (Game Master)**.

### Two User Roles

The system has exactly two roles with distinct experiences:

- **Player**: Owns one character. Views their character sheet, submits action proposals for GM approval, explores the game world, reads event feeds. Limited visibility (bond-graph based).
- **GM (Game Master)**: Full visibility and control. Reviews/approves/rejects proposals, makes direct state changes, manages sessions, invites players, creates world objects. The GM may optionally also own a character.

### Core Design Principles

- **Mutable state + append-only event log**: Game state is directly mutable; an event log provides audit/history.
- **API-first REST**: All state changes go through the API. The UI is a consumer, not a source of truth.
- **Proposal workflow**: Players request changes → GM reviews → approve/reject → effects are applied automatically.
- **Deferred narrative resolution**: State is intentionally left ambiguous until narratively observed (e.g., character presence at locations is derived from bonds, not pinned positions).
- **Bond graph drives visibility**: Who can see what is computed by traversing relationships between game objects.

### Key Workflow: Proposals

The central mechanic of the UI:

1. **Player submits** a proposal (action type + narrative + selections)
2. **System validates** and computes a `calculated_effect` (dice pool, resource costs, etc.)
3. **GM reviews** the proposal in a queue, sees calculated effects
4. **GM approves** (optionally with overrides or narrative) or **rejects** (with a note)
5. **On approval**: System auto-applies all consequences (resource deductions, event creation)
6. **On rejection**: Player can revise and resubmit

---

## 2. Core Domain Concepts

### Game Objects (The World)

Three entity types exist "in the fiction" — they form the bond graph:

| Type | Description | Detail Levels |
|------|-------------|---------------|
| **Character** | A being (PC or NPC). PCs have full mechanical depth; NPCs are simplified. | `full` (PC) / `simplified` (NPC) |
| **Group** | An organization, crew, family, guild. Has a power tier and traits. | — |
| **Location** | A place. Supports nesting via parent/child hierarchy. Has feature traits. | — |

### System Entities (Tracking Tools)

Not part of the bond graph, but essential to gameplay:

| Type | Description |
|------|-------------|
| **Session** | A play session record. Lifecycle: Draft → Active → Ended. |
| **Clock** | A Blades-in-the-Dark-style progress tracker (N segments). Can be associated with a Game Object. |
| **Story** | A narrative thread/arc with entries, owners, and sub-arcs. |
| **Proposal** | A player-submitted or system-generated request to change state. |
| **Event** | An immutable log entry recording a state change. |

### Users & Authentication

- **User**: Has display_name, role (gm/player), login_code, optional linked character_id
- **Magic Links**: Login via `/login/<code>` URLs. No passwords.
- **Invites**: GM generates invite codes; players redeem them to join (creates User + Character atomically)
- **Cookie auth**: `login_code` httpOnly cookie set on login

### Bonds — The Relationship Primitive

Every relationship in the system is a **Bond**. Bonds connect any Game Object to any other. The type of bond is auto-inferred from the source/target pairing:

| Bond Type | Source → Target | Mechanical? | Slots |
|-----------|----------------|-------------|-------|
| `pc_bond` | Full Character → any | Yes (charges, degradation) | 8 max |
| `npc_bond` | Simplified Character → any | No (descriptive only) | 7 max |
| `group_relation` | Group → Group | No | 7 max |
| `group_holding` | Group → Location | No | Unlimited |
| `location_bond` | Location → any | No | Unlimited |

PC bonds provide **+1d bonus** on proposals (no charge cost), have **charges** (0-5), and can degrade. Group **membership** is derived from bonds: any Character with a bond targeting a Group is a member.

### Bond Graph Visibility

The bond graph determines what players can see:

- **1-hop**: Direct bond (bonded visibility / "commonly present")
- **2-hop**: Bond-of-bond (familiar visibility / "often present")
- **3-hop**: Three degrees away (public visibility / "sometimes present")

Traversal rule: After a non-Character node, the next hop must go through a Character (PC or NPC as intermediary).

### Traits

Traits exist on Characters (Core/Role), Groups, and Locations:

| Trait Type | On | Slots | Charges? | Notes |
|------------|-----|-------|----------|-------|
| `core_trait` | Full Character | 2 | Yes (0-5) | +1d when invoked, costs 1 charge |
| `role_trait` | Full Character | 3 | Yes (0-5) | +1d when invoked, costs 1 charge |
| `group_trait` | Group | 10 | No | Descriptive only |
| `feature_trait` | Location | 5 | No | Descriptive only |

Character traits link to **Trait Templates** (a GM-managed catalog). Traits can be recharged (direct player action, 1 FT) or retired to "Past" state.

### Modifier Stacking Rule

On any single proposal, a player can select at most: **1 Core Trait (+1d) + 1 Role Trait (+1d) + 1 Bond (+1d) = max +3d** on top of base dice.

---

## 3. Game Mechanics Reference

### Character Meters

Full (PC) characters have four resource meters:

| Meter | Range | Color | Description |
|-------|-------|-------|-------------|
| **Stress** | 0–9 (effective max = 9 - trauma count) | `#c0392b` (red) | Accumulated harm. Hitting max triggers Trauma. |
| **Free Time** | 0–20 | `#27ae60` (green) | Spent on downtime actions (1 FT each). Gained at session start. |
| **Plot** | 0–5 (can exceed temporarily) | `#d4a017` (amber) | Each Plot spent = one guaranteed success (a 6). Clamped to 5 at session end. |
| **Gnosis** | 0–23 | `#805ad5` (purple) | Magical resource. Spent as sacrifice in magic actions. |

### Skills (8 canonical)

Each skill has a level 0-3 that determines the base dice pool:

`awareness`, `composure`, `influence`, `finesse`, `speed`, `power`, `knowledge`, `technology`

### Magic Stats (5 canonical)

Each has a level (0-5) and XP (0-4, resets on level-up):

`being`, `wyrding`, `summoning`, `enchanting`, `dreaming`

### Magic Effects

Created by GM on approval of magic actions. Three types:
- **Instant**: One-time, not tracked on sheet
- **Charged**: Has charges_current/charges_max, player can use (costs 1 charge) or retire
- **Permanent**: Always active, no charges, power_level 1-5

Max 9 active effects per character (charged + permanent; instants don't count).

### Trauma Mechanic

When Stress hits effective max (9 - trauma_count):
1. System auto-generates a `resolve_trauma` proposal
2. GM fills in which bond becomes the trauma
3. On approval: chosen bond retires to Past, new trauma bond created (`is_trauma = true`), Stress resets to 0
4. Effective stress max permanently reduced by 1

### Bond Charges & Degradation

- PC bonds start with charges = 5
- GM can strain bonds (charges - 1) as consequence of proposal use
- At 0 charges: charges reset to effective max, degradation count + 1
- Effective max = 5 - degradation_count
- Restored via "Maintain Bond" direct action (1 FT, restores to effective max)

### 12 Action Types

**Session Actions** (during play):
| Type | Description |
|------|-------------|
| `use_skill` | Roll skill dice + modifiers + plot spend |
| `use_magic` | Sacrifice resources for magic dice (tiered formula) |
| `charge_magic` | Sacrifice resources to recharge/boost a magic effect |

**Downtime Actions** (all cost 1 FT):
| Type | Description |
|------|-------------|
| `regain_gnosis` | Restore gnosis (3 + lowest magic stat + modifiers) |
| `work_on_project` | Progress a story/project clock |
| `rest` | Heal stress (3 base + modifiers) |
| `new_trait` | Create/replace a trait |
| `new_bond` | Create/replace a bond |

**System Proposals** (auto-generated):
| Type | Description |
|------|-------------|
| `resolve_clock` | Clock completed, GM fills in outcome |
| `resolve_trauma` | Stress hit max, GM fills in trauma details |

**Player Direct Actions** (no GM approval needed):
| Type | Endpoint | Description |
|------|----------|-------------|
| `find_time` | `POST /characters/{id}/find-time` | 3 Plot → 1 FT |
| `recharge_trait` | `POST /characters/{id}/recharge-trait` | Restore trait to 5 charges (1 FT) |
| `maintain_bond` | `POST /characters/{id}/maintain-bond` | Restore bond to effective max charges (1 FT) |
| `use_effect` | `POST /characters/{id}/effects/{id}/use` | Decrement magic effect charge |
| `retire_effect` | `POST /characters/{id}/effects/{id}/retire` | Retire a magic effect |

### Magic Sacrifice System

Players can sacrifice multiple resource types in one magic action:
- **Gnosis**: 1 Gnosis = 1 Gnosis equivalent
- **Stress**: 1 Stress = 2 Gnosis equivalent
- **Free Time**: 1 FT = 3 + lowest Magic Stat level Gnosis equivalent
- **Bond sacrifice**: 10 Gnosis equivalent (bond retires to Past)
- **Trait sacrifice**: 10 Gnosis equivalent (trait retires to Past)
- **Other**: Freeform text, GM assigns value

**Tiered dice conversion**: N dice costs N*(N+1)/2 total Gnosis equivalent (diminishing returns).

### Session Lifecycle

1. **Draft**: GM creates session, sets `time_now`, adds participants
2. **Start** (Draft → Active): FT distributed based on time_now delta, Plot awarded (+1 base, +2 if additional_contribution)
3. **End** (Active → Ended): Plot clamped to 5 per participant, session becomes read-only

Only one Active session at a time. `time_now` is an abstract integer representing campaign time passage.

---

## 4. API Server Reference

### Base URL

All API endpoints are under: **`/api/v1/`**

The server also serves the current SPA at `/` and static assets at `/static/`.

### Authentication

- **Cookie-based**: `login_code` httpOnly cookie (Secure, SameSite=Lax, Max-Age=1 year)
- **Login flow**: `POST /api/v1/auth/login` with `{code}` → sets cookie → returns user info
- **Join flow**: `POST /api/v1/game/join` with `{code, character_name, display_name}` → creates user+character → sets cookie
- **Setup flow**: `POST /api/v1/setup` with `{display_name}` → creates GM account (one-time only)
- **401**: Missing, invalid, or inactive login_code
- **403**: Insufficient role (player trying GM-only action)

For the new frontend, CORS is configured via `CORS_ORIGINS` environment variable.

### Error Response Format

All errors follow this envelope:

```json
{
  "error": {
    "code": "error_code_string",
    "message": "Human-readable description",
    "details": {
      "fields": {
        "field_name": "Field-specific error message"
      }
    }
  }
}
```

Common error codes: `cookie_missing`, `cookie_invalid`, `account_inactive`, `insufficient_role`, `not_found`, `already_setup`, `validation_error`, `insufficient_resources`, `proposal_not_pending`.

### Pagination

ULID cursor-based pagination on all list endpoints:

- `?after=<ulid>` — cursor (exclusive, return items after this ID)
- `?limit=N` — page size (default 50, max 100)

Response shape:
```json
{
  "items": [...],
  "next_cursor": "01HXYZ...",  // null if no more
  "has_more": true
}
```

### Soft Delete Pattern

Most entities use soft delete (`is_deleted` flag). List endpoints exclude deleted by default; include with `?include_deleted=true`. Direct GET by ID always returns (even if deleted).

---

## 5. Complete Endpoint Reference

### Authentication & Onboarding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | None | Login with magic link code. Returns user info or invite signal. Sets cookie. |
| `POST` | `/setup` | None | Bootstrap GM account (one-time). Returns `{id, display_name, role, login_url}`. 409 if already set up. |
| `POST` | `/game/join` | None | Redeem invite: create player + character atomically. Body: `{code, character_name, display_name}`. Sets cookie. |

**POST /auth/login** request: `{code: string}`
- If code matches an active user: returns `{id, display_name, role, character_id}`, sets cookie
- If code matches an unconsumed invite: returns `{}` (empty object, signals frontend to show join form)
- Otherwise: 404

### Identity & Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me` | Any | Current user identity: `{id, display_name, role, character_id}` |
| `PATCH` | `/me` | Any | Update display name. Body: `{display_name: string}` (1-50 chars) |
| `POST` | `/me/character` | GM | Create full character linked to GM. Body: `{name, ...}` |
| `POST` | `/me/refresh-link` | Any | Rotate own login code. Returns `{login_url}` |

### Players & Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/players` | Any | List all users. GM sees `login_url` per user; players don't. |
| `POST` | `/players/{id}/regenerate-token` | GM | Rotate player's login code. Returns `{login_url}` |
| `POST` | `/game/invites` | GM | Generate invite code. Returns `{id, is_consumed, login_url}` |
| `GET` | `/game/invites` | GM | List all invites (consumed + unconsumed). Paginated. |
| `DELETE` | `/game/invites/{id}` | GM | Delete unconsumed invite. 409 if consumed. |

### Characters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters` | GM | Create simplified (NPC) character. Body: `{name, description?, notes?, attributes?}` |
| `GET` | `/characters` | Any | List characters. Filters: `detail_level?`, `has_player?`, `include_deleted?`, `name?`, `sort_by?`, `sort_dir?`. Paginated. |
| `GET` | `/characters/summary` | Any | Compact PC overview: `{items: [{id, name, stress, free_time, plot, gnosis}]}`. Active full characters only. |
| `GET` | `/characters/{id}` | Any | Character detail. Full PCs include: meters, skills, magic_stats, traits, bonds, effects, locations, session_ids. Simplified: base fields + bonds + locations. |
| `PATCH` | `/characters/{id}` | Owner/GM | Update name, description, notes. Body: `{name?, description?, notes?}` |
| `DELETE` | `/characters/{id}` | GM | Soft-delete |

**CharacterDetailResponse** (full):
```json
{
  "id": "...", "name": "...", "detail_level": "full",
  "description": "...", "notes": "...", "attributes": {},
  "stress": 3, "free_time": 8, "plot": 2, "gnosis": 15,
  "effective_stress_max": 8,
  "skills": {"awareness": 2, "composure": 1, ...},
  "magic_stats": {"being": {"level": 1, "xp": 3}, ...},
  "traits": [{"id": "...", "slot_type": "core_trait", "name": "...", "description": "...", "charge": 4, "is_active": true, "template_id": "..."}],
  "bonds": [{"id": "...", "slot_type": "pc_bond", "name": "...", "target_type": "character", "target_id": "...", "target_name": "...", "charges": 3, "degradations": 1, "is_trauma": false, "is_active": true, "source_label": "...", "target_label": "...", "bidirectional": true}],
  "magic_effects": [{"id": "...", "name": "...", "effect_type": "charged", "charges_current": 2, "charges_max": 5, "power_level": 3, "is_active": true}],
  "locations": [{"tier": 1, "items": [{"id": "...", "name": "..."}]}, ...],
  "session_ids": ["..."],
  "active_magic_effects_count": 3,
  "active_trait_count": 4,
  "active_bond_count": 6,
  "last_session_time_now": 42,
  "is_deleted": false, "created_at": "...", "updated_at": "..."
}
```

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/sessions` | GM | Create draft session. Body: `{time_now?, date?, summary?, notes?}` |
| `GET` | `/sessions` | Any | List all sessions. Paginated. |
| `GET` | `/sessions/{id}` | Any | Session detail with participants list. |
| `PATCH` | `/sessions/{id}` | GM | Update draft/active session. 400 if ended. |
| `DELETE` | `/sessions/{id}` | GM | Hard-delete draft only. 400 if active/ended. |
| `POST` | `/sessions/{id}/start` | GM | Draft → Active. Distributes FT+Plot. 409 if another session active. |
| `POST` | `/sessions/{id}/end` | GM | Active → Ended. Clamps Plot to 5. |
| `GET` | `/sessions/{id}/timeline` | Any | Session events (visibility-filtered). Paginated with filters. |
| `POST` | `/sessions/{id}/participants` | Owner/GM | Add participant. Body: `{character_id, additional_contribution?}` |
| `DELETE` | `/sessions/{id}/participants/{character_id}` | Owner/GM | Remove participant. |
| `PATCH` | `/sessions/{id}/participants/{character_id}` | Owner/GM | Update contribution flag (draft only). |

**SessionResponse**:
```json
{
  "id": "...", "status": "active", "time_now": 42,
  "date": "2026-03-15", "summary": "...", "notes": "...",
  "participants": [{"id": "...", "character_id": "...", "additional_contribution": true}],
  "created_at": "...", "updated_at": "..."
}
```

### Proposals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/proposals` | Player | Submit proposal. Body: `{character_id, action_type, narrative?, selections?}` |
| `GET` | `/proposals` | Any | List proposals. Players see own only; GM sees all. Filters: `status?`, `character_id?`, `action_type?`. Paginated. |
| `GET` | `/proposals/{id}` | Any | Single proposal. Players can only read own. |
| `PATCH` | `/proposals/{id}` | Owner/GM | Update pending/rejected proposal. Body: `{narrative?, selections?}`. Auto-recalculates. |
| `DELETE` | `/proposals/{id}` | Owner/GM | Hard-delete pending/rejected only. 409 if approved. |
| `POST` | `/proposals/{id}/approve` | GM | Approve. Body: `{narrative?, gm_overrides?, rider_event?}`. Applies all effects. |
| `POST` | `/proposals/{id}/reject` | GM | Reject. Body: `{rejection_note?}` |

**ProposalResponse**:
```json
{
  "id": "...", "character_id": "...", "action_type": "use_skill",
  "status": "pending", "origin": "player",
  "narrative": "I try to persuade the guard...",
  "selections": {"skill": "influence", "modifiers": {...}, "plot_spend": 1},
  "calculated_effect": {"dice_pool": 4, "costs": {...}},
  "gm_notes": null, "gm_overrides": null,
  "event_id": null, "created_at": "...", "updated_at": "..."
}
```

**Selections shape varies by action_type.** Key patterns:
- `use_skill`: `{skill, modifiers: {core_trait_id?, role_trait_id?, bond_id?}, plot_spend?}`
- `use_magic`: `{magic_stat, intention, symbolism, sacrifices: [{type, ...}], modifiers: {...}}`
- `charge_magic`: `{effect_id, intention, symbolism, sacrifices: [...], modifiers: {...}}`
- `regain_gnosis`: `{modifiers: {...}}`
- `rest`: `{modifiers: {...}}`
- `work_on_project`: `{story_id?, clock_id?, narrative}`
- `new_trait`: `{slot_type, template_id?, proposed_name?, proposed_description?, retire_trait_id?}`
- `new_bond`: `{target_type, target_id, name?, description?, retire_bond_id?}`

**ApproveProposalRequest**:
```json
{
  "narrative": "optional GM narrative override",
  "gm_overrides": {"force": true, "bond_strained": true, ...},
  "rider_event": {"action_type": "modify_character", "targets": [...], "changes": {...}}
}
```

### Clocks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/clocks` | GM | Create clock. Body: `{name, segments?, associated_type?, associated_id?, notes?}` |
| `POST` | `/groups/{id}/clocks` | GM | Create clock auto-associated with group. Body: `{name, segments?, notes?}` |
| `GET` | `/clocks` | Any | List clocks. Filters: `associated_type?`, `associated_id?`, `include_deleted?`. Paginated. |
| `GET` | `/clocks/{id}` | Any | Clock detail. |
| `PATCH` | `/clocks/{id}` | GM | Update name, notes, segments. |
| `DELETE` | `/clocks/{id}` | GM | Soft-delete. |

**ClockResponse**:
```json
{
  "id": "...", "name": "...", "segments": 8, "progress": 3,
  "is_completed": false,
  "associated_type": "group", "associated_id": "...",
  "notes": "...", "is_deleted": false,
  "created_at": "...", "updated_at": "..."
}
```

### Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/groups` | GM | Create group. Body: `{name, tier, description?, notes?}` |
| `GET` | `/groups` | Any | List groups. Filters: `include_deleted?`, `name?`, `sort_by?`, `sort_dir?`. Paginated. |
| `GET` | `/groups/{id}` | Any | Group detail with traits, bonds, and computed members. |
| `PATCH` | `/groups/{id}` | GM | Update name, description, notes. (Tier changed via GM actions.) |
| `DELETE` | `/groups/{id}` | GM | Soft-delete. |

**GroupDetailResponse**:
```json
{
  "id": "...", "name": "...", "tier": 3,
  "description": "...", "notes": "...",
  "traits": [{"id": "...", "slot_type": "group_trait", "name": "...", "description": "...", "is_active": true}],
  "bonds": [{"id": "...", "slot_type": "group_relation", "target_type": "group", "target_id": "...", ...}],
  "members": [{"id": "...", "name": "...", "detail_level": "full"}],
  "is_deleted": false, "created_at": "...", "updated_at": "..."
}
```

### Locations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/locations` | GM | Create location. Body: `{name, description?, parent_id?, notes?}` |
| `GET` | `/locations` | Any | List locations. Filters: `parent?`, `include_deleted?`, `name?`, `sort_by?`, `sort_dir?`. Paginated. |
| `GET` | `/locations/{id}` | Any | Location detail with traits, bonds, and presence tiers. |
| `PATCH` | `/locations/{id}` | GM | Update name, description, notes. (Parent changed via GM actions.) |
| `DELETE` | `/locations/{id}` | GM | Soft-delete. |

**LocationDetailResponse**:
```json
{
  "id": "...", "name": "...", "description": "...",
  "parent_id": "...", "notes": "...",
  "traits": [{"id": "...", "slot_type": "feature_trait", "name": "...", "description": "...", "is_active": true}],
  "bonds": [{"id": "...", "slot_type": "location_bond", ...}],
  "presence": [
    {"tier": 1, "label": "Commonly present", "items": [{"id": "...", "name": "...", "type": "character"}]},
    {"tier": 2, "label": "Often present", "items": [...]},
    {"tier": 3, "label": "Sometimes present", "items": [...]}
  ],
  "is_deleted": false, "created_at": "...", "updated_at": "..."
}
```

### Stories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/stories` | GM | Create story. Body: `{name, summary?, status?, parent_id?, tags?}` |
| `GET` | `/stories` | Any | List stories (visibility-filtered). Filters: `status?`, `tag?`, `owner?`, `include_deleted?`, `sort_by?`, `sort_dir?`. Paginated. |
| `GET` | `/stories/{id}` | Any | Story detail with owners and entries (visibility-filtered). |
| `PATCH` | `/stories/{id}` | GM | Update name, summary, status, tags, visibility. |
| `DELETE` | `/stories/{id}` | GM | Soft-delete. |
| `POST` | `/stories/{id}/owners` | GM | Add owner. Body: `{type, id}` (character/group/location). |
| `DELETE` | `/stories/{id}/owners/{type}/{id}` | GM | Remove owner. |
| `POST` | `/stories/{id}/entries` | Any | Add narrative entry. Body: `{text, character_id?, game_object_refs?}`. Author auto-set. |
| `PATCH` | `/stories/{id}/entries/{entry_id}` | Owner/GM | Edit entry text. |
| `DELETE` | `/stories/{id}/entries/{entry_id}` | Owner/GM | Soft-delete entry. |

**StoryDetailResponse**:
```json
{
  "id": "...", "name": "...", "summary": "...",
  "status": "active", "parent_id": null,
  "tags": ["investigation", "downtime"],
  "visibility_level": "familiar", "visibility_overrides": [],
  "owners": [{"type": "character", "id": "...", "name": "..."}],
  "entries": [{"id": "...", "text": "...", "author_id": "...", "character_id": "...", "session_id": "...", "created_at": "..."}],
  "is_deleted": false, "created_at": "...", "updated_at": "..."
}
```

### Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/events` | Any | List events (visibility-filtered, excludes silent). Filters: `type?`, `target_type?`, `target_id?`, `session_id?`, `actor_type?`, `proposal_id?`, `since?`, `until?`, `sort_by?`, `sort_dir?`. Paginated. |
| `GET` | `/events/{id}` | Any | Single event detail. |
| `PATCH` | `/events/{id}/visibility` | GM | Override visibility level. Body: `{visibility: string}` |

**EventResponse**:
```json
{
  "id": "...", "type": "proposal.approved",
  "visibility": "public",
  "actor_type": "gm", "actor_id": "...",
  "targets": [{"type": "character", "id": "...", "is_primary": true}],
  "payload": {"changes": {...}, "narrative": "..."},
  "proposal_id": "...", "session_id": "...",
  "created_at": "..."
}
```

### Feeds

Feeds merge Events and Story entries into a single chronological stream.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/characters/{id}/feed` | Any | Character feed (visibility-filtered). |
| `GET` | `/groups/{id}/feed` | Any | Group feed (visibility-filtered). |
| `GET` | `/locations/{id}/feed` | Any | Location feed (visibility-filtered). |
| `GET` | `/me/feed` | Any | Personal feed (all visible events/stories). |
| `GET` | `/me/feed/starred` | Any | Starred feed (only starred Game Objects). |
| `GET` | `/me/feed/silent` | GM | Silent events only (GM audit log). |

All feed endpoints share the same filters: `type?`, `target_type?`, `target_id?`, `actor_type?`, `session_id?`, `since?`, `until?`, `after?`, `limit?`

**FeedResponse**:
```json
{
  "items": [
    {"type": "event", "id": "...", "event_type": "character.updated", "timestamp": "...", "narrative": "...", "visibility": "public", "targets": [...], "is_own": true},
    {"type": "story_entry", "id": "...", "story_id": "...", "story_name": "...", "text": "...", "timestamp": "...", "author_id": "..."}
  ],
  "next_cursor": "...",
  "has_more": true
}
```

### Starred Objects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me/starred` | Any | List starred Game Objects. Returns `[{type, id, name}]`. |
| `POST` | `/me/starred` | Any | Star an object. Body: `{type, id}`. Idempotent (200 if already starred). |
| `DELETE` | `/me/starred/{type}/{id}` | Any | Unstar. Idempotent (204 even if not starred). |

### Trait Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/trait-templates` | GM | Create template. Body: `{name, description, type}` (type: 'core' or 'role', immutable). |
| `GET` | `/trait-templates` | Any | List templates. Filters: `type?`, `include_deleted?`. Paginated. |
| `GET` | `/trait-templates/{id}` | Any | Template detail. |
| `PATCH` | `/trait-templates/{id}` | GM | Update name, description (type immutable). |
| `DELETE` | `/trait-templates/{id}` | GM | Soft-delete (existing instances unaffected). |

### Magic Effects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters/{id}/effects/{effect_id}/use` | Owner/GM | Use charged effect (-1 charge). Body: `{narrative?}` |
| `POST` | `/characters/{id}/effects/{effect_id}/retire` | Owner/GM | Retire effect (is_active = false). |

### Player Direct Actions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/characters/{id}/find-time` | Owner/GM | Convert 3 Plot → 1 FT. Returns `{id, plot, free_time}`. |
| `POST` | `/characters/{id}/recharge-trait` | Owner/GM | Restore trait to 5 charges (1 FT). Body: `{trait_instance_id, narrative}`. |
| `POST` | `/characters/{id}/maintain-bond` | Owner/GM | Restore bond charges to effective max (1 FT). Body: `{bond_instance_id, narrative}`. |

### GM Actions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/gm/actions` | GM | Execute single GM action. Returns `EventResponse`. |
| `POST` | `/gm/actions/batch` | GM | Execute 1-50 GM actions atomically. Returns `{events: [EventResponse]}`. |

**GmActionRequest**:
```json
{
  "action_type": "modify_character",
  "targets": [{"type": "character", "id": "..."}],
  "changes": {"stress": {"op": "delta", "value": 2}},
  "narrative": "optional",
  "visibility": "public"
}
```

14 action types: `modify_character`, `modify_group`, `modify_location`, `modify_clock`, `create_bond`, `modify_bond`, `retire_bond`, `create_trait`, `modify_trait`, `retire_trait`, `create_effect`, `modify_effect`, `retire_effect`, `award_xp`

### GM Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/gm/dashboard` | GM | Aggregated state: pending proposals, PC summaries, near-completion clocks, stress proximity. |
| `GET` | `/gm/queue-summary` | GM | Queue view cards for PCs and groups. |

---

## 6. Data Model & Response Shapes

### Key Enums & Constants

**Character detail_level**: `"full"` | `"simplified"`

**User role**: `"gm"` | `"player"`

**Session status**: `"draft"` | `"active"` | `"ended"`

**Proposal status**: `"pending"` | `"approved"` | `"rejected"`

**Proposal origin**: `"player"` | `"system"`

**Story status**: `"active"` | `"completed"` | `"abandoned"`

**Event actor_type**: `"player"` | `"gm"` | `"system"`

**Visibility levels** (ordered): `"silent"` < `"gm_only"` < `"private"` < `"bonded"` < `"familiar"` < `"public"` < `"global"`

**Slot types**: `"core_trait"`, `"role_trait"`, `"pc_bond"`, `"npc_bond"`, `"group_trait"`, `"group_relation"`, `"group_holding"`, `"feature_trait"`, `"location_bond"`

**Magic effect types**: `"instant"` | `"charged"` | `"permanent"`

**Trait template types**: `"core"` | `"role"`

**Game object types** (for polymorphic refs): `"character"` | `"group"` | `"location"`

### Numeric Constants

| Constant | Value | Description |
|----------|-------|-------------|
| STRESS_MAX | 9 | Base max stress (before trauma reduction) |
| FREE_TIME_MAX | 20 | Max free time |
| PLOT_MAX | 5 | Max plot (clamped at session end) |
| GNOSIS_MAX | 23 | Max gnosis |
| PC_BOND_LIMIT | 8 | Max active PC bonds |
| NPC_BOND_LIMIT | 7 | Max active NPC bonds |
| CORE_TRAIT_LIMIT | 2 | Max active core traits |
| ROLE_TRAIT_LIMIT | 3 | Max active role traits |
| GROUP_TRAIT_LIMIT | 10 | Max group trait slots |
| GROUP_RELATION_LIMIT | 7 | Max group-to-group relations |
| FEATURE_TRAIT_LIMIT | 5 | Max location feature traits |
| CHARGE_MAX | 5 | Max trait/bond charges |
| MAX_ACTIVE_EFFECTS | 9 | Max active magic effects (charged + permanent) |
| MAGIC_STAT_MAX_LEVEL | 5 | Max magic stat level |
| MAGIC_STAT_XP_PER_LEVEL | 5 | XP needed per magic stat level (resets on level-up) |
| SKILL_MAX | 3 | Max skill level |

### Common Response Patterns

**All entities** have: `id` (ULID string), `created_at`, `updated_at` (ISO datetime strings)

**Paginated lists** return: `{items: T[], next_cursor: string | null, has_more: boolean}`

**Soft-deletable entities** have: `is_deleted: boolean`

---

## 7. Current UI Reference

The existing UI is a vanilla JavaScript SPA (~29,000 lines) served from the FastAPI server. It uses Alpine.js for reactive state, Pico CSS for base styling, and hash-based routing. Understanding this UI is valuable for knowing what views exist and what the UX should feel like, even though the implementation will be completely different.

### Navigation Structure

**Player tabs** (bottom bar on mobile, top bar on desktop):
```
Feed | Character | Proposals | World | Session
```

**GM tabs**:
```
Queue | Event Feed | Game Objects | Sessions | More ▼
```

The "More" dropdown contains: My Character, Players, Invites, Trait Templates, Clocks, Profile.

Badges on nav tabs show counts (e.g., approved/rejected proposals, pending queue items).

### All Views & Routes

#### Authentication & Onboarding

| Route | View | Description |
|-------|------|-------------|
| `#/login` | Login | Code input form. Deep-links auto-submit from `/login/{code}`. |
| `#/setup` | Setup | GM first-run: display name form. |
| `#/join` | Join | Player invite redemption: display name + character name. |

#### Player Views

| Route | View | Description | Key API Calls |
|-------|------|-------------|---------------|
| `#/` | Feed | Main dashboard with All/Starred tabs. Paginated event+story feed. | `GET /me/feed`, `GET /me/feed/starred` |
| `#/character` | Character Sheet | Player's own character: meters (Stress, FT, Plot, Gnosis), traits, bonds, effects, skills, magic stats, personal feed. | `GET /characters/{id}`, `GET /characters/{id}/feed` |
| `#/proposals` | Proposals List | Player's proposals grouped by status (Pending/Approved/Rejected). | `GET /proposals?character_id={id}` |
| `#/proposals/new` | Proposal Submit | 3-step wizard: (1) Choose action type → (2) Fill details (skill, modifiers, narrative) → (3) Review & submit. | `POST /proposals` |
| `#/proposals/{id}` | Proposal Detail | Single proposal view with status, calculated effect, rejection note. | `GET /proposals/{id}` |
| `#/world` | World Browser | Filterable tabs: Characters, Groups, Locations, Stories. | `GET /characters`, `GET /groups`, `GET /locations`, `GET /stories` |
| `#/world/{type}/{id}` | World Detail | Game object detail view (character/group/location sheet). | `GET /characters/{id}`, `GET /groups/{id}`, `GET /locations/{id}` |
| `#/world/stories/{id}` | Story Detail | Story with entries, owners. | `GET /stories/{id}` |
| `#/profile` | Profile | Display name, role badge, starred objects, refresh magic link. | `GET /me`, `GET /me/starred` |

#### GM Views

| Route | View | Description | Key API Calls |
|-------|------|-------------|---------------|
| `#/gm` | Queue | Primary GM view: pending proposals with accordion expand, approve/reject actions. System proposals shown first. | `GET /proposals?status=pending`, `GET /gm/queue-summary` |
| `#/gm/feed` | Event Feed | All events with All/Silent tabs. DataTable-based with filters. | `GET /events`, `GET /me/feed/silent` |
| `#/gm/world` | World Management | Create/view/edit all game objects. Hub for characters, groups, locations. | Multiple CRUD endpoints |
| `#/gm/world/{type}/new` | Create Forms | Forms for new characters, groups, locations. | `POST /characters`, `POST /groups`, `POST /locations` |
| `#/gm/world/{type}/{id}/edit` | Edit Forms | Edit game object details, traits, bonds. | `PATCH`, `POST /gm/actions` |
| `#/gm/sessions` | Sessions | Session list, create new session. | `GET /sessions`, `POST /sessions` |
| `#/gm/sessions/{id}` | Session Detail | Session info, timeline, participants, start/end controls. | `GET /sessions/{id}`, `GET /sessions/{id}/timeline` |
| `#/gm/players` | Players | Player roster with login links, invite management. | `GET /players`, `GET /game/invites` |
| `#/gm/trait-templates` | Templates | Trait template catalog CRUD. | `GET /trait-templates`, `POST /trait-templates` |
| `#/gm/clocks` | Clocks | Clock management grid. | `GET /clocks` |
| `#/gm/actions` | Direct Actions | Interface for GM direct actions (modify character/group/location, bonds, traits, effects). | `POST /gm/actions` |
| `#/gm/character` | GM Character | GM's own character sheet (if linked). | Same as player character view |

### Reusable UI Components

These represent the core UI building blocks worth recreating:

| Component | Description |
|-----------|-------------|
| **Meter Bar** | Horizontal bar showing Stress/FT/Plot/Gnosis with fill color and label. Shows current/max. |
| **Charge Dots** | Row of 5 filled/empty dots showing trait or bond charges (0-5). |
| **Clock Progress** | Pie-chart-style clock with N segments showing progress (Blades in the Dark style). |
| **Feed List** | Paginated chronological list of events and story entries with "Load more" cursor pagination. |
| **Feed Item** | Single feed entry: event type badge, narrative text, timestamp, targets. |
| **Proposal Card** | Accordion card showing proposal summary, expandable to full details with approve/reject buttons. |
| **Game Object Card** | Shared card component for character/group/location with type icon and summary. |
| **Data Table** | Sortable, filterable table with column headers. Used in GM feed and admin views. |
| **Expandable Item** | Collapsible section with header and toggle. |
| **Step Indicator** | Multi-step form progress indicator (circles: 1-2-3). |
| **Nav Bar** | Responsive navigation with role-specific tabs, badges, and "More" dropdown. |
| **Sacrifice Builder** | Multi-step UI for selecting magic sacrifices (type picker → amount → confirmation). |
| **Narrative Modal** | Modal dialog for entering/displaying narrative text. |

### Key UI Patterns

**Polling**: The current UI polls endpoints at intervals for live updates:
- Character sheet polls character detail
- GM queue polls pending proposals
- Proposals list polls for status changes
- Feeds poll for new entries

Polling pauses when the browser tab is hidden and resumes on focus.

**Toast Notifications**: Error toasts (6s, red) and success toasts (3s, green) at bottom of screen.

**Role-Based Guards**: Views check `isGm` and render a forbidden message if unauthorized.

**Mobile-First Responsive**: Navigation switches from bottom bar (mobile) to top bar (desktop) at 768px breakpoint.

**Dark Theme**: The current UI uses dark mode by default (Pico CSS `data-theme="dark"`).

### User Flows

**New Player Onboarding**:
1. GM generates invite → shares magic link URL
2. Player visits `/login/<code>` → API returns invite signal
3. Frontend shows join form → player enters display name + character name
4. `POST /game/join` creates account + character → sets cookie → redirect to feed

**Player Session**:
1. Feed shows recent world activity
2. Character sheet shows current meters, traits, bonds, effects
3. Submit proposals via 3-step wizard (choose action → fill details → review)
4. Track proposal status (pending → approved/rejected)
5. Explore world objects (characters, groups, locations, stories)

**GM Session**:
1. Queue is primary view — review pending proposals
2. Expand proposal → see calculated effects → approve (optional overrides) or reject (with note)
3. Manage sessions (create → start → end)
4. Direct actions for state changes (modify meters, create bonds/traits, advance clocks)
5. Monitor event feed, manage players and invites

---

## 8. Architecture Notes for Next.js

### Suggested App Router Structure

```
app/
├── (auth)/                    # Unauthenticated routes
│   ├── login/page.tsx
│   ├── login/[code]/page.tsx  # Magic link deep link
│   ├── setup/page.tsx
│   └── join/page.tsx
├── (player)/                  # Player routes (with player nav layout)
│   ├── layout.tsx             # Player nav bar
│   ├── page.tsx               # Feed (home)
│   ├── character/page.tsx     # Own character sheet
│   ├── proposals/
│   │   ├── page.tsx           # Proposals list
│   │   ├── new/page.tsx       # 3-step submission wizard
│   │   └── [id]/page.tsx      # Proposal detail
│   ├── world/
│   │   ├── page.tsx           # World browser
│   │   ├── characters/[id]/page.tsx
│   │   ├── groups/[id]/page.tsx
│   │   ├── locations/[id]/page.tsx
│   │   └── stories/[id]/page.tsx
│   └── profile/page.tsx
├── (gm)/                      # GM routes (with GM nav layout)
│   ├── layout.tsx             # GM nav bar
│   ├── page.tsx               # Queue (home)
│   ├── feed/page.tsx          # Event feed
│   ├── world/
│   │   ├── page.tsx           # World management
│   │   ├── characters/new/page.tsx
│   │   ├── characters/[id]/page.tsx
│   │   ├── characters/[id]/edit/page.tsx
│   │   ├── groups/...
│   │   └── locations/...
│   ├── sessions/
│   │   ├── page.tsx           # Session list
│   │   └── [id]/page.tsx      # Session detail
│   ├── players/page.tsx
│   ├── templates/page.tsx
│   ├── clocks/page.tsx
│   └── actions/page.tsx
└── api/                       # Optional: API route proxying if needed
```

### Key Considerations

1. **Auth state**: Check `GET /me` on app load. Store user info (id, role, character_id) in context/store. Redirect unauthenticated users to `/login`.

2. **Role-based routing**: Use Next.js middleware or layout-level guards to redirect players away from GM routes and vice versa.

3. **CORS**: The backend supports configurable CORS origins. Set `CORS_ORIGINS` on the server to include the frontend's origin. Requests must include `credentials: 'include'` for cookie auth to work cross-origin.

4. **Polling vs SSE**: The current UI uses polling. Consider whether to keep polling (simpler) or implement server-sent events for real-time updates (the server doesn't currently support SSE/WebSocket, so polling is the way to go initially).

5. **Proposal wizard**: The 3-step proposal form is the most complex UI. Each action type has different selection fields. Consider a step-by-step form with dynamic fields based on `action_type`.

6. **Character sheet**: The most data-rich view. Needs to display meters, traits with charge dots, bonds with charges/degradation, magic effects, skills, magic stats, and a feed — all on one page. Consider a tabbed or accordion layout for mobile.

7. **Feed rendering**: Feeds contain two item types (events and story entries) in a discriminated union. Build a feed item renderer that handles both. Cursor-based "load more" pagination.

8. **Clock visualization**: The clock component should render as a pie chart divided into N segments with M filled. This is a good candidate for SVG or canvas rendering.

9. **Dark theme**: The current UI is dark-themed. Consider supporting both dark and light themes, defaulting to dark.

10. **The GM actions interface**: Complex form with 14 action types, each with different payloads. A type-selector → dynamic form pattern works well here.
