/**
 * Character feature — local types and helpers.
 *
 * Domain response shapes live in src/lib/api/types.ts.
 * This file holds UI-specific types, constants, and computed helpers.
 */

import type {
  CharacterDetailResponse,
  CharacterTraitResponse,
  BondDisplayResponse,
  SkillName,
  MagicStatName,
} from "@/lib/api/types";
import { GAME_CONSTANTS } from "@/lib/constants";

// ── Computed helpers ──────────────────────────────────────────────

/** True when the character's stress has hit the effective max. */
export function isAtStressCap(character: CharacterDetailResponse): boolean {
  if (character.stress === null || character.effective_stress_max === null) {
    return false;
  }
  return character.stress >= character.effective_stress_max;
}

/** Effective max charges for a PC bond: 5 − degradation_count */
export function effectiveBondMax(bond: BondDisplayResponse): number {
  if (bond.effective_charges_max !== null) return bond.effective_charges_max;
  const degradations = bond.degradations ?? 0;
  return GAME_CONSTANTS.CHARGE_MAX - degradations;
}

/** True when a trait can be recharged (has less than 5 charges) */
export function canRechargeTrait(
  trait: CharacterTraitResponse,
  freeTime: number
): boolean {
  return freeTime >= 1 && trait.charge < GAME_CONSTANTS.CHARGE_MAX;
}

/** True when a bond can be maintained (charges below effective max) */
export function canMaintainBond(
  bond: BondDisplayResponse,
  freeTime: number
): boolean {
  if (bond.is_trauma) return false;
  const max = effectiveBondMax(bond);
  return freeTime >= 1 && (bond.charges ?? 0) < max;
}

// ── Tab IDs ───────────────────────────────────────────────────────

export type CharacterTabId =
  | "overview"
  | "traits"
  | "bonds"
  | "magic"
  | "skills"
  | "feed";

export const CHARACTER_TABS: Array<{ id: CharacterTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "traits", label: "Traits" },
  { id: "bonds", label: "Bonds" },
  { id: "magic", label: "Magic" },
  { id: "skills", label: "Skills & Stats" },
  { id: "feed", label: "Feed" },
];

// ── Skill display order ───────────────────────────────────────────

export const SKILL_DISPLAY_ORDER: SkillName[] = [
  "awareness",
  "composure",
  "influence",
  "finesse",
  "speed",
  "power",
  "knowledge",
  "technology",
];

export const SKILL_LABELS: Record<SkillName, string> = {
  awareness: "Awareness",
  composure: "Composure",
  influence: "Influence",
  finesse: "Finesse",
  speed: "Speed",
  power: "Power",
  knowledge: "Knowledge",
  technology: "Technology",
};

// ── Magic stat display order ──────────────────────────────────────

export const MAGIC_STAT_DISPLAY_ORDER: MagicStatName[] = [
  "being",
  "wyrding",
  "summoning",
  "enchanting",
  "dreaming",
];

export const MAGIC_STAT_LABELS: Record<MagicStatName, string> = {
  being: "Being",
  wyrding: "Wyrding",
  summoning: "Summoning",
  enchanting: "Enchanting",
  dreaming: "Dreaming",
};
