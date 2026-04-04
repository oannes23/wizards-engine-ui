import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalculatedEffectCard } from "./CalculatedEffectCard";
import type {
  UseSkillEffect,
  UseMagicEffect,
  RegainGnosisEffect,
  RestEffect,
} from "@/lib/api/types";

describe("CalculatedEffectCard", () => {
  describe("use_skill", () => {
    const effect: UseSkillEffect = {
      dice_pool: 4,
      skill: "finesse",
      skill_level: 3,
      modifiers: [],
      plot_spend: 0,
      costs: { trait_charges: [], plot: 0 },
    };

    it("renders dice pool", () => {
      render(
        <CalculatedEffectCard
          actionType="use_skill"
          calculatedEffect={effect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("dice")).toBeInTheDocument();
    });

    it("renders skill name", () => {
      render(
        <CalculatedEffectCard
          actionType="use_skill"
          calculatedEffect={effect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText(/finesse/i)).toBeInTheDocument();
    });

    it("renders 'No resource costs' when no costs", () => {
      render(
        <CalculatedEffectCard
          actionType="use_skill"
          calculatedEffect={effect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText(/no resource costs/i)).toBeInTheDocument();
    });

    it("renders plot cost when plot > 0", () => {
      const withPlot: UseSkillEffect = {
        ...effect,
        plot_spend: 2,
        costs: { trait_charges: [], plot: 2 },
      };
      render(
        <CalculatedEffectCard
          actionType="use_skill"
          calculatedEffect={withPlot as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("-2")).toBeInTheDocument();
      expect(screen.getByText("Plot")).toBeInTheDocument();
    });

    it("has aria-label 'Calculated effect'", () => {
      render(
        <CalculatedEffectCard
          actionType="use_skill"
          calculatedEffect={effect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByLabelText("Calculated effect")).toBeInTheDocument();
    });
  });

  describe("use_magic", () => {
    const magicEffect: UseMagicEffect = {
      suggested_stat: "dreaming",
      stat_level: 2,
      dice_pool: 5,
      sacrifice_dice: 2,
      total_gnosis_equivalent: 4,
      sacrifice_details: [],
      modifiers: [],
      plot_spend: 0,
      costs: {
        gnosis: 4,
        stress: 0,
        free_time: 0,
        bond_sacrifices: [],
        trait_sacrifices: [],
        trait_charges: [],
        plot: 0,
      },
    };

    it("renders dice pool for magic", () => {
      render(
        <CalculatedEffectCard
          actionType="use_magic"
          calculatedEffect={magicEffect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders gnosis cost", () => {
      render(
        <CalculatedEffectCard
          actionType="use_magic"
          calculatedEffect={magicEffect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("-4")).toBeInTheDocument();
      expect(screen.getByText("Gnosis")).toBeInTheDocument();
    });
  });

  describe("regain_gnosis", () => {
    const gnosisEffect: RegainGnosisEffect = {
      gnosis_gained: 7,
      costs: { free_time: 1, trait_charges: [] },
    };

    it("renders gnosis gained", () => {
      render(
        <CalculatedEffectCard
          actionType="regain_gnosis"
          calculatedEffect={gnosisEffect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("+7")).toBeInTheDocument();
      expect(screen.getByText("Gnosis")).toBeInTheDocument();
    });

    it("renders free time cost", () => {
      render(
        <CalculatedEffectCard
          actionType="regain_gnosis"
          calculatedEffect={gnosisEffect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("Free Time")).toBeInTheDocument();
      expect(screen.getByText("-1")).toBeInTheDocument();
    });
  });

  describe("rest", () => {
    const restEffect: RestEffect = {
      stress_healed: 4,
      costs: { free_time: 1, trait_charges: [] },
    };

    it("renders stress healed", () => {
      render(
        <CalculatedEffectCard
          actionType="rest"
          calculatedEffect={restEffect as unknown as Record<string, unknown>}
        />
      );
      expect(screen.getByText("-4")).toBeInTheDocument();
      expect(screen.getByText("Stress")).toBeInTheDocument();
    });
  });

  describe("system proposals", () => {
    it("shows fallback message for resolve_clock", () => {
      render(
        <CalculatedEffectCard
          actionType="resolve_clock"
          calculatedEffect={{}}
        />
      );
      expect(
        screen.getByText(/no calculated effect for this action type/i)
      ).toBeInTheDocument();
    });
  });
});
