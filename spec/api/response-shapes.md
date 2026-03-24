# Response Shapes & Type Definitions

> Last verified against FRONTEND_SEED.md: 2026-03-23

## Common Patterns

### Base Entity

All entities share:

```typescript
interface BaseEntity {
  id: string           // ULID
  created_at: string   // ISO datetime
  updated_at: string   // ISO datetime
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

### Character Detail (Full PC)

```typescript
interface FullCharacterDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  detail_level: 'full'
  description: string | null
  notes: string | null
  attributes: Record<string, unknown>
  stress: number
  free_time: number
  plot: number
  gnosis: number
  effective_stress_max: number
  skills: Record<SkillName, number>
  magic_stats: Record<MagicStatName, { level: number; xp: number }>
  traits: TraitInstanceResponse[]
  bonds: BondInstanceResponse[]
  magic_effects: MagicEffectResponse[]
  locations: PresenceTierResponse[]
  session_ids: string[]
  active_magic_effects_count: number
  active_trait_count: number
  active_bond_count: number
  last_session_time_now: number | null
}
```

### Character Detail (Simplified NPC)

```typescript
interface SimplifiedCharacterDetailResponse extends BaseEntity, SoftDeletable {
  name: string
  detail_level: 'simplified'
  description: string | null
  notes: string | null
  attributes: Record<string, unknown>
  bonds: BondInstanceResponse[]
  locations: PresenceTierResponse[]
  session_ids: string[]
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

### Bond Instance

```typescript
interface BondInstanceResponse extends BaseEntity {
  slot_type: SlotType
  name: string
  target_type: GameObjectType
  target_id: string
  target_name: string
  charges: number
  degradations: number
  is_trauma: boolean
  is_active: boolean
  source_label: string
  target_label: string
  bidirectional: boolean
}
```

### Trait Instance

```typescript
interface TraitInstanceResponse extends BaseEntity {
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
  charges_current: number | null
  charges_max: number | null
  power_level: number
  is_active: boolean
}
```

### Presence Tier

```typescript
interface PresenceTierResponse {
  tier: number           // 1, 2, or 3
  items: Array<{ id: string; name: string }>
}
```

### Session

```typescript
interface SessionResponse extends BaseEntity {
  status: SessionStatus
  time_now: number
  date: string | null
  summary: string | null
  notes: string | null
  participants: Array<{
    id: string
    character_id: string
    additional_contribution: boolean
  }>
}
```

### Proposal

```typescript
interface ProposalResponse extends BaseEntity {
  character_id: string
  action_type: ActionType
  status: ProposalStatus
  origin: ProposalOrigin
  narrative: string | null
  selections: Record<string, unknown> | null   // varies by action_type
  calculated_effect: Record<string, unknown> | null
  gm_notes: string | null
  gm_overrides: Record<string, unknown> | null
  event_id: string | null
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
  traits: TraitInstanceResponse[]
  bonds: BondInstanceResponse[]
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
  traits: TraitInstanceResponse[]
  bonds: BondInstanceResponse[]
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
  entries: Array<{
    id: string
    text: string
    author_id: string
    character_id: string | null
    session_id: string | null
    created_at: string
  }>
}
```

### Event

```typescript
interface EventResponse extends BaseEntity {
  type: string              // e.g., "proposal.approved", "character.updated"
  visibility: VisibilityLevel
  actor_type: ActorType
  actor_id: string
  targets: Array<{
    type: GameObjectType
    id: string
    is_primary: boolean
  }>
  payload: Record<string, unknown>
  proposal_id: string | null
  session_id: string | null
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
