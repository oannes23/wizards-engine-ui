import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegainGnosisForm } from "./RegainGnosisForm";
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
  free_time: 5,
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
    ],
    past: [],
  },
});

// ── Helpers ────────────────────────────────────────────────────────

function renderForm(onNext = vi.fn()) {
  return render(
    <TestProviders>
      <WizardProvider
        skipDraftRestore
        initialData={{ currentStep: 1, actionType: "regain_gnosis", narrative: "", formData: {} }}
      >
        <RegainGnosisForm character={character} onNext={onNext} />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("RegainGnosisForm", () => {
  describe("rendering", () => {
    it("shows the Free Time cost indicator", () => {
      renderForm();
      expect(screen.getByText("Cost: 1 Free Time")).toBeInTheDocument();
    });

    it("shows remaining FT count", () => {
      renderForm();
      expect(screen.getByText("(5 remaining)")).toBeInTheDocument();
    });

    it("renders the ModifierSelector", () => {
      renderForm();
      expect(screen.getByText("Core Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Role Trait (+1d)")).toBeInTheDocument();
      expect(screen.getByText("Bond (+1d)")).toBeInTheDocument();
    });

    it("renders the narrative textarea", () => {
      renderForm();
      expect(screen.getByLabelText(/Narrative/)).toBeInTheDocument();
    });

    it("renders Back and Next buttons", () => {
      renderForm();
      expect(screen.getByText("Back")).toBeInTheDocument();
      expect(screen.getByText("Next: Review")).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows error when narrative is empty on submit", async () => {
      renderForm();
      fireEvent.click(screen.getByText("Next: Review"));
      expect(await screen.findByText("Narrative is required.")).toBeInTheDocument();
    });

    it("does not show error when narrative is filled", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.change(screen.getByLabelText(/Narrative/), {
        target: { value: "I meditate in my sanctum." },
      });
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(screen.queryByText("Narrative is required.")).not.toBeInTheDocument();
      });
    });
  });

  describe("submission", () => {
    it("calls onNext with modifiers data on valid submit", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.change(screen.getByLabelText(/Narrative/), {
        target: { value: "I meditate in my sanctum." },
      });
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            modifiers: expect.any(Object),
          })
        );
      });
    });

    it("does not call onNext when narrative is empty", async () => {
      const onNext = vi.fn();
      renderForm(onNext);
      fireEvent.click(screen.getByText("Next: Review"));
      await waitFor(() => {
        expect(onNext).not.toHaveBeenCalled();
      });
    });
  });

  describe("modifier integration", () => {
    it("shows core trait options in the modifier selector", () => {
      renderForm();
      const coreSelect = screen.getByLabelText("Core Trait (+1d)") as HTMLSelectElement;
      expect(coreSelect.textContent).toContain("Street Rat");
    });

    it("shows role trait options in the modifier selector", () => {
      renderForm();
      const roleSelect = screen.getByLabelText("Role Trait (+1d)") as HTMLSelectElement;
      expect(roleSelect.textContent).toContain("Blade Dancer");
    });

    it("shows bond options in the modifier selector", () => {
      renderForm();
      const bondSelect = screen.getByLabelText("Bond (+1d)") as HTMLSelectElement;
      expect(bondSelect.textContent).toContain("Sibling");
    });
  });
});
