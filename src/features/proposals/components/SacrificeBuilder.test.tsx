import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SacrificeBuilder, emptySacrificeValue, type SacrificeBuilderValue } from "./SacrificeBuilder";
import { makeCharacter, makeBond, makeTrait } from "@/mocks/fixtures/characters";
import { TestProviders } from "@/mocks/TestProviders";

// ── Fixtures ───────────────────────────────────────────────────────

const character = makeCharacter({
  gnosis: 10,
  stress: 3,
  free_time: 8,
  effective_stress_max: 9,
  magic_stats: {
    being: { level: 2, xp: 3 },
    wyrding: { level: 1, xp: 0 },
    summoning: { level: 0, xp: 0 }, // lowest = 0, ftRate = 3
    enchanting: { level: 1, xp: 4 },
    dreaming: { level: 0, xp: 0 },
  },
  traits: {
    active: [
      makeTrait({ id: "core-1", slot_type: "core_trait", name: "Street Rat", charge: 5 }),
      makeTrait({ id: "role-1", slot_type: "role_trait", name: "Blade Dancer", charge: 3 }),
    ],
    past: [],
  },
  bonds: {
    active: [
      makeBond({ id: "bond-1", target_name: "Sibling", charges: 4 }),
      makeBond({ id: "bond-2", target_name: "Rival", charges: 2 }),
    ],
    past: [],
  },
});

// ── Helpers ────────────────────────────────────────────────────────

function renderBuilder(
  value: SacrificeBuilderValue = emptySacrificeValue(),
  onChange: (v: SacrificeBuilderValue) => void = vi.fn()
) {
  return render(
    <TestProviders>
      <SacrificeBuilder character={character} value={value} onChange={onChange} />
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("SacrificeBuilder", () => {
  describe("rendering", () => {
    it("renders the section heading", () => {
      renderBuilder();
      expect(screen.getByText("Sacrifices")).toBeInTheDocument();
    });

    it("renders gnosis stepper with correct label", () => {
      renderBuilder();
      expect(screen.getByText(/Gnosis/)).toBeInTheDocument();
    });

    it("renders stress stepper", () => {
      renderBuilder();
      expect(screen.getByText(/Stress/)).toBeInTheDocument();
    });

    it("renders FT stepper", () => {
      renderBuilder();
      expect(screen.getByText(/Free Time/)).toBeInTheDocument();
    });

    it("renders bond sacrifice toggles for active bonds", () => {
      renderBuilder();
      expect(screen.getByText("Sibling (Bonded to)")).toBeInTheDocument();
      expect(screen.getByText("Rival (Bonded to)")).toBeInTheDocument();
    });

    it("renders trait sacrifice toggles for active traits", () => {
      renderBuilder();
      expect(screen.getByText("Street Rat")).toBeInTheDocument();
      expect(screen.getByText("Blade Dancer")).toBeInTheDocument();
    });

    it("renders the creative sacrifice link", () => {
      renderBuilder();
      expect(screen.getByText("Add creative sacrifice…")).toBeInTheDocument();
    });

    it("renders running total section", () => {
      renderBuilder();
      expect(screen.getByLabelText("Sacrifice total")).toBeInTheDocument();
    });

    it("shows 0d when no sacrifices selected", () => {
      renderBuilder();
      expect(screen.getByText("0d")).toBeInTheDocument();
    });
  });

  describe("gnosis stepper", () => {
    it("increments gnosis and calls onChange", () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      fireEvent.click(screen.getByLabelText("Increase Gnosis (0/10)"));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ gnosis: 1 }),
        })
      );
    });

    it("decrement is disabled when gnosis is 0", () => {
      renderBuilder();
      expect(screen.getByLabelText("Decrease Gnosis (0/10)")).toBeDisabled();
    });

    it("increment is disabled when gnosis equals maxGnosis", () => {
      const fullGnosis: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, gnosis: 10 },
      };
      renderBuilder(fullGnosis);
      expect(screen.getByLabelText("Increase Gnosis (10/10)")).toBeDisabled();
    });
  });

  describe("stress stepper", () => {
    it("increments stress and calls onChange", () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      // available stress cap = effective_stress_max - current_stress = 9 - 3 = 6
      fireEvent.click(screen.getByLabelText(/Increase Stress/));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ stress: 1 }),
        })
      );
    });
  });

  describe("FT stepper", () => {
    it("increments free time and calls onChange", () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      fireEvent.click(screen.getByLabelText(/Increase Free Time/));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ freeTime: 1 }),
        })
      );
    });
  });

  describe("bond sacrifice toggle", () => {
    it("shows Sacrifice button for unselected bonds", () => {
      renderBuilder();
      const sacrificeButtons = screen.getAllByText("Sacrifice");
      expect(sacrificeButtons.length).toBeGreaterThan(0);
    });

    it("opens confirmation modal when bond sacrifice button is clicked", async () => {
      renderBuilder();
      // Click first "Sacrifice" button (bond section comes before trait section)
      const siblingToggle = screen.getByLabelText("Sacrifice Sibling (Bonded to)");
      fireEvent.click(siblingToggle);
      expect(
        await screen.findByText(/This bond will be permanently retired/)
      ).toBeInTheDocument();
    });

    it("adds bond to sacrifice when confirmed", async () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      const siblingToggle = screen.getByLabelText("Sacrifice Sibling (Bonded to)");
      fireEvent.click(siblingToggle);
      // Wait for modal
      await screen.findByText(/This bond will be permanently retired/);
      // Click confirm in the modal
      fireEvent.click(screen.getByText("Sacrifice", { selector: "[class*='bg-meter-stress']" }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ bondIds: ["bond-1"] }),
        })
      );
    });

    it("cancels without adding bond when Cancel is clicked", async () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      const siblingToggle = screen.getByLabelText("Sacrifice Sibling (Bonded to)");
      fireEvent.click(siblingToggle);
      await screen.findByText(/This bond will be permanently retired/);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("shows Undo button for selected bonds", () => {
      const withBond: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, bondIds: ["bond-1"] },
      };
      renderBuilder(withBond);
      expect(screen.getByLabelText("Remove Sibling (Bonded to)")).toBeInTheDocument();
    });

    it("removes bond from sacrifice when Undo is clicked", () => {
      const onChange = vi.fn();
      const withBond: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, bondIds: ["bond-1"] },
      };
      renderBuilder(withBond, onChange);
      fireEvent.click(screen.getByLabelText("Remove Sibling (Bonded to)"));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ bondIds: [] }),
        })
      );
    });
  });

  describe("running total", () => {
    it("shows correct equiv for 3 gnosis (3 equiv)", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, gnosis: 3 },
      };
      renderBuilder(val);
      expect(screen.getByText("3 equiv")).toBeInTheDocument();
    });

    it("shows 1d for 1 gnosis (1 equiv = 1 die)", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, gnosis: 1 },
      };
      renderBuilder(val);
      expect(screen.getByText("1d")).toBeInTheDocument();
    });

    it("shows 2d for 3 gnosis (3 equiv = 2 dice)", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, gnosis: 3 },
      };
      renderBuilder(val);
      expect(screen.getByText("2d")).toBeInTheDocument();
    });

    it("shows 4d for 10 equiv (bond=10)", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, bondIds: ["bond-1"] },
      };
      renderBuilder(val);
      // bond sacrifice = 10 equiv → 4 dice
      expect(screen.getByText("4d")).toBeInTheDocument();
    });

    it("shows correct equiv text for stress sacrifice", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, stress: 2 },
      };
      renderBuilder(val);
      // 2 stress = 4 equiv
      expect(screen.getByText("4 equiv")).toBeInTheDocument();
    });
  });

  describe("creative sacrifice", () => {
    it("hides textarea by default", () => {
      renderBuilder();
      expect(screen.queryByLabelText("Creative sacrifice description")).not.toBeInTheDocument();
    });

    it("shows textarea after clicking the link", () => {
      renderBuilder();
      fireEvent.click(screen.getByText("Add creative sacrifice…"));
      expect(screen.getByLabelText("Creative sacrifice description")).toBeInTheDocument();
    });

    it("removes creative sacrifice when Remove is clicked", () => {
      const val: SacrificeBuilderValue = {
        amounts: { ...emptySacrificeValue().amounts, hasCreative: true },
      };
      const onChange = vi.fn();
      renderBuilder(val, onChange);
      fireEvent.click(screen.getByText("Remove"));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amounts: expect.objectContaining({ hasCreative: false }),
        })
      );
    });

    it("calls onChange with updated description", () => {
      const onChange = vi.fn();
      renderBuilder(emptySacrificeValue(), onChange);
      fireEvent.click(screen.getByText("Add creative sacrifice…"));
      const textarea = screen.getByLabelText("Creative sacrifice description");
      fireEvent.change(textarea, { target: { value: "A rare artifact" } });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ creativeDescription: "A rare artifact" })
      );
    });
  });
});
