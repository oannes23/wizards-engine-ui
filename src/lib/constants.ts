// ──────────────────────────────────────────────────────────────────
// Game Constants & Color Definitions
// Source of truth: FRONTEND_SEED.md §6, spec/api/response-shapes.md
// ──────────────────────────────────────────────────────────────────

/**
 * Numeric game constants.
 * SCREAMING_SNAKE_CASE matching FRONTEND_SEED.md names.
 */
export const GAME_CONSTANTS = {
  STRESS_MAX: 9,
  FREE_TIME_MAX: 20,
  PLOT_MAX: 5,
  GNOSIS_MAX: 23,
  PC_BOND_LIMIT: 8,
  NPC_BOND_LIMIT: 7,
  CORE_TRAIT_LIMIT: 2,
  ROLE_TRAIT_LIMIT: 3,
  GROUP_TRAIT_LIMIT: 10,
  GROUP_RELATION_LIMIT: 7,
  FEATURE_TRAIT_LIMIT: 5,
  CHARGE_MAX: 5,
  MAX_ACTIVE_EFFECTS: 9,
  MAGIC_STAT_MAX_LEVEL: 5,
  MAGIC_STAT_XP_PER_LEVEL: 5,
  SKILL_MAX: 3,
} as const;

/**
 * Brand colors from the studio logo.
 */
export const BRAND_COLORS = {
  navy: "#1e1b5e",
  blue: "#2e6eb5",
  teal: "#5bbfc4",
} as const;

/**
 * Meter colors — each meter has a distinct semantic color.
 */
export const METER_COLORS = {
  stress: "#e05545",
  free_time: "#34d399",
  plot: "#f59e0b",
  gnosis: "#a78bfa",
} as const;

/**
 * Meter configuration: name, range, color, and Tailwind class.
 */
export const METER_CONFIG = {
  stress: {
    label: "Stress",
    max: GAME_CONSTANTS.STRESS_MAX,
    color: METER_COLORS.stress,
    tailwindColor: "meter-stress",
  },
  free_time: {
    label: "Free Time",
    max: GAME_CONSTANTS.FREE_TIME_MAX,
    color: METER_COLORS.free_time,
    tailwindColor: "meter-ft",
  },
  plot: {
    label: "Plot",
    max: GAME_CONSTANTS.PLOT_MAX,
    color: METER_COLORS.plot,
    tailwindColor: "meter-plot",
  },
  gnosis: {
    label: "Gnosis",
    max: GAME_CONSTANTS.GNOSIS_MAX,
    color: METER_COLORS.gnosis,
    tailwindColor: "meter-gnosis",
  },
} as const;

/**
 * Canonical skill names and their display labels.
 */
export const SKILLS = [
  "awareness",
  "composure",
  "influence",
  "finesse",
  "speed",
  "power",
  "knowledge",
  "technology",
] as const;

/**
 * Canonical magic stat names and display labels.
 */
export const MAGIC_STATS = [
  "being",
  "wyrding",
  "summoning",
  "enchanting",
  "dreaming",
] as const;

/**
 * Season definitions for time_now display.
 * 6 seasons of 23 time units each.
 * Formula: seasonIndex = floor((timeNow - 1) / 23)
 *          seasonTime  = ((timeNow - 1) % 23) + 1
 * Display: "Time Now 42 (Chaos 19)"
 */
export const SEASONS = [
  "Tutorial",
  "Chaos",
  "Discord",
  "Confusion",
  "Bureaucracy",
  "Aftermath",
] as const;

export const SEASON_LENGTH = 23;

/**
 * Polling interval defaults (in milliseconds).
 */
export const POLLING_INTERVALS = {
  /** GM queue, proposals list */
  FAST: 10_000,
  /** Character data, GM dashboard */
  NORMAL: 15_000,
  /** Feed, entity feeds */
  SLOW: 20_000,
  /** All intervals during active session */
  ACTIVE_SESSION: 5_000,
} as const;

/**
 * Action type display configuration.
 */
export const ACTION_TYPE_LABELS: Record<string, string> = {
  use_skill: "Use Skill",
  use_magic: "Use Magic",
  charge_magic: "Charge Magic",
  regain_gnosis: "Regain Gnosis",
  work_on_project: "Work on Project",
  rest: "Rest",
  new_trait: "New Trait",
  new_bond: "New Bond",
  resolve_clock: "Resolve Clock",
  resolve_trauma: "Resolve Trauma",
} as const;

/**
 * GM action type display configuration.
 */
export const GM_ACTION_TYPE_LABELS: Record<string, string> = {
  modify_character: "Modify Character",
  modify_group: "Modify Group",
  modify_location: "Modify Location",
  modify_clock: "Modify Clock",
  create_bond: "Create Bond",
  modify_bond: "Modify Bond",
  retire_bond: "Retire Bond",
  create_trait: "Create Trait",
  modify_trait: "Modify Trait",
  retire_trait: "Retire Trait",
  create_effect: "Create Effect",
  modify_effect: "Modify Effect",
  retire_effect: "Retire Effect",
  award_xp: "Award XP",
} as const;
