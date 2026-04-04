/**
 * sacrificeMath.ts — Pure math utilities for the Sacrifice Builder.
 *
 * Spec: spec/domains/magic.md (Sacrifice System)
 *
 * Exchange rates:
 *   Gnosis:   1 Gnosis = 1 equiv
 *   Stress:   1 Stress = 2 equiv
 *   FT:       1 FT     = (3 + lowest_magic_stat_level) equiv
 *   Bond:     flat 10 equiv (permanent retirement)
 *   Trait:    flat 10 equiv (permanent retirement)
 *   Other:    0 equiv (GM-assigned on approval)
 *
 * Tiered dice conversion (diminishing returns):
 *   N dice costs N*(N+1)/2 total equiv
 *   1d=1, 2d=3, 3d=6, 4d=10, 5d=15
 */

import type { MagicStatName } from "@/lib/api/types";

// ── Constants ──────────────────────────────────────────────────────

export const BOND_SACRIFICE_EQUIV = 10;
export const TRAIT_SACRIFICE_EQUIV = 10;
export const GNOSIS_RATE = 1; // 1 gnosis = 1 equiv

// ── Exchange rate helpers ──────────────────────────────────────────

/**
 * Compute the stress-to-equiv exchange rate (always 2).
 */
export function stressRate(): number {
  return 2;
}

/**
 * Compute the Free Time to gnosis-equiv exchange rate.
 * Rate = 3 + lowest_magic_stat_level
 */
export function ftRate(
  magicStats: Record<MagicStatName, { level: number; xp: number }> | null
): number {
  if (!magicStats) return 3; // fallback when no magic stats available
  const levels = Object.values(magicStats).map((s) => s.level);
  const lowest = Math.min(...levels);
  return 3 + lowest;
}

// ── Tiered dice conversion ─────────────────────────────────────────

/**
 * Cost to buy exactly N dice: N*(N+1)/2 total equiv.
 * This is the cumulative cost from 0 to N dice.
 */
export function diceToEquiv(dice: number): number {
  if (dice <= 0) return 0;
  return (dice * (dice + 1)) / 2;
}

/**
 * Maximum dice purchasable from the given equiv total.
 * Finds the largest N where N*(N+1)/2 <= equiv.
 */
export function equivToDice(equiv: number): number {
  if (equiv <= 0) return 0;
  // N*(N+1)/2 <= equiv  →  N^2 + N - 2*equiv <= 0
  // Solve: N = floor((-1 + sqrt(1 + 8*equiv)) / 2)
  return Math.floor((-1 + Math.sqrt(1 + 8 * equiv)) / 2);
}

// ── Sacrifice total computation ────────────────────────────────────

export interface SacrificeAmounts {
  gnosis: number;
  stress: number;
  freeTime: number;
  bondIds: string[];
  traitIds: string[];
  hasCreative: boolean;
}

/**
 * Compute the total gnosis-equivalent from all sacrifice sources.
 */
export function computeTotalEquiv(
  amounts: SacrificeAmounts,
  magicStats: Record<MagicStatName, { level: number; xp: number }> | null
): number {
  const gnosisEquiv = amounts.gnosis * GNOSIS_RATE;
  const stressEquiv = amounts.stress * stressRate();
  const ftEquiv = amounts.freeTime * ftRate(magicStats);
  const bondEquiv = amounts.bondIds.length * BOND_SACRIFICE_EQUIV;
  const traitEquiv = amounts.traitIds.length * TRAIT_SACRIFICE_EQUIV;
  return gnosisEquiv + stressEquiv + ftEquiv + bondEquiv + traitEquiv;
  // Creative sacrifice shows 0 equiv until GM approves
}

/**
 * Build the sacrifice[] array for the API payload from SacrificeAmounts.
 */
export function buildSacrificePayload(
  amounts: SacrificeAmounts,
  creativeDescription?: string
): Array<
  | { type: "gnosis"; amount: number }
  | { type: "stress"; amount: number }
  | { type: "free_time"; amount: number }
  | { type: "bond"; target_id: string }
  | { type: "trait"; target_id: string }
  | { type: "other"; description?: string }
> {
  const entries: ReturnType<typeof buildSacrificePayload> = [];
  if (amounts.gnosis > 0) entries.push({ type: "gnosis", amount: amounts.gnosis });
  if (amounts.stress > 0) entries.push({ type: "stress", amount: amounts.stress });
  if (amounts.freeTime > 0) entries.push({ type: "free_time", amount: amounts.freeTime });
  for (const id of amounts.bondIds) entries.push({ type: "bond", target_id: id });
  for (const id of amounts.traitIds) entries.push({ type: "trait", target_id: id });
  if (amounts.hasCreative) {
    entries.push({ type: "other", description: creativeDescription });
  }
  return entries;
}
