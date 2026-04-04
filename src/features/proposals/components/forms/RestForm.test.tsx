import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RestForm } from "./RestForm";
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
  free_time: 3,
  stress: 5,
  traits: {
    active: [
      makeTrait({ id: "core-1", slot_type: "core_trait", name: "Iron Will", charge: 4 }),
    ],
    past: [],
  },
  bonds: {
    active: [
      makeBond({ id: "bond-1", target_name: "Old Friend", charges: 3 }),
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
        initialData={{ currentStep: 1, actionType: "rest", narrative: "", formData: {} }}
      >
        <RestForm character={character} onNext={onNext} />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("RestForm", () => {
  describe("rendering", () => {
    it("shows the Free Time cost indicator", () => {
      renderForm();
      expect(screen.getByText("Cost: 1 Free Time")).toBeInTheDocument();
    });

    it("shows remaining FT count", () => {
      renderForm();
      expect(screen.getByText("(3 remaining)")).toBeInTheDocument();
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

    it("renders Back and Next: Review buttons", () => {
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

    it("clears error after filling narrative", async () => {
      renderForm();
      // Submit with empty narrative
      fireEvent.click(screen.getByText("Next: Review"));
      await screen.findByText("Narrative is required.");

      // Fill in narrative
      fireEvent.change(screen.getByLabelText(/Narrative/), {
        target: { value: "I spent the evening resting." },
      });
      fireEvent.click(screen.getByText("Next: Review"));

      await waitFor(() => {
        expect(screen.queryByText("Narrative is required.")).not.toBeInTheDocument();
      });
    });
  });

  describe("submission", () => {
    it("calls onNext with modifiers when valid", async () => {
      const onNext = vi.fn();
      renderForm(onNext);

      fireEvent.change(screen.getByLabelText(/Narrative/), {
        target: { value: "I rest by the fire." },
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

    it("includes selected modifier in onNext payload", async () => {
      const onNext = vi.fn();
      renderForm(onNext);

      // Select a core trait modifier
      fireEvent.change(screen.getByLabelText("Core Trait (+1d)"), {
        target: { value: "core-1" },
      });

      fireEvent.change(screen.getByLabelText(/Narrative/), {
        target: { value: "I rest deeply." },
      });
      fireEvent.click(screen.getByText("Next: Review"));

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            modifiers: expect.objectContaining({
              core_trait_id: "core-1",
            }),
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

  describe("accessibility", () => {
    it("narrative textarea has aria-required", () => {
      renderForm();
      const textarea = screen.getByLabelText(/Narrative/);
      expect(textarea).toHaveAttribute("aria-required", "true");
    });

    it("error message has role alert", async () => {
      renderForm();
      fireEvent.click(screen.getByText("Next: Review"));
      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });
});
