import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { characterHandlers } from "@/mocks/handlers/characters";
import {
  proposalHandlers,
  REJECTED_PROPOSAL_ID,
} from "@/mocks/handlers/proposals";
import { authHandlers } from "@/mocks/handlers/auth";
import { feedHandlers } from "@/mocks/handlers/feeds";
import { TestProviders } from "@/mocks/TestProviders";
import ProposalEditPage from "./page";
import {
  makeRejectedProposal,
  makeApprovedProposal,
  makeProposal,
} from "@/mocks/fixtures/proposals";

// ── Mocks ──────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useParams: () => ({ id: REJECTED_PROPOSAL_ID }),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "01PL_A0000000000000000000",
      display_name: "Alice",
      role: "player",
      character_id: "01CH_A0000000000000000000",
    },
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
    characterId: "01CH_A0000000000000000000",
    logout: vi.fn(),
  }),
}));

// ── MSW Server ─────────────────────────────────────────────────────

const server = setupServer(
  ...authHandlers,
  ...feedHandlers,
  ...characterHandlers,
  ...proposalHandlers
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: "error" });
  vi.clearAllMocks();
});
afterEach(() => server.resetHandlers());
afterEach(() => server.close());

// ── Helpers ────────────────────────────────────────────────────────

function renderEditPage() {
  return render(
    <TestProviders>
      <ProposalEditPage />
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("ProposalEditPage", () => {
  describe("loading state", () => {
    it("shows loading skeleton while fetching proposal", () => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () => new Promise(() => {})
        )
      );
      renderEditPage();
      expect(screen.getByLabelText("Loading proposal")).toBeInTheDocument();
    });
  });

  describe("rejected proposal — revise flow", () => {
    beforeEach(() => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () =>
            HttpResponse.json(
              makeRejectedProposal({
                id: REJECTED_PROPOSAL_ID,
                action_type: "use_skill",
                gm_notes: "This is out of scope.",
                selections: {
                  skill: "finesse",
                  modifiers: {},
                  plot_spend: 0,
                },
              })
            )
        )
      );
    });

    it("shows 'Revise Proposal' heading", async () => {
      renderEditPage();
      await waitFor(() => {
        expect(screen.getByText("Revise Proposal")).toBeInTheDocument();
      });
    });

    it("shows the rejection note banner", async () => {
      renderEditPage();
      await waitFor(() => {
        expect(screen.getByTestId("rejection-note-banner")).toBeInTheDocument();
        expect(screen.getByText("This is out of scope.")).toBeInTheDocument();
      });
    });

    it("pre-fills the form — UseSkillForm renders for use_skill", async () => {
      renderEditPage();
      await waitFor(() => {
        // UseSkillForm renders a "Skill" label
        expect(screen.getByText("Skill")).toBeInTheDocument();
      });
    });

    it("shows 2-step step indicator for edit mode", async () => {
      renderEditPage();
      await waitFor(() => {
        expect(screen.getByText("Edit Details")).toBeInTheDocument();
      });
    });
  });

  describe("pending proposal — edit flow", () => {
    beforeEach(() => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () =>
            HttpResponse.json(
              makeProposal({
                id: REJECTED_PROPOSAL_ID,
                status: "pending",
                action_type: "use_skill",
                selections: {
                  skill: "finesse",
                  modifiers: {},
                  plot_spend: 0,
                },
              })
            )
        )
      );
    });

    it("shows 'Edit Proposal' heading for pending proposal", async () => {
      renderEditPage();
      await waitFor(() => {
        expect(screen.getByText("Edit Proposal")).toBeInTheDocument();
      });
    });

    it("does not show rejection note banner for pending proposals", async () => {
      renderEditPage();
      await waitFor(() => {
        expect(screen.queryByTestId("rejection-note-banner")).not.toBeInTheDocument();
      });
    });
  });

  describe("approved proposal — redirect", () => {
    it("calls router.replace when proposal is approved", async () => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () =>
            HttpResponse.json(
              makeApprovedProposal({ id: REJECTED_PROPOSAL_ID })
            )
        )
      );
      renderEditPage();
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          `/proposals/${REJECTED_PROPOSAL_ID}`
        );
      });
    });
  });

  describe("error state", () => {
    it("shows error message when proposal cannot be loaded", async () => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () =>
            HttpResponse.json(
              { error: { code: "not_found", message: "Not found", details: null } },
              { status: 404 }
            )
        )
      );
      renderEditPage();
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /Could not load proposal/i
        );
      });
    });

    it("shows a Back to proposals link in error state", async () => {
      server.use(
        http.get(
          `http://localhost:8000/api/v1/proposals/${REJECTED_PROPOSAL_ID}`,
          () =>
            HttpResponse.json(
              { error: { code: "not_found", message: "Not found", details: null } },
              { status: 404 }
            )
        )
      );
      renderEditPage();
      await waitFor(() => {
        expect(
          screen.getByText("Back to proposals")
        ).toBeInTheDocument();
      });
    });
  });
});
