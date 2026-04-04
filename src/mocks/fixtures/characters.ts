import type {
  CharacterDetailResponse,
  CharacterTraitResponse,
  BondDisplayResponse,
  MagicEffectResponse,
} from "@/lib/api/types";

/**
 * Factory for CharacterTraitResponse test fixtures.
 */
export function makeTrait(
  overrides?: Partial<CharacterTraitResponse>
): CharacterTraitResponse {
  return {
    id: "01TRAIT_DEFAULT000000000",
    slot_type: "core_trait",
    name: "Street Rat",
    description: "Grew up on the streets",
    charge: 5,
    is_active: true,
    template_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Factory for BondDisplayResponse test fixtures.
 */
export function makeBond(
  overrides?: Partial<BondDisplayResponse>
): BondDisplayResponse {
  return {
    id: "01BOND_DEFAULT000000000",
    slot_type: "pc_bond",
    target_type: "character",
    target_id: "01CHAR_TARGET0000000000",
    target_name: "Sibling",
    label: "Bonded to",
    description: null,
    is_active: true,
    bidirectional: false,
    charges: 5,
    degradations: 0,
    is_trauma: false,
    effective_charges_max: 5,
    ...overrides,
  };
}

/**
 * Factory for MagicEffectResponse test fixtures.
 */
export function makeMagicEffect(
  overrides?: Partial<MagicEffectResponse>
): MagicEffectResponse {
  return {
    id: "01EFFECT_DEFAULT00000000",
    name: "Shadow Sight",
    effect_type: "permanent",
    charges_current: null,
    charges_max: null,
    power_level: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Factory for a full CharacterDetailResponse (PC character).
 */
export function makeCharacter(
  overrides?: Partial<CharacterDetailResponse>
): CharacterDetailResponse {
  return {
    id: "01CHAR_DEFAULT0000000000",
    name: "Kael",
    detail_level: "full",
    description: "A cunning rogue",
    notes: null,
    attributes: null,
    bond_distance: 0,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",

    // Meters
    stress: 3,
    free_time: 8,
    plot: 2,
    gnosis: 10,
    effective_stress_max: 9,

    // Bonds
    bonds: {
      active: [makeBond()],
      past: [],
    },

    // Locations
    locations: {
      common: [],
      familiar: [],
      known: [],
    },

    // Skills
    skills: {
      awareness: 2,
      composure: 1,
      influence: 0,
      finesse: 3,
      speed: 2,
      power: 0,
      knowledge: 1,
      technology: 0,
    },

    // Magic stats
    magic_stats: {
      being: { level: 2, xp: 3 },
      wyrding: { level: 1, xp: 0 },
      summoning: { level: 0, xp: 0 },
      enchanting: { level: 1, xp: 4 },
      dreaming: { level: 0, xp: 0 },
    },

    // Traits
    traits: {
      active: [
        makeTrait({ slot_type: "core_trait", name: "Street Rat" }),
        makeTrait({
          id: "01TRAIT_ROLE0000000000",
          slot_type: "role_trait",
          name: "Blade Dancer",
          charge: 3,
        }),
      ],
      past: [],
    },

    // Magic effects
    magic_effects: {
      active: [makeMagicEffect()],
      past: [],
    },

    session_ids: [],
    active_magic_effects_count: 1,
    active_trait_count: 2,
    active_bond_count: 1,
    last_session_time_now: null,

    ...overrides,
  };
}

/** A simplified (NPC) character */
export function makeNpcCharacter(
  overrides?: Partial<CharacterDetailResponse>
): CharacterDetailResponse {
  return {
    id: "01NPC_DEFAULT00000000000",
    name: "Merchant",
    detail_level: "simplified",
    description: "A traveling merchant",
    notes: null,
    attributes: { wealth: "wealthy", disposition: "friendly" },
    bond_distance: 2,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",

    // NPC fields (null)
    stress: null,
    free_time: null,
    plot: null,
    gnosis: null,
    effective_stress_max: null,
    skills: null,
    magic_stats: null,
    traits: null,
    magic_effects: null,
    session_ids: null,
    active_magic_effects_count: null,
    active_trait_count: null,
    active_bond_count: null,
    last_session_time_now: null,

    bonds: { active: [], past: [] },
    locations: { common: [], familiar: [], known: [] },

    ...overrides,
  };
}
