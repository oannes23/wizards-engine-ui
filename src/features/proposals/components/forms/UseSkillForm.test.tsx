import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UseSkillForm } from "./UseSkillForm";
import { WizardProvider } from "../WizardProvider";
import { TestProviders } from "@/mocks/TestProviders";
import { makeCharacter, makeTrait, makeBond } from "@/mocks/fixtures/characters";

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
}));

// ── Fixtures ───────────────────────────────────────────────────────

const character = makeCharacter({
  plot: 3,
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
  traits: {
    active: [
      makeTrait({ id: "core-1", slot_type: "core_trait", name: "Street Rat", charge: 5 }),
      makeTrait({ id: "role-1", slot_type: "role_trait", name: "Blade Dancer", charge: 3 }),
    ],
    past: [],
  },
  bonds: {
    active: [makeBond({ id: "bond-1", target_name: "Sibling", charges: 4 })],
    past: [],
  },
});

// ── Helpers ────────────────────────────────────────────────────────

function renderForm(onNext = vi.fn()) {
  return render(
    <TestProviders>
      <WizardProvider
        skipDraftRestore
        initialData={{ currentStep: 1, actionType: "use_skill", narrative: "", formData: {} }}
      >
        <UseSkillForm character={character} onNext={onNext} />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("UseSkillForm", () => {
  describe("rendering", () => {
    it("renders the skill selector with label", () => {
      renderForm();
      expect(screen.getByLabelText(/Skill/)).toBeInTheDocument();
    });

    it("renders all 8 skills as options", () => {
      renderForm();
      const select = screen.getByLabelText(/Skill/) as HTMLSelectElement;
      const optionTexts = Array.from(select.options).map((o) => o.text);
      expect(optionTexts.some((t) => t.includes("Awareness"))).toBe(true);
      expect(optionTexts.some((t) => t.includes("Finesse"))).toBe(true);
      expect(optionTexts.some((t) => t.includes("Technology"))).toBe(true);
    });

    it("shows skill levels in the option text", () => {
      renderForm();
      const select = screen.getByLabelText(/Skill/) as HTMLSelectElement;
      const finesseOption = Array.from(select.options).find((o) =>
        o.text.includes("Finesse")
      );
      expect(finesseOption?.text).toContain("Level 3");
    });

    it("renders the plot spend controls when plot > 0", () => {
      renderForm();
      expect(screen.getByText("Plot Spend")).toBeInTheDocument();
      expect(screen.getByLabelText("Decrease plot spend")).toBeInTheDocument();
      expect(screen.getByLabelText("Increase plot spend")).toBeInTheDocument();
    });

    it("renders the ModifierSelector", () => {
      renderForm();
      expect(screen.getByText("Core Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Role Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Bond (+1d)")).toBeInTheDocument();
    });

    it("renders the optional narrative textarea", () => {
      renderForm();
      expect(screen.getByLabelText(/Narrative/)).toBeInTheDocument();
      expect(screen.getByText("(optional)")).toBeInTheDocument();
    });

    it("renders Back and Next buttons", () => {
      renderForm();
      expect(screen.getByText("Back")).toBeInTheDocument();
      expect(screen.getByText("Next: Review")).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows error when skill is not selected on submit", async () => {
      renderForm();
      fireEvent.click(screen.getByText("Next: Review"));
      expect(await screen.findByText("Please select a skill.")).toBeInTheDocument();
    });

    it("does not show error when skill is selected", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.change(screen.getByLabelText(/Skill/), {
        target: { value: "finesse" },
      });
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(screen.queryByText("Please select a skill.")).not.toBeInTheDocument();
      });
    });
  });

  describe("dice pool preview", () => {
    it("shows dice pool preview when a skill is selected", async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/Skill/), {
        target: { value: "finesse" },
      });
      // finesse level 3 → 3d
      expect(await screen.findByLabelText("Dice pool preview")).toBeInTheDocument();
    });

    it("does not show dice pool preview before a skill is selected", () => {
      renderForm();
      expect(screen.queryByLabelText("Dice pool preview")).not.toBeInTheDocument();
    });

    it("shows correct base dice from skill level", async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/Skill/), {
        target: { value: "awareness" }, // level 2
      });
      // Wait for dice pool preview to appear
      const preview = await screen.findByLabelText("Dice pool preview");
      // The preview should show 2d (skill level 2, no modifiers)
      expect(preview.textContent).toMatch(/2d/);
    });
  });

  describe("plot spend", () => {
    it("starts at 0 plot spend", () => {
      renderForm();
      expect(screen.getByLabelText("Plot spend amount")).toHaveTextContent("0");
    });

    it("increments plot spend when + is clicked", () => {
      renderForm();
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      expect(screen.getByLabelText("Plot spend amount")).toHaveTextContent("1");
    });

    it("does not exceed max plot when incrementing", () => {
      renderForm();
      // Max plot is 3
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByLabelText("Increase plot spend")); // would be 4 — should be capped
      expect(screen.getByLabelText("Plot spend amount")).toHaveTextContent("3");
    });

    it("decrements plot spend when − is clicked", () => {
      renderForm();
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByLabelText("Decrease plot spend"));
      expect(screen.getByLabelText("Plot spend amount")).toHaveTextContent("0");
    });
  });

  describe("submission", () => {
    it("calls onNext with skill, modifiers, and plot_spend on valid submit", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.change(screen.getByLabelText(/Skill/), {
        target: { value: "finesse" },
      });
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            skill: "finesse",
            modifiers: expect.any(Object),
            plot_spend: 0,
          })
        );
      });
    });

    it("does not call onNext when skill is not selected", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(onNext).not.toHaveBeenCalled();
      });
    });

    it("includes plot_spend in submission data", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.change(screen.getByLabelText(/Skill/), {
        target: { value: "speed" },
      });
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByLabelText("Increase plot spend"));
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({ plot_spend: 2 })
        );
      });
    });
  });
});
