import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModifierSelector } from "./ModifierSelector";
import { makeTrait, makeBond } from "@/mocks/fixtures/characters";
import type { ModifierSelections } from "./ModifierSelector";

// ── Fixtures ───────────────────────────────────────────────────────

const coreTrait = makeTrait({
  id: "trait-core-1",
  slot_type: "core_trait",
  name: "Street Rat",
  charge: 5,
});

const roleTraitWithCharges = makeTrait({
  id: "trait-role-1",
  slot_type: "role_trait",
  name: "Blade Dancer",
  charge: 3,
});

const roleTraitNoCharges = makeTrait({
  id: "trait-role-2",
  slot_type: "role_trait",
  name: "Exhausted",
  charge: 0,
});

const bond1 = makeBond({
  id: "bond-1",
  target_name: "Sibling",
  charges: 5,
  effective_charges_max: 5,
});

const bond2 = makeBond({
  id: "bond-2",
  target_name: "Rival",
  charges: 2,
  effective_charges_max: 5,
});

const traumaBond = makeBond({
  id: "bond-trauma",
  target_name: "Lost Friend",
  is_trauma: true,
  charges: 0,
});

// ── Helpers ────────────────────────────────────────────────────────

function renderSelector(
  value: ModifierSelections = {},
  onChange: (v: ModifierSelections) => void = vi.fn(),
  baseDice?: number
) {
  return render(
    <ModifierSelector
      traits={[coreTrait, roleTraitWithCharges, roleTraitNoCharges]}
      bonds={[bond1, bond2, traumaBond]}
      value={value}
      onChange={onChange}
      baseDice={baseDice}
    />
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("ModifierSelector", () => {
  describe("rendering", () => {
    it("renders three slot labels", () => {
      renderSelector();
      expect(screen.getByText("Core Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Role Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Bond (+1d)")).toBeInTheDocument();
    });

    it("renders core traits in the core slot", () => {
      renderSelector();
      const select = screen.getByLabelText("Core Trait (+1d)");
      expect(select).toBeInTheDocument();
      expect(select.textContent).toContain("Street Rat");
    });

    it("renders role traits in the role slot", () => {
      renderSelector();
      const select = screen.getByLabelText("Role Trait (+1d)");
      expect(select.textContent).toContain("Blade Dancer");
    });

    it("renders bonds (non-trauma) in the bond slot", () => {
      renderSelector();
      const select = screen.getByLabelText("Bond (+1d)");
      expect(select.textContent).toContain("Sibling");
      expect(select.textContent).toContain("Rival");
    });

    it("does not render trauma bonds as options", () => {
      renderSelector();
      const select = screen.getByLabelText("Bond (+1d)");
      expect(select.textContent).not.toContain("Lost Friend");
    });

    it("shows max modifier hint", () => {
      renderSelector();
      expect(screen.getByText("Max +3d (1 core + 1 role + 1 bond)")).toBeInTheDocument();
    });
  });

  describe("disabled options", () => {
    it("disables role trait with 0 charges", () => {
      renderSelector();
      const roleSelect = screen.getByLabelText("Role Trait (+1d)") as HTMLSelectElement;
      const exhaustedOption = Array.from(roleSelect.options).find((o) =>
        o.text.includes("Exhausted")
      );
      expect(exhaustedOption?.disabled).toBe(true);
    });

    it("does not disable role trait with charges > 0", () => {
      renderSelector();
      const roleSelect = screen.getByLabelText("Role Trait (+1d)") as HTMLSelectElement;
      const bladeDancerOption = Array.from(roleSelect.options).find((o) =>
        o.text.includes("Blade Dancer")
      );
      expect(bladeDancerOption?.disabled).toBe(false);
    });
  });

  describe("onChange", () => {
    it("calls onChange with updated core_trait_id on selection", () => {
      const onChange = vi.fn();
      renderSelector({}, onChange);
      const select = screen.getByLabelText("Core Trait (+1d)");
      fireEvent.change(select, { target: { value: "trait-core-1" } });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ core_trait_id: "trait-core-1" })
      );
    });

    it("calls onChange with undefined core_trait_id when cleared", () => {
      const onChange = vi.fn();
      renderSelector({ core_trait_id: "trait-core-1" }, onChange);
      const select = screen.getByLabelText("Core Trait (+1d)");
      fireEvent.change(select, { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ core_trait_id: undefined })
      );
    });

    it("calls onChange with updated bond_id on selection", () => {
      const onChange = vi.fn();
      renderSelector({}, onChange);
      const select = screen.getByLabelText("Bond (+1d)");
      fireEvent.change(select, { target: { value: "bond-1" } });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ bond_id: "bond-1" })
      );
    });
  });

  describe("dice pool preview", () => {
    it("does not render preview when baseDice is not provided", () => {
      renderSelector();
      expect(screen.queryByLabelText("Dice pool preview")).not.toBeInTheDocument();
    });

    it("renders dice pool preview when baseDice is provided", () => {
      renderSelector({}, vi.fn(), 3);
      expect(screen.getByLabelText("Dice pool preview")).toBeInTheDocument();
    });

    it("shows base dice with no modifiers", () => {
      renderSelector({}, vi.fn(), 3);
      expect(screen.getByText("3d")).toBeInTheDocument();
    });

    it("shows 4d with 3 base + 1 modifier", () => {
      renderSelector({ core_trait_id: "trait-core-1" }, vi.fn(), 3);
      expect(screen.getByText("4d")).toBeInTheDocument();
    });

    it("shows 6d with 3 base + 3 modifiers", () => {
      renderSelector(
        {
          core_trait_id: "trait-core-1",
          role_trait_id: "trait-role-1",
          bond_id: "bond-1",
        },
        vi.fn(),
        3
      );
      expect(screen.getByText("6d")).toBeInTheDocument();
    });

    it("preview has aria-live polite", () => {
      renderSelector({}, vi.fn(), 3);
      const preview = screen.getByLabelText("Dice pool preview");
      expect(preview).toHaveAttribute("aria-live", "polite");
    });
  });
});
