// ──────────────────────────────────────────────────────────────────
// Wizards Engine UI — API Response Types & Enums
// Source of truth: spec/api/response-shapes.md
// All enums are string literal unions (not TypeScript enums).
// ──────────────────────────────────────────────────────────────────

// ── Enums ────────────────────────────────────────────────────────

export type UserRole = "gm" | "player" | "viewer";
export type DetailLevel = "full" | "simplified";
export type SessionStatus = "draft" | "active" | "ended";
export type ProposalStatus = "pending" | "approved" | "rejected";
export type ProposalOrigin = "player" | "system";
export type StoryStatus = "active" | "completed" | "abandoned";
export type ActorType = "player" | "gm" | "system";
export type GameObjectType = "character" | "group" | "location";
export type MagicEffectType = "instant" | "charged" | "permanent";
export type TraitTemplateType = "core" | "role";

export type VisibilityLevel =
  | "silent"
  | "gm_only"
  | "private"
  | "bonded"
  | "familiar"
  | "public"
  | "global";

export type SlotType =
  | "core_trait"
  | "role_trait"
  | "pc_bond"
  | "npc_bond"
  | "group_trait"
  | "group_relation"
  | "group_holding"
  | "feature_trait"
  | "location_bond";

export type SkillName =
  | "awareness"
  | "composure"
  | "influence"
  | "finesse"
  | "speed"
  | "power"
  | "knowledge"
  | "technology";

export type MagicStatName =
  | "being"
  | "wyrding"
  | "summoning"
  | "enchanting"
  | "dreaming";

export type ActionType =
  | "use_skill"
  | "use_magic"
  | "charge_magic"
  | "regain_gnosis"
  | "work_on_project"
  | "rest"
  | "new_trait"
  | "new_bond"
  | "resolve_clock"
  | "resolve_trauma";

export type GmActionType =
  | "modify_character"
  | "modify_group"
  | "modify_location"
  | "modify_clock"
  | "create_bond"
  | "modify_bond"
  | "retire_bond"
  | "create_trait"
  | "modify_trait"
  | "retire_trait"
  | "create_effect"
  | "modify_effect"
  | "retire_effect"
  | "award_xp";

// ── Common Patterns ──────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SoftDeletable {
  is_deleted: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      fields?: Record<string, string>;
    };
  };
}

export interface EntityRef {
  id: string;
  name: string;
}

// ── Shared Sub-Types ──────────────────────────────────────────────

export interface Modifier {
  type: "core_trait" | "role_trait" | "bond";
  id: string;
  name: string;
  bonus: 1;
}

export interface TraitChargeCost {
  trait_id: string;
  cost: 1;
}

export type SacrificeEntry =
  | { type: "gnosis"; amount: number }
  | { type: "stress"; amount: number }
  | { type: "free_time"; amount: number }
  | { type: "bond"; target_id: string }
  | { type: "trait"; target_id: string }
  | { type: "other"; description?: string };

export type SacrificeDetail =
  | { type: "gnosis"; amount: number; gnosis_equivalent: number }
  | { type: "stress"; amount: number; gnosis_equivalent: number }
  | { type: "free_time"; amount: number; gnosis_equivalent: number }
  | { type: "bond"; target_id: string; name: string; gnosis_equivalent: 10 }
  | { type: "trait"; target_id: string; name: string; gnosis_equivalent: 10 }
  | { type: "other"; description: string; gnosis_equivalent: 0 };

export interface EventTarget {
  target_type: string;
  target_id: string;
  is_primary: boolean;
}

export interface MeterChange {
  op: "delta" | "set";
  value: number;
}

export interface ChangeEntry {
  op: "meter.delta" | "meter.set" | "field.set" | "entity.created";
  before: unknown;
  after: unknown;
  clamped?: boolean;
}

// ── Entity Response Shapes ────────────────────────────────────────

export interface UserResponse {
  id: string;
  display_name: string;
  role: UserRole;
  character_id: string | null;
  login_url?: string;
}

export interface MeResponse extends UserResponse {
  can_view_gm_content: boolean;
  can_take_gm_actions: boolean;
}

// ── Character ────────────────────────────────────────────────────

export interface BondDisplayResponse {
  id: string;
  slot_type: SlotType;
  target_type: GameObjectType;
  target_id: string;
  target_name: string;
  label: string;
  description: string | null;
  is_active: boolean;
  bidirectional: boolean;
  charges: number | null;
  degradations: number | null;
  is_trauma: boolean | null;
  effective_charges_max: number | null;
}

export interface CharacterTraitResponse extends BaseEntity {
  slot_type: SlotType;
  name: string;
  description: string | null;
  charge: number;
  is_active: boolean;
  template_id: string | null;
}

export interface MagicEffectResponse extends BaseEntity {
  name: string;
  effect_type: MagicEffectType;
  charges_current: number | null;
  charges_max: number | null;
  power_level: number;
  is_active: boolean;
}

export interface CharacterDetailResponse extends BaseEntity, SoftDeletable {
  name: string;
  detail_level: DetailLevel;
  description: string | null;
  notes: string | null;
  attributes: Record<string, unknown> | null;
  bond_distance: number | null;

  bonds: {
    active: BondDisplayResponse[];
    past: BondDisplayResponse[];
  };

  locations: {
    common: EntityRef[];
    familiar: EntityRef[];
    known: EntityRef[];
  };

  // PC-only fields (null for simplified/NPC characters)
  stress: number | null;
  free_time: number | null;
  plot: number | null;
  gnosis: number | null;
  effective_stress_max: number | null;
  skills: Record<SkillName, number> | null;
  magic_stats: Record<MagicStatName, { level: number; xp: number }> | null;
  traits: {
    active: CharacterTraitResponse[];
    past: CharacterTraitResponse[];
  } | null;
  magic_effects: {
    active: MagicEffectResponse[];
    past: MagicEffectResponse[];
  } | null;
  session_ids: string[] | null;
  active_magic_effects_count: number | null;
  active_trait_count: number | null;
  active_bond_count: number | null;
  last_session_time_now: number | null;
}

export interface CharacterSummaryResponse {
  items: Array<{
    id: string;
    name: string;
    stress: number;
    free_time: number;
    plot: number;
    gnosis: number;
  }>;
}

// ── Session ──────────────────────────────────────────────────────

export interface ParticipantResponse {
  session_id: string;
  character_id: string;
  character_name: string | null;
  additional_contribution: boolean;
}

export interface SessionResponse extends BaseEntity {
  status: SessionStatus;
  time_now: number | null;
  date: string | null;
  summary: string | null;
  notes: string | null;
  participants: ParticipantResponse[];
}

// ── Proposal ─────────────────────────────────────────────────────

export interface ProposalResponse extends BaseEntity {
  character_id: string | null;
  action_type: ActionType;
  status: ProposalStatus;
  origin: ProposalOrigin;
  narrative: string | null;
  selections: Record<string, unknown>;
  calculated_effect: Record<string, unknown> | null;
  gm_notes: string | null;
  gm_overrides: Record<string, unknown> | null;
  revision_count: number;
  event_id: string | null;
  rider_event_id: string | null;
  clock_id: string | null;
}

// ── Proposal Selections ──────────────────────────────────────────

export interface UseSkillSelections {
  skill: SkillName;
  modifiers: {
    core_trait_id?: string;
    role_trait_id?: string;
    bond_id?: string;
  };
  plot_spend?: number;
}

export interface UseMagicSelections {
  magic_stat: MagicStatName;
  intention: string;
  symbolism: string;
  sacrifice: SacrificeEntry[];
  modifiers: {
    core_trait_id?: string;
    role_trait_id?: string;
    bond_id?: string;
  };
}

export interface ChargeMagicSelections {
  effect_id: string;
  intention: string;
  symbolism: string;
  sacrifice: SacrificeEntry[];
  modifiers: {
    core_trait_id?: string;
    role_trait_id?: string;
    bond_id?: string;
  };
}

export interface DowntimeWithModifiersSelections {
  modifiers: {
    core_trait_id?: string;
    role_trait_id?: string;
    bond_id?: string;
  };
}

export interface WorkOnProjectSelections {
  story_id?: string;
  clock_id?: string;
  narrative: string;
}

export interface NewTraitSelections {
  slot_type: "core_trait" | "role_trait";
  template_id?: string;
  proposed_name?: string;
  proposed_description?: string;
  retire_trait_id?: string;
}

export interface NewBondSelections {
  target_type: GameObjectType;
  target_id: string;
  name?: string;
  description?: string;
  retire_bond_id?: string;
}

// ── Calculated Effects ───────────────────────────────────────────

export interface UseSkillEffect {
  dice_pool: number;
  skill: SkillName;
  skill_level: number;
  modifiers: Modifier[];
  plot_spend: number;
  costs: {
    trait_charges: TraitChargeCost[];
    plot: number;
  };
}

export interface UseMagicEffect {
  suggested_stat: MagicStatName;
  stat_level: number;
  dice_pool: number;
  sacrifice_dice: number;
  total_gnosis_equivalent: number;
  sacrifice_details: SacrificeDetail[];
  modifiers: Modifier[];
  plot_spend: number;
  costs: {
    gnosis: number;
    stress: number;
    free_time: number;
    bond_sacrifices: Array<{ bond_id: string; name: string }>;
    trait_sacrifices: Array<{ trait_id: string; name: string }>;
    trait_charges: TraitChargeCost[];
    plot: number;
  };
}

export interface ChargeMagicEffect extends UseMagicEffect {
  target_effect: {
    id: string;
    name: string;
    effect_type: MagicEffectType;
    power_level: number;
    charges_current: number | null;
    charges_max: number | null;
  };
}

export interface RegainGnosisEffect {
  gnosis_gained: number;
  costs: {
    free_time: 1;
    trait_charges: TraitChargeCost[];
  };
}

export interface RestEffect {
  stress_healed: number;
  costs: {
    free_time: 1;
    trait_charges: TraitChargeCost[];
  };
}

export interface WorkOnProjectEffect {
  story_id: string;
  entry_text: string;
  costs: { free_time: 1 };
}

export interface NewTraitEffect {
  slot_type: "core_trait" | "role_trait";
  template_id: string | null;
  proposed_name: string | null;
  proposed_description: string | null;
  retire_trait_id: string | null;
  costs: { free_time: 1 };
}

export interface NewBondEffect {
  target_type: GameObjectType;
  target_id: string;
  retire_bond_id: string | null;
  costs: { free_time: 1 };
}

// ── GM Overrides ──────────────────────────────────────────────────

export interface EffectDetails {
  name: string;
  description: string;
  effect_type: MagicEffectType;
  power_level: number;
  charges_current?: number;
  charges_max?: number;
}

export interface RiderEventPayload {
  type: string;
  targets?: EventTarget[];
  changes?: Record<string, ChangeEntry>;
  narrative?: string | null;
  visibility?: VisibilityLevel;
  metadata?: Record<string, unknown> | null;
}

// ── Clock ────────────────────────────────────────────────────────

export interface ClockResponse extends BaseEntity, SoftDeletable {
  name: string;
  segments: number;
  progress: number;
  is_completed: boolean;
  associated_type: GameObjectType | null;
  associated_id: string | null;
  notes: string | null;
}

// ── Group ────────────────────────────────────────────────────────

export interface GroupDetailResponse extends BaseEntity, SoftDeletable {
  name: string;
  tier: number;
  description: string | null;
  notes: string | null;
  bond_distance: number | null;
  traits: CharacterTraitResponse[];
  bonds: BondDisplayResponse[];
  members: Array<{ id: string; name: string; detail_level: DetailLevel }>;
}

// ── Location ─────────────────────────────────────────────────────

export interface LocationDetailResponse extends BaseEntity, SoftDeletable {
  name: string;
  description: string | null;
  parent_id: string | null;
  notes: string | null;
  bond_distance: number | null;
  traits: CharacterTraitResponse[];
  bonds: BondDisplayResponse[];
  presence: Array<{
    tier: number;
    label: string;
    items: Array<{ id: string; name: string; type: GameObjectType }>;
  }>;
}

// ── Story ────────────────────────────────────────────────────────

export interface StoryDetailResponse extends BaseEntity, SoftDeletable {
  name: string;
  summary: string | null;
  status: StoryStatus;
  parent_id: string | null;
  tags: string[];
  visibility_level: VisibilityLevel;
  visibility_overrides: unknown[];
  owners: Array<{ type: GameObjectType; id: string; name: string }>;
  entries: Array<{
    id: string;
    text: string;
    author_id: string;
    character_id: string | null;
    session_id: string | null;
    created_at: string;
  }>;
  has_more_entries: boolean;
  entries_cursor: string | null;
}

// ── Event ────────────────────────────────────────────────────────

export interface EventResponse extends BaseEntity {
  type: string;
  actor_type: ActorType;
  actor_id: string | null;
  actor_name: string | null;
  targets: EventTarget[];
  primary_target_name: string | null;
  primary_target_type: string | null;
  changes: Record<string, ChangeEntry>;
  changes_summary: string | null;
  created_objects: Array<{ type: string; id: string }> | null;
  deleted_objects: Array<{ type: string; id: string }> | null;
  narrative: string | null;
  visibility: VisibilityLevel;
  proposal_id: string | null;
  parent_event_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Feed Item (Discriminated Union) ──────────────────────────────

export type FeedItemResponse =
  | {
      type: "event";
      id: string;
      event_type: string;
      timestamp: string;
      narrative: string | null;
      visibility: VisibilityLevel;
      targets: Array<{
        type: GameObjectType;
        id: string;
        is_primary: boolean;
      }>;
      is_own: boolean;
    }
  | {
      type: "story_entry";
      id: string;
      story_id: string;
      story_name: string;
      text: string;
      timestamp: string;
      author_id: string;
    };

// ── Trait Template ───────────────────────────────────────────────

export interface TraitTemplateResponse extends BaseEntity, SoftDeletable {
  name: string;
  description: string;
  type: TraitTemplateType;
}

// ── Invite ───────────────────────────────────────────────────────

export interface InviteResponse {
  id: string;
  is_consumed: boolean;
  role: "player" | "viewer";
  login_url: string;
  created_at: string;
}

// ── GM Dashboard ──────────────────────────────────────────────────

export interface GmDashboardResponse {
  pending_proposals: number;
  pc_summaries: Array<{
    id: string;
    name: string;
    stress: number;
    free_time: number;
    plot: number;
    gnosis: number;
  }>;
  near_completion_clocks: ClockResponse[];
  stress_proximity: Array<{
    id: string;
    name: string;
    stress: number;
    effective_stress_max: number;
  }>;
}

// ── GM Action Request ─────────────────────────────────────────────

export interface GmActionRequest {
  action_type: GmActionType;
  targets: EventTarget[];
  changes: Record<string, MeterChange | unknown>;
  narrative?: string;
  visibility?: VisibilityLevel;
}

// ── Starred Objects ───────────────────────────────────────────────

export interface StarredObject {
  type: GameObjectType | "story";
  id: string;
  name: string;
}

export interface StarredObjectsResponse {
  items: StarredObject[];
}

// ── Feed Query Filters ────────────────────────────────────────────

export interface FeedFilters {
  type?: "event" | "story_entry";
  target_type?: GameObjectType;
  target_id?: string;
  actor_type?: "player" | "gm" | "system";
  session_id?: string;
  since?: string;
  until?: string;
  after?: string;
  limit?: number;
}
