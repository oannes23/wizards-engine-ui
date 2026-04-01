# Response Shapes & Type Definitions

> Status: Deepened
> Last verified against backend Pydantic schemas: 2026-03-26
> Related: [contract.md](contract.md), [backend-change-requests.md](backend-change-requests.md)

## Common Patterns

### Base Entity

All entities share:

```typescript
interface BaseEntity {
  id: string           // ULID
  created_at: string   // ISO 8601 UTC
  updated_at: string   // ISO 8601 UTC
}
```

### Soft-Deletable

```typescript
interface SoftDeletable {
  is_deleted: boolean
}
```

### Paginated Response

All list endpoints return:

```typescript
interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null  // ULID cursor for next page
  has_more: boolean
}
```

Query params: `after` (cursor, exclusive), `limit` (default 50, max 100)

### Error Envelope

```typescript
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: {
      fields?: Record<string, string>
    }
  }
}
```

### Entity Reference

Used in location presence tiers, created_objects, etc.:

```typescript
interface EntityRef {
  id: string
  name: string
}
```

---

## Enums

```typescript
type UserRole = 'gm' | 'player'
type DetailLevel = 'full' | 'simplified'
type SessionStatus = 'draft' | 'active' | 'ended'
type ProposalStatus = 'pending' | 'approved' | 'rejected'
type ProposalOrigin = 'player' | 'system'
type StoryStatus = 'active' | 'completed' | 'abandoned'
type ActorType = 'player' | 'gm' | 'system'
type GameObjectType = 'character' | 'group' | 'location'
type MagicEffectType = 'instant' | 'charged' | 'permanent'
type TraitTemplateType = 'core' | 'role'

// Ordered from most restrictive to most permissive
type VisibilityLevel =
  | 'silent' | 'gm_only' | 'private'
  | 'bonded' | 'familiar' | 'public' | 'global'

type SlotType =
  | 'core_trait' | 'role_trait'
  | 'pc_bond' | 'npc_bond'
  | 'group_trait' | 'group_relation' | 'group_holding'
  | 'feature_trait' | 'location_bond'

type SkillName =
  | 'awareness' | 'composure' | 'influence' | 'finesse'
  | 'speed' | 'power' | 'knowledge' | 'technology'

type MagicStatName =
  | 'being' | 'wyrding' | 'summoning' | 'enchanting' | 'dreaming'

type ActionType =
  | 'use_skill' | 'use_magic' | 'charge_magic'
  | 'regain_gnosis' | 'work_on_project' | 'rest'
  | 'new_trait' | 'new_bond'
  | 'resolve_clock' | 'resolve_trauma'

type GmActionType =
  | 'modify_character' | 'modify_group' | 'modify_location' | 'modify_clock'
  | 'create_bond' | 'modify_bond' | 'retire_bond'
  | 'create_trait' | 'modify_trait' | 'retire_trait'
  | 'create_effect' | 'modify_effect' | 'retire_effect'
  | 'award_xp'
```

### Event Types (Convention-Based Strings)

The `type` field on events is a `{domain}.{action}` convention string, not a closed enum.
Rider events may use any string. The types below are produced by backend services:

**Proposal workflow**: `proposal.submitted`, `proposal.approved`, `proposal.rejected`, `proposal.revised`

**Character**: `character.created`, `character.updated`, `character.stress_changed`, `character.gnosis_changed`, `character.meter_updated`, `character.skill_changed`, `character.magic_stat_changed`, `character.resolve_trauma_generated` (silent), `character.free_time_changed`, `character.plot_changed`, `character.skills_changed`, `character.magic_stats_changed`

**Bond**: `bond.created`, `bond.charges_changed`, `bond.updated`, `bond.degraded`, `bond.retired`

**Trait**: `trait.created`, `trait.recharged`, `trait.updated`, `trait.retired`

**Magic**: `magic.effect_created`, `magic.effect_charged`, `magic.effect_updated`, `magic.effect_retired`

**Clock**: `clock.advanced`, `clock.completed`, `clock.resolve_generated` (silent)

**Session**: `session.started` (global), `session.ended` (global), `session.ft_distributed` (silent), `session.plot_distributed` (silent), `session.participant_added` (global)

**Group**: `group.updated`

**Location**: `location.updated`

**Player direct actions**: `player.find_time` (private), `player.recharge_trait` (private), `player.maintain_bond` (private)

**Legacy (seed data)**: `effect.created`, `effect.used`, `effect.retired`

---

## Numeric Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `STRESS_MAX` | 9 | Base max stress (before trauma reduction) |
| `FREE_TIME_MAX` | 20 | Max free time |
| `PLOT_MAX` | 5 | Max plot (clamped at session end) |
| `GNOSIS_MAX` | 23 | Max gnosis |
| `PC_BOND_LIMIT` | 8 | Max active PC bonds |
| `NPC_BOND_LIMIT` | 7 | Max active NPC bonds |
| `CORE_TRAIT_LIMIT` | 2 | Max active core traits |
| `ROLE_TRAIT_LIMIT` | 3 | Max active role traits |
| `GROUP_TRAIT_LIMIT` | 10 | Max group trait slots |
| `GROUP_RELATION_LIMIT` | 7 | Max group-to-group relations |
| `FEATURE_TRAIT_LIMIT` | 5 | Max location feature traits |
| `CHARGE_MAX` | 5 | Max trait/bond charges |
| `MAX_ACTIVE_EFFECTS` | 9 | Max active magic effects (charged + permanent) |
| `MAGIC_STAT_MAX_LEVEL` | 5 | Max magic stat level |
| `MAGIC_STAT_XP_PER_LEVEL` | 5 | XP needed per level (resets on level-up) |
| `SKILL_MAX` | 3 | Max skill level |

---

## Shared Sub-Types

### Modifier (in calculated_effect)

```typescript
interface Modifier {
  type: 'core_trait' | 'role_trait' | 'bond'
  id: string
  name: string
  bonus: 1  // always 1
}
```

### TraitChargeCost (in calculated_effect)

```typescript
interface TraitChargeCost {
  trait_id: string
  cost: 1  // always 1
}
```

### SacrificeEntry (in proposal selections)

Submitted by the player in `selections.sacrifice`:

```typescript
type SacrificeEntry =
  | { type: 'gnosis';    amount: number }
  | { type: 'stress';    amount: number }
  | { type: 'free_time'; amount: number }
  | { type: 'bond';      target_id: string }
  | { type: 'trait';     target_id: string }
  | { type: 'other';     description?: string }
```

### SacrificeDetail (in calculated_effect)

Enriched version computed by the server with gnosis equivalents:

```typescript
type SacrificeDetail =
  | { type: 'gnosis';    amount: number; gnosis_equivalent: number }
  | { type: 'stress';    amount: number; gnosis_equivalent: number }
  | { type: 'free_time'; amount: number; gnosis_equivalent: number }
  | { type: 'bond';      target_id: string; name: string; gnosis_equivalent: 10 }
  | { type: 'trait';     target_id: string; name: string; gnosis_equivalent: 10 }
  | { type: 'other';     description: string; gnosis_equivalent: 0 }
```

**Conversion rates:**

| Type | Gnosis equivalent |
|------|-------------------|
| `gnosis` | amount x 1 |
| `stress` | amount x 2 |
| `free_time` | amount x (3 + lowest_magic_stat) |
| `bond` | 10 (bond retires to Past) |
| `trait` | 10 (trait retires to Past) |
| `other` | 0 (GM assigns via `gm_overrides.style_bonus`) |

### Event Target

```typescript
interface EventTarget {
  target_type: string   // 'character' | 'group' | 'location'
  target_id: string
  is_primary: boolean
}
```

### MeterChange (GM action request)

```typescript
interface MeterChange {
  op: 'delta' | 'set'
  value: number   // relative offset for delta, absolute for set
}
```

### ChangeEntry (in event changes dict)

Recorded on events after application, with before/after values:

```typescript
interface ChangeEntry {
  op: 'meter.delta' | 'meter.set' | 'field.set' | 'entity.created'
  before: unknown
  after: unknown
  clamped?: boolean   // present when value was clamped to valid range
}
```

---

## Entity Response Shapes

### User

```typescript
interface UserResponse {
  id: string
  display_name: string
  role: UserRole
  character_id: string | null
  login_url?: string          // GM sees this for other users
}
```

### Character Detail

Single response type for both PCs and NPCs. PC-specific fields are `null` for simplified characters.

```typescript
interface CharacterDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  detail_level: DetailLevel
  description: string | null
  notes: string | null
  attributes: Record<string, unknown> | null  // freeform JSON, primarily for NPC data

  // Bonds — always present, split by status
  bonds: {
    active: BondDisplayResponse[]
    past: BondDisplayResponse[]
  }

  // Locations — always present, grouped by hop distance
  locations: {
    common: EntityRef[]     // 1-hop (commonly present)
    familiar: EntityRef[]   // 2-hop (often present)
    known: EntityRef[]      // 3-hop (sometimes present)
  }

  // --- Full (PC) only — null for simplified (NPC) characters ---
  stress: number | null
  free_time: number | null
  plot: number | null
  gnosis: number | null
  effective_stress_max: number | null          // 9 - trauma count
  skills: Record<SkillName, number> | null     // 8 skills, levels 0-3
  magic_stats: Record<MagicStatName, { level: number; xp: number }> | null
  traits: {
    active: CharacterTraitResponse[]
    past: CharacterTraitResponse[]
  } | null
  magic_effects: {
    active: MagicEffectResponse[]
    past: MagicEffectResponse[]
  } | null
  session_ids: string[] | null
  active_magic_effects_count: number | null
  active_trait_count: number | null
  active_bond_count: number | null             // outbound pc_bond slots only
  last_session_time_now: number | null
}
```

### Character Summary

```typescript
interface CharacterSummaryResponse {
  items: Array<{
    id: string
    name: string
    stress: number
    free_time: number
    plot: number
    gnosis: number
  }>
}
```

### Bond Display

Perspective-normalized — always shows the "other end" from the requesting character's view. Bidirectional bonds return the same `id` on both sides.

```typescript
interface BondDisplayResponse {
  id: string                            // same ULID on both sides for bidirectional
  slot_type: SlotType
  target_type: GameObjectType           // the OTHER end
  target_id: string                     // ULID of the OTHER end
  target_name: string                   // resolved name of the OTHER end
  label: string                         // perspective-normalized label
  description: string | null
  is_active: boolean
  bidirectional: boolean
  charges: number | null                // PC bonds only
  degradations: number | null           // PC bonds only
  is_trauma: boolean | null             // PC bonds only
  effective_charges_max: number | null  // computed: 5 - degradations (PC bonds only)
}
```

### Character Trait

```typescript
interface CharacterTraitResponse extends BaseEntity {
  slot_type: SlotType
  name: string
  description: string | null
  charge: number
  is_active: boolean
  template_id: string | null
}
```

### Magic Effect

```typescript
interface MagicEffectResponse extends BaseEntity {
  name: string
  effect_type: MagicEffectType
  charges_current: number | null   // only for 'charged'
  charges_max: number | null       // only for 'charged'
  power_level: number              // 1-5
  is_active: boolean
}
```

### Session

```typescript
interface SessionResponse extends BaseEntity {
  status: SessionStatus
  time_now: number | null       // null until set
  date: string | null           // "YYYY-MM-DD"
  summary: string | null
  notes: string | null
  participants: ParticipantResponse[]
}

interface ParticipantResponse {
  session_id: string
  character_id: string
  character_name: string | null   // denormalized from Character
  additional_contribution: boolean
}
```

### Proposal

```typescript
interface ProposalResponse extends BaseEntity {
  character_id: string | null      // null for system proposals
  action_type: ActionType
  status: ProposalStatus
  origin: ProposalOrigin
  narrative: string | null
  selections: Record<string, unknown>          // varies by action_type (see Selections section)
  calculated_effect: Record<string, unknown> | null  // varies by action_type (see Calculated Effects section)
  gm_notes: string | null
  gm_overrides: Record<string, unknown> | null       // see GM Overrides section
  event_id: string | null          // set on approval
  rider_event_id: string | null    // set if rider event created
  clock_id: string | null          // resolve_clock only
}
```

### Clock

```typescript
interface ClockResponse extends BaseEntity, SoftDeletable {
  name: string
  segments: number
  progress: number
  is_completed: boolean
  associated_type: GameObjectType | null
  associated_id: string | null
  notes: string | null
}
```

### Group Detail

```typescript
interface GroupDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  tier: number
  description: string | null
  notes: string | null
  traits: CharacterTraitResponse[]
  bonds: BondDisplayResponse[]
  members: Array<{ id: string; name: string; detail_level: DetailLevel }>
}
```

### Location Detail

```typescript
interface LocationDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  description: string | null
  parent_id: string | null
  notes: string | null
  traits: CharacterTraitResponse[]
  bonds: BondDisplayResponse[]
  presence: Array<{
    tier: number
    label: string      // "Commonly present", "Often present", "Sometimes present"
    items: Array<{ id: string; name: string; type: GameObjectType }>
  }>
}
```

### Story Detail

```typescript
interface StoryDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  summary: string | null
  status: StoryStatus
  parent_id: string | null
  tags: string[]
  visibility_level: VisibilityLevel
  visibility_overrides: unknown[]
  owners: Array<{ type: GameObjectType; id: string; name: string }>
  entries: Array<{                     // capped at 20 most recent, oldest-first within window
    id: string
    text: string
    author_id: string
    character_id: string | null
    session_id: string | null
    created_at: string
  }>
  has_more_entries: boolean             // true if story has > 20 entries total
  entries_cursor: string | null         // reserved for future use (currently null)
}
```

### Event

Events have a single fixed shape for all event types. What varies is the _contents_ of `changes`, `created_objects`, `targets`, and `metadata`.

```typescript
interface EventResponse extends BaseEntity {
  type: string                              // "{domain}.{action}" convention string
  actor_type: ActorType
  actor_id: string | null                   // null for system events
  actor_name: string | null                 // denormalized User.display_name
  targets: EventTarget[]
  primary_target_name: string | null        // denormalized
  primary_target_type: string | null        // denormalized
  changes: Record<string, ChangeEntry>      // keys: "{entity_type}.{ulid}.{field}" e.g. "character.01HXYZ.stress"
                                            // Parse field name: key.split('.').pop() → "stress"
  changes_summary: string | null            // e.g. "Stress: 3 → 5, Plot: 5 → 3"
  created_objects: Array<{ type: string; id: string }> | null
  deleted_objects: Array<{ type: string; id: string }> | null
  narrative: string | null
  visibility: VisibilityLevel
  proposal_id: string | null
  parent_event_id: string | null            // for rider events
  session_id: string | null
  metadata: Record<string, unknown> | null
}
```

### Feed Item (Discriminated Union)

```typescript
type FeedItemResponse =
  | {
      type: 'event'
      id: string
      event_type: string
      timestamp: string
      narrative: string | null
      visibility: VisibilityLevel
      targets: Array<{ type: GameObjectType; id: string; is_primary: boolean }>
      is_own: boolean
    }
  | {
      type: 'story_entry'
      id: string
      story_id: string
      story_name: string
      text: string
      timestamp: string
      author_id: string
    }
```

### Trait Template

```typescript
interface TraitTemplateResponse extends BaseEntity, SoftDeletable {
  name: string
  description: string
  type: TraitTemplateType
}
```

### Invite

```typescript
interface InviteResponse {
  id: string              // ULID — this IS the shareable code
  is_consumed: boolean
  login_url: string       // computed: "/login/{id}"
  created_at: string      // ISO 8601 UTC
}
```

> **Note**: No `consumed_by` field. `id` is the invite code itself.

### GM Dashboard

```typescript
interface GmDashboardResponse {
  pending_proposals: number
  pc_summaries: Array<{
    id: string
    name: string
    stress: number
    free_time: number
    plot: number
    gnosis: number
  }>
  near_completion_clocks: ClockResponse[]
  stress_proximity: Array<{
    id: string
    name: string
    stress: number
    effective_stress_max: number
  }>
}
```

---

## Proposal Selections by Action Type

### use_skill

```typescript
interface UseSkillSelections {
  skill: SkillName
  modifiers: {
    core_trait_id?: string
    role_trait_id?: string
    bond_id?: string
  }
  plot_spend?: number
}
```

### use_magic

```typescript
interface UseMagicSelections {
  magic_stat: MagicStatName        // player's suggested stat
  intention: string
  symbolism: string
  sacrifice: SacrificeEntry[]
  modifiers: {
    core_trait_id?: string
    role_trait_id?: string
    bond_id?: string
  }
}
```

### charge_magic

```typescript
interface ChargeMagicSelections {
  effect_id: string
  intention: string
  symbolism: string
  sacrifice: SacrificeEntry[]
  modifiers: {
    core_trait_id?: string
    role_trait_id?: string
    bond_id?: string
  }
}
```

### regain_gnosis, rest

```typescript
interface DowntimeWithModifiersSelections {
  modifiers: {
    core_trait_id?: string
    role_trait_id?: string
    bond_id?: string
  }
}
```

### work_on_project

```typescript
interface WorkOnProjectSelections {
  story_id?: string
  clock_id?: string
  narrative: string
}
```

### new_trait

```typescript
interface NewTraitSelections {
  slot_type: 'core_trait' | 'role_trait'
  template_id?: string
  proposed_name?: string
  proposed_description?: string
  retire_trait_id?: string
}
```

### new_bond

```typescript
interface NewBondSelections {
  target_type: GameObjectType
  target_id: string
  name?: string
  description?: string
  retire_bond_id?: string
}
```

---

## Calculated Effect Shapes

`ProposalResponse.calculated_effect` is `null` until calculated, then contains an action-type-specific object. System proposals (`resolve_clock`, `resolve_trauma`) have `null` calculated_effect.

### use_skill

```typescript
interface UseSkillEffect {
  dice_pool: number              // skill_level + modifier count
  skill: SkillName
  skill_level: number            // 0-3
  modifiers: Modifier[]
  plot_spend: number
  costs: {
    trait_charges: TraitChargeCost[]
    plot: number
  }
}
```

### use_magic

```typescript
interface UseMagicEffect {
  suggested_stat: MagicStatName
  stat_level: number                    // 0-5
  dice_pool: number                     // stat_level + sacrifice_dice + modifier count
  sacrifice_dice: number                // from tiered gnosis conversion
  total_gnosis_equivalent: number       // sum of all sacrifice entries
  sacrifice_details: SacrificeDetail[]
  modifiers: Modifier[]
  plot_spend: number
  costs: {
    gnosis: number
    stress: number
    free_time: number
    bond_sacrifices: Array<{ bond_id: string; name: string }>
    trait_sacrifices: Array<{ trait_id: string; name: string }>
    trait_charges: TraitChargeCost[]
    plot: number
  }
}
```

### charge_magic

```typescript
interface ChargeMagicEffect extends UseMagicEffect {
  target_effect: {
    id: string
    name: string
    effect_type: MagicEffectType       // 'charged' | 'permanent'
    power_level: number                // 1-5
    charges_current: number | null     // only for 'charged'
    charges_max: number | null         // only for 'charged'
  }
}
```

### regain_gnosis

```typescript
interface RegainGnosisEffect {
  gnosis_gained: number     // 3 + lowest_magic_stat + modifier_count
  costs: {
    free_time: 1
    trait_charges: TraitChargeCost[]
  }
}
```

### rest

```typescript
interface RestEffect {
  stress_healed: number     // 3 + modifier_count
  costs: {
    free_time: 1
    trait_charges: TraitChargeCost[]
  }
}
```

### work_on_project

```typescript
interface WorkOnProjectEffect {
  story_id: string
  entry_text: string
  costs: { free_time: 1 }
}
```

### new_trait

```typescript
interface NewTraitEffect {
  slot_type: 'core_trait' | 'role_trait'
  template_id: string | null
  proposed_name: string | null
  proposed_description: string | null
  retire_trait_id: string | null
  costs: { free_time: 1 }
}
```

### new_bond

```typescript
interface NewBondEffect {
  target_type: GameObjectType
  target_id: string
  retire_bond_id: string | null
  costs: { free_time: 1 }
}
```

### resolve_clock / resolve_trauma

```typescript
// System proposals — calculated_effect is null.
// All mechanical details come from GM approval via gm_overrides/rider_event.
```

---

## GM Override Shapes

`gm_overrides` is a free-form `Record<string, unknown> | null` at the schema level. Unknown keys are silently ignored (stored but not processed). The flags below are the ones the backend actually reads.

### Universal flags (all action types)

| Flag | Type | Description |
|------|------|-------------|
| `force` | `boolean` | Force approval despite insufficient resources (transient, not persisted) |

### Magic actions (use_magic, charge_magic)

| Flag | Type | Description |
|------|------|-------------|
| `actual_stat` | `string` | Override the player's `suggested_stat` with a different magic stat |
| `style_bonus` | `number` | Hidden bonus Gnosis added before tiered conversion |
| `effect_details` | `EffectDetails` | For `use_magic`: defines the created Magic Effect |
| `charges_added` | `number` | For `charge_magic` on charged effects |
| `power_boost` | `number` | For `charge_magic` on permanent effects |

```typescript
interface EffectDetails {
  name: string
  description: string
  effect_type: MagicEffectType             // 'instant' | 'charged' | 'permanent'
  power_level: number                       // 1-5
  charges_current?: number                  // required for 'charged'
  charges_max?: number                      // required for 'charged'
}
```

### Actions with modifiers (use_skill, use_magic, charge_magic, regain_gnosis, rest)

| Flag | Type | Description |
|------|------|-------------|
| `bond_strained` | `boolean` | Apply +1 stress to the bond modifier's character if present |

### resolve_trauma (system proposal)

| Flag | Type | Required | Description |
|------|------|----------|-------------|
| `trauma_bond_id` | `string` | **Yes** | Which active bond becomes the Trauma |
| `trauma_name` | `string` | **Yes** | Name for the new Trauma bond |
| `trauma_description` | `string` | **Yes** | Description for the Trauma bond |

### resolve_clock (system proposal)

No mechanical overrides needed. Use `narrative` and optional `rider_event` on the approve request.

---

## Rider Event Shape

Rider events are optional secondary events bundled into a proposal approval. Structurally different from GM actions — they are raw event records, not high-level intents.

```typescript
interface RiderEventPayload {
  type: string                                    // e.g. "clock.advanced", "character.stress_changed"
  targets?: EventTarget[]                         // default: []
  changes?: Record<string, ChangeEntry>           // default: {}
  narrative?: string | null
  visibility?: VisibilityLevel                    // default: 'bonded'
  metadata?: Record<string, unknown> | null
}
```

Any `type` string is accepted. The rider event is stored as a separate Event row with `parent_event_id` linking to the approval event. Created atomically in the same transaction.

---

## GM Action Request Shapes

### Request Body

```typescript
interface GmActionRequest {
  action_type: GmActionType
  targets: EventTarget[]
  changes: Record<string, MeterChange | unknown>   // field-specific, see below
  narrative?: string
  visibility?: VisibilityLevel                      // default: 'bonded'
}
```

### Valid Change Fields per Action Type

| action_type | Valid change fields |
|---|---|
| `modify_character` | `stress`, `free_time`, `plot`, `gnosis` (MeterChange); `skills` (dict of skill_name → level); `magic_stats` (dict of stat_name → {xp?, level?}); `attributes` (dict merged into existing); `last_session_time_now` (int) |
| `modify_group` | `tier` (int, absolute) |
| `modify_location` | `parent_id` (string \| null) |
| `modify_clock` | `progress` (MeterChange) |
| `modify_bond` | `source_label`, `target_label`, `description` (string); `charges`, `degradations` (MeterChange) |
| `modify_trait` | `name`, `description` (string); `charge` (MeterChange) |
| `modify_effect` | `name`, `description` (string); `charges_current`, `charges_max`, `power_level` (MeterChange) |

---

## Error Codes

### 400 Bad Request

| Code | Endpoints | Description |
|------|-----------|-------------|
| `invalid_time_now` | POST/PATCH sessions | time_now validation failure |
| `session_not_draft` | DELETE session, PATCH participant | Requires draft status |
| `session_not_active` | POST session/end | Requires active status |
| `session_ended` | Various session ops | Operation forbidden on ended sessions |
| `time_now_not_set` | POST session/start | Missing time_now before start |
| `character_not_full` | POST participant | Character detail_level != "full" |
| `effect_not_active` | GM actions | Retired effect cannot be targeted |
| `effect_not_charged` | GM actions | Effect is not of type "charged" |

### 401 Unauthorized

| Code | Endpoints | Description |
|------|-----------|-------------|
| `cookie_missing` | All authenticated | No auth cookie present |
| `cookie_invalid` | All authenticated | Auth cookie invalid |
| `account_inactive` | All authenticated | User account deactivated |
| `insufficient_role` | GM-only endpoints | Player accessing GM endpoint |
| `invite_consumed` | POST /auth/login | Invite already redeemed |

### 403 Forbidden

| Code | Endpoints | Description |
|------|-----------|-------------|
| `forbidden` | Various | Generic insufficient permissions |
| `character_not_owned` | Participant, proposal endpoints | Player accessing another's resources |

### 404 Not Found

| Code | Endpoints | Description |
|------|-----------|-------------|
| `not_found` | All resource endpoints | Resource doesn't exist or visibility-hidden |
| `code_not_found` | POST /auth/login | Invalid login code |
| `invite_not_found` | Invite endpoints | Invite doesn't exist |
| `player_not_found` | Player lookups | Player doesn't exist |

### 409 Conflict

| Code | Endpoints | Description |
|------|-----------|-------------|
| `active_session_exists` | POST session/start | Another session is already active |
| `already_registered` | POST participant | Duplicate registration |
| `no_charges_remaining` | GM actions (effects) | Charged effect has 0 charges |
| `proposal_not_pending` | Approve/reject proposal | Proposal not in pending status |
| `proposal_approved` | Resubmit proposal | Already approved |

### 422 Unprocessable Entity

| Code | Endpoints | Description |
|------|-----------|-------------|
| `validation_error` | All POST/PATCH | Schema or field validation failed |

---

## Interrogation Decisions (2026-03-26)

### Feed Rendering: Server-Generated Summary

- **Decision**: Use `EventResponse.changes_summary` as default display text for event changes
- **Rationale**: Simple, consistent, always available. Add custom rendering only for specific event types that need richer UI (e.g., proposal.approved with dice results).
- **Implications**: Feed components render `changes_summary` as secondary text below the narrative. Raw `changes` dict is available for future enhancement.

### NPC Attributes: Key-Value Editor

- **Decision**: Render `attributes` as an editable key-value table on the GM NPC edit page
- **Rationale**: Useful for GM-defined stats, abilities, notes for NPCs. Simple UI for freeform data.
- **Implications**: GM character edit page detects `detail_level === 'simplified'` and shows attributes editor. PC character pages ignore attributes.

### Proposal Dry-Run (CR-001): Implemented

- **Decision**: ~~Mark proposal wizard Step 3 as blocked until CR-001~~ CR-001 shipped (2026-03-27). `POST /proposals/calculate` returns `calculated_effect` without side effects.
- **Rationale**: Same request shape as `POST /proposals`. Safe to call repeatedly. 422 errors for invalid selections.
- **Implications**: Step 3 can now display the real server-computed `calculated_effect`. No client-side estimation needed.

### Active Session Detection: Native Filter

- **Decision**: Use `GET /sessions?status=active` directly (CR-007 shipped)
- **Rationale**: Backend now supports status filter natively. No client-side filtering needed.
- **Implications**: `useActiveSession()` hook uses `?status=active&limit=1` as specified in data-fetching.md.

### Key Discrepancies Corrected from Backend

The following shapes were corrected in this spec based on actual Pydantic schemas:

1. **CharacterDetailResponse**: Single type with nullable PC fields (not two separate Full/Simplified types). Bonds, traits, effects are `{active, past}` objects, not flat arrays. Locations use `{common, familiar, known}`, not `PresenceTierResponse[]`.
2. **BondDisplayResponse**: Replaces `BondInstanceResponse`. Perspective-normalized `label` field (not `source_label`/`target_label`). `charges`, `degradations`, `is_trauma` are nullable. New `effective_charges_max` computed field.
3. **EventResponse**: Has `changes`, `created_objects`, `deleted_objects`, `changes_summary` instead of generic `payload`. Includes `actor_name`, `primary_target_name`, `primary_target_type`, `parent_event_id`, `metadata`.
4. **ProposalResponse**: `character_id` is nullable. Added `rider_event_id`, `clock_id`.
5. **SessionResponse**: `time_now` is nullable. Participants include `character_name`.
6. **New types added**: Full calculated_effect shapes per action type, SacrificeEntry/SacrificeDetail, GM override flags, EffectDetails, RiderEventPayload, MeterChange, ChangeEntry, InviteResponse, error code catalog, event type catalog.
