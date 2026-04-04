import { describe, it, expect } from "vitest";
import {
  diceToEquiv,
  equivToDice,
  ftRate,
  stressRate,
  computeTotalEquiv,
  buildSacrificePayload,
  BOND_SACRIFICE_EQUIV,
  TRAIT_SACRIFICE_EQUIV,
  type SacrificeAmounts,
} from "./sacrificeMath";
import type { MagicStatName } from "@/lib/api/types";

// ── Fixtures ───────────────────────────────────────────────────────

const allZeroStats: Record<MagicStatName, { level: number; xp: number }> = {
  being: { level: 0, xp: 0 },
  wyrding: { level: 0, xp: 0 },
  summoning: { level: 0, xp: 0 },
  enchanting: { level: 0, xp: 0 },
  dreaming: { level: 0, xp: 0 },
};

const mixedStats: Record<MagicStatName, { level: number; xp: number }> = {
  being: { level: 2, xp: 3 },
  wyrding: { level: 1, xp: 0 },
  summoning: { level: 0, xp: 0 },   // lowest = 0
  enchanting: { level: 1, xp: 4 },
  dreaming: { level: 3, xp: 1 },
};

const emptyAmounts: SacrificeAmounts = {
  gnosis: 0,
  stress: 0,
  freeTime: 0,
  bondIds: [],
  traitIds: [],
  hasCreative: false,
};

// ── diceToEquiv (tiered cost) ──────────────────────────────────────

describe("diceToEquiv", () => {
  it("returns 0 for 0 dice", () => {
    expect(diceToEquiv(0)).toBe(0);
  });

  it("returns 1 for 1 die", () => {
    expect(diceToEquiv(1)).toBe(1);
  });

  it("returns 3 for 2 dice", () => {
    expect(diceToEquiv(2)).toBe(3);
  });

  it("returns 6 for 3 dice", () => {
    expect(diceToEquiv(3)).toBe(6);
  });

  it("returns 10 for 4 dice", () => {
    expect(diceToEquiv(4)).toBe(10);
  });

  it("returns 15 for 5 dice", () => {
    expect(diceToEquiv(5)).toBe(15);
  });

  it("returns 21 for 6 dice", () => {
    expect(diceToEquiv(6)).toBe(21);
  });

  it("returns 0 for negative input", () => {
    expect(diceToEquiv(-1)).toBe(0);
  });
});

// ── equivToDice (inverse) ──────────────────────────────────────────

describe("equivToDice", () => {
  it("returns 0 for 0 equiv", () => {
    expect(equivToDice(0)).toBe(0);
  });

  it("returns 1 for 1 equiv", () => {
    expect(equivToDice(1)).toBe(1);
  });

  it("returns 1 for 2 equiv (not enough for 2 dice)", () => {
    expect(equivToDice(2)).toBe(1);
  });

  it("returns 2 for 3 equiv", () => {
    expect(equivToDice(3)).toBe(2);
  });

  it("returns 2 for 4 equiv (not enough for 3 dice)", () => {
    expect(equivToDice(4)).toBe(2);
  });

  it("returns 2 for 5 equiv", () => {
    expect(equivToDice(5)).toBe(2);
  });

  it("returns 3 for 6 equiv", () => {
    expect(equivToDice(6)).toBe(3);
  });

  it("returns 4 for 10 equiv", () => {
    expect(equivToDice(10)).toBe(4);
  });

  it("returns 5 for 15 equiv", () => {
    expect(equivToDice(15)).toBe(5);
  });

  it("returns 5 for 14 equiv (not enough for 5 dice)", () => {
    expect(equivToDice(14)).toBe(4);
  });

  it("returns 0 for negative input", () => {
    expect(equivToDice(-1)).toBe(0);
  });

  it("is the inverse of diceToEquiv for small values", () => {
    for (let n = 0; n <= 8; n++) {
      expect(equivToDice(diceToEquiv(n))).toBe(n);
    }
  });
});

// ── Exchange rates ─────────────────────────────────────────────────

describe("stressRate", () => {
  it("returns 2", () => {
    expect(stressRate()).toBe(2);
  });
});

describe("ftRate", () => {
  it("returns 3 when magic stats are null", () => {
    expect(ftRate(null)).toBe(3);
  });

  it("returns 3 when all stats are level 0", () => {
    expect(ftRate(allZeroStats)).toBe(3);
  });

  it("returns 3 + lowest stat level", () => {
    // mixedStats: lowest is summoning=0, so rate = 3+0 = 3
    expect(ftRate(mixedStats)).toBe(3);
  });

  it("returns 3 + 2 when lowest stat is 2", () => {
    const statsAllTwo: Record<MagicStatName, { level: number; xp: number }> = {
      being: { level: 2, xp: 0 },
      wyrding: { level: 3, xp: 0 },
      summoning: { level: 2, xp: 0 },
      enchanting: { level: 4, xp: 0 },
      dreaming: { level: 2, xp: 0 },
    };
    expect(ftRate(statsAllTwo)).toBe(5);
  });

  it("returns 3 + 1 when lowest stat is 1", () => {
    const statsLowestOne: Record<MagicStatName, { level: number; xp: number }> = {
      being: { level: 1, xp: 0 },
      wyrding: { level: 2, xp: 0 },
      summoning: { level: 3, xp: 0 },
      enchanting: { level: 1, xp: 0 },
      dreaming: { level: 5, xp: 0 },
    };
    expect(ftRate(statsLowestOne)).toBe(4);
  });
});

// ── computeTotalEquiv ──────────────────────────────────────────────

describe("computeTotalEquiv", () => {
  it("returns 0 for empty amounts", () => {
    expect(computeTotalEquiv(emptyAmounts, null)).toBe(0);
  });

  it("computes gnosis equiv at 1:1 rate", () => {
    expect(computeTotalEquiv({ ...emptyAmounts, gnosis: 5 }, null)).toBe(5);
  });

  it("computes stress equiv at 1:2 rate", () => {
    expect(computeTotalEquiv({ ...emptyAmounts, stress: 3 }, null)).toBe(6);
  });

  it("computes FT equiv using ftRate with null stats (fallback to 3)", () => {
    expect(computeTotalEquiv({ ...emptyAmounts, freeTime: 2 }, null)).toBe(6); // 2 * 3
  });

  it("computes FT equiv with real stats", () => {
    // allZeroStats: lowest = 0, rate = 3
    expect(computeTotalEquiv({ ...emptyAmounts, freeTime: 4 }, allZeroStats)).toBe(12);
  });

  it("adds 10 equiv per bond sacrifice", () => {
    expect(
      computeTotalEquiv({ ...emptyAmounts, bondIds: ["b1", "b2"] }, null)
    ).toBe(BOND_SACRIFICE_EQUIV * 2);
  });

  it("adds 10 equiv per trait sacrifice", () => {
    expect(
      computeTotalEquiv({ ...emptyAmounts, traitIds: ["t1"] }, null)
    ).toBe(TRAIT_SACRIFICE_EQUIV);
  });

  it("sums all sacrifice sources together", () => {
    const amounts: SacrificeAmounts = {
      gnosis: 3,     // 3 equiv
      stress: 1,     // 2 equiv
      freeTime: 0,
      bondIds: ["b1"], // 10 equiv
      traitIds: [],
      hasCreative: false,
    };
    expect(computeTotalEquiv(amounts, null)).toBe(15); // 3 + 2 + 10
  });

  it("creative sacrifice contributes 0 equiv (GM assigns value)", () => {
    expect(
      computeTotalEquiv({ ...emptyAmounts, hasCreative: true }, null)
    ).toBe(0);
  });
});

// ── buildSacrificePayload ──────────────────────────────────────────

describe("buildSacrificePayload", () => {
  it("returns empty array for zero amounts", () => {
    expect(buildSacrificePayload(emptyAmounts)).toHaveLength(0);
  });

  it("includes gnosis entry when gnosis > 0", () => {
    const payload = buildSacrificePayload({ ...emptyAmounts, gnosis: 3 });
    expect(payload).toContainEqual({ type: "gnosis", amount: 3 });
  });

  it("includes stress entry when stress > 0", () => {
    const payload = buildSacrificePayload({ ...emptyAmounts, stress: 2 });
    expect(payload).toContainEqual({ type: "stress", amount: 2 });
  });

  it("includes free_time entry when freeTime > 0", () => {
    const payload = buildSacrificePayload({ ...emptyAmounts, freeTime: 1 });
    expect(payload).toContainEqual({ type: "free_time", amount: 1 });
  });

  it("includes bond entries for each bond id", () => {
    const payload = buildSacrificePayload({ ...emptyAmounts, bondIds: ["b1", "b2"] });
    expect(payload).toContainEqual({ type: "bond", target_id: "b1" });
    expect(payload).toContainEqual({ type: "bond", target_id: "b2" });
  });

  it("includes trait entries for each trait id", () => {
    const payload = buildSacrificePayload({ ...emptyAmounts, traitIds: ["t1"] });
    expect(payload).toContainEqual({ type: "trait", target_id: "t1" });
  });

  it("does not include gnosis entry when gnosis is 0", () => {
    const payload = buildSacrificePayload(emptyAmounts);
    expect(payload.some((e) => e.type === "gnosis")).toBe(false);
  });

  it("includes other entry with description when hasCreative is true", () => {
    const payload = buildSacrificePayload(
      { ...emptyAmounts, hasCreative: true },
      "My special creative sacrifice"
    );
    expect(payload).toContainEqual({
      type: "other",
      description: "My special creative sacrifice",
    });
  });

  it("does not include other entry when hasCreative is false", () => {
    const payload = buildSacrificePayload(emptyAmounts);
    expect(payload.some((e) => e.type === "other")).toBe(false);
  });
});
