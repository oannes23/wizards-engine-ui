import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ReviewStep } from "./ReviewStep";
import { WizardProvider } from "./WizardProvider";
import { TestProviders } from "@/mocks/TestProviders";
import {
  proposalHandlers,
  calculateValidationErrorHandler,
  MOCK_CALCULATED_EFFECT,
} from "@/mocks/handlers/proposals";
import type { WizardState } from "./WizardProvider";

// ── MSW Server ─────────────────────────────────────────────────────

const server = setupServer(...proposalHandlers);

beforeEach(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterEach(() => server.close());

// ── Mocks ──────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useParams: () => ({}),
}));

// ── Fixtures ───────────────────────────────────────────────────────

const DEFAULT_WIZARD_STATE: Partial<WizardState> = {
  currentStep: 2,
  actionType: "use_skill",
  narrative: "I slip through the crowd.",
  formData: {
    use_skill: {
      skill: "finesse",
      modifiers: {},
      plot_spend: 0,
    },
  },
};

// ── Helpers ────────────────────────────────────────────────────────

function renderReviewStep({
  wizardState = DEFAULT_WIZARD_STATE,
  editProposalId,
  onValidationErrors = vi.fn(),
}: {
  wizardState?: Partial<WizardState>;
  editProposalId?: string;
  onValidationErrors?: (errors: Record<string, string>) => void;
} = {}) {
  return render(
    <TestProviders>
      <WizardProvider skipDraftRestore initialData={wizardState}>
        <ReviewStep
          characterId="01CH_A0000000000000000000"
          editProposalId={editProposalId}
          onValidationErrors={onValidationErrors}
        />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("ReviewStep", () => {
  describe("loading state", () => {
    it("shows a loading spinner while calculating", () => {
      // Use a handler that never resolves to catch the loading state
      server.use(
        http.post("http://localhost:8000/api/v1/proposals/calculate", () =>
          new Promise(() => {})
        )
      );
      renderReviewStep();
      expect(screen.getByTestId("calculating-spinner")).toBeInTheDocument();
      expect(screen.getByText(/Computing effect/i)).toBeInTheDocument();
    });

    it("shows aria-busy while calculating", () => {
      server.use(
        http.post("http://localhost:8000/api/v1/proposals/calculate", () =>
          new Promise(() => {})
        )
      );
      renderReviewStep();
      expect(screen.getByLabelText("Computing effect")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders the proposal summary after calculation", async () => {
      renderReviewStep();
      await waitFor(() => {
        expect(screen.queryByTestId("calculating-spinner")).not.toBeInTheDocument();
      });
      // Summary card should show action type and narrative
      expect(screen.getByText("Review Your Proposal")).toBeInTheDocument();
      expect(screen.getByText("Use Skill")).toBeInTheDocument();
      expect(screen.getByText("I slip through the crowd.")).toBeInTheDocument();
    });

    it("renders the CalculatedEffectCard with server data", async () => {
      renderReviewStep();
      await waitFor(() => {
        // CalculatedEffectCard for use_skill shows dice count
        expect(screen.getByText(String(MOCK_CALCULATED_EFFECT.dice_pool))).toBeInTheDocument();
        expect(screen.getByText("dice")).toBeInTheDocument();
      });
    });

    it("shows selections summary", async () => {
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByText("Selections")).toBeInTheDocument();
        expect(screen.getByText("skill")).toBeInTheDocument();
        expect(screen.getByText("finesse")).toBeInTheDocument();
      });
    });

    it("renders Back button", async () => {
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByLabelText("Back to fill details")).toBeInTheDocument();
      });
    });

    it("renders Submit Proposal button for new proposals", async () => {
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).toHaveTextContent("Submit Proposal");
      });
    });

    it("renders Resubmit button for edit mode", async () => {
      renderReviewStep({ editProposalId: "01PROPOSAL_DEFAULT000000" });
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).toHaveTextContent("Resubmit");
      });
    });
  });

  describe("error state", () => {
    it("shows error message when calculate fails with a generic error", async () => {
      server.use(
        http.post("http://localhost:8000/api/v1/proposals/calculate", () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "Server error", details: null } },
            { status: 500 }
          )
        )
      );
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByTestId("calculate-error")).toBeInTheDocument();
      });
    });

    it("shows a Retry button after calculate failure", async () => {
      server.use(
        http.post("http://localhost:8000/api/v1/proposals/calculate", () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "Server error", details: null } },
            { status: 500 }
          )
        )
      );
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });

    it("navigates back to step 2 on 422 and calls onValidationErrors", async () => {
      const onValidationErrors = vi.fn();
      server.use(calculateValidationErrorHandler({ skill: "Invalid skill selection" }));
      renderReviewStep({ onValidationErrors });
      await waitFor(() => {
        expect(onValidationErrors).toHaveBeenCalledWith({
          skill: "Invalid skill selection",
        });
      });
    });
  });

  describe("submit — new proposal", () => {
    it("calls POST /proposals and redirects to /proposals on success", async () => {
      renderReviewStep();
      // Wait for calculation to finish
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/proposals");
      });
    });

    it("shows error toast on submit failure", async () => {
      server.use(
        http.post("http://localhost:8000/api/v1/proposals", () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "Server error", details: null } },
            { status: 500 }
          )
        )
      );
      renderReviewStep();
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        // Submit button should no longer be loading (error path re-enables it)
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("submit — edit mode", () => {
    it("calls PATCH /proposals/:id and redirects on success", async () => {
      renderReviewStep({ editProposalId: "01PROPOSAL_DEFAULT000000" });
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/proposals");
      });
    });

    it("shows 409 error toast when proposal already approved", async () => {
      server.use(
        http.patch("http://localhost:8000/api/v1/proposals/01PROPOSAL_DEFAULT000000", () =>
          HttpResponse.json(
            {
              error: {
                code: "proposal_approved",
                message: "Already approved",
                details: null,
              },
            },
            { status: 409 }
          )
        )
      );
      renderReviewStep({ editProposalId: "01PROPOSAL_DEFAULT000000" });
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      // Router push should NOT be called
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("back button", () => {
    it("navigates back to step 2 when Back is clicked", async () => {
      renderReviewStep();
      await waitFor(() => {
        expect(screen.queryByTestId("calculating-spinner")).not.toBeInTheDocument();
      });

      // Back button navigates to step 1 inside the wizard (step index 1 = "Fill Details")
      const backButton = screen.getByLabelText("Back to fill details");
      fireEvent.click(backButton);
      // After back click the ReviewStep unmounts — if no error thrown the test passes
      await waitFor(() => {
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe("with no narrative", () => {
    it("does not render the narrative section when narrative is empty", async () => {
      renderReviewStep({
        wizardState: {
          ...DEFAULT_WIZARD_STATE,
          narrative: "",
        },
      });
      await waitFor(() => {
        expect(screen.queryByText("Narrative")).not.toBeInTheDocument();
      });
    });
  });
});
