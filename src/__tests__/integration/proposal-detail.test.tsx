/**
 * Integration tests for the Proposal Detail Page.
 *
 * Covers: Epic 2.1, Story 2.1.2
 *   - Full display: action type, narrative, selections, calculated_effect, status
 *   - Approved: CalculatedEffectCard + event id display
 *   - Rejected: rejection note + [Revise] button
 *   - Pending: [Edit] [Delete] with ConfirmModal
 *   - Back link to /proposals
 *   - Revision count badge
 *   - Loading and error states
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import {
  makeProposal,
  makeApprovedProposal,
  makeRejectedProposal,
} from "@/mocks/fixtures/proposals";
import { playerA } from "@/mocks/fixtures/users";
import ProposalDetailPage from "@/app/(player)/proposals/[id]/page";

const API_BASE = "http://localhost:8000/api/v1";

// ── Mocks ─────────────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: playerA,
    isLoading: false,
    isGm: false,
    isPlayer: true,
    characterId: playerA.character_id,
    logout: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
// Mutable proposal id — changed per test
let mockProposalId = "01PROPOSAL_DEFAULT000000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useParams: () => ({ id: mockProposalId }),
}));

// ── MSW lifecycle ─────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockClear();
  mockProposalId = "01PROPOSAL_DEFAULT000000";
});
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <ProposalDetailPage />
    </TestProviders>
  );
}

function useProposalFixture(proposal: ReturnType<typeof makeProposal>) {
  mockProposalId = proposal.id;
  server.use(
    http.get(`${API_BASE}/proposals/${proposal.id}`, () =>
      HttpResponse.json(proposal)
    )
  );
}

// ── Back link ─────────────────────────────────────────────────────

describe("proposal detail — back link", () => {
  it("renders back link to /proposals", async () => {
    const proposal = makeProposal();
    useProposalFixture(proposal);
    renderPage();
    const link = await screen.findByRole("link", {
      name: /back to proposals/i,
    });
    expect(link).toHaveAttribute("href", "/proposals");
  });
});

// ── Pending proposal ──────────────────────────────────────────────

describe("proposal detail — pending", () => {
  it("renders action type badge", async () => {
    const proposal = makeProposal({ action_type: "use_skill" });
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("Use Skill")).toBeInTheDocument();
  });

  it("renders narrative text", async () => {
    const proposal = makeProposal({
      narrative: "I attempt to scale the tower wall.",
    });
    useProposalFixture(proposal);
    renderPage();
    expect(
      await screen.findByText("I attempt to scale the tower wall.")
    ).toBeInTheDocument();
  });

  it("renders pending status badge", async () => {
    const proposal = makeProposal();
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("pending")).toBeInTheDocument();
  });

  it("renders Edit link", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_PEND1000000000" });
    useProposalFixture(proposal);
    renderPage();
    await screen.findByText("pending");
    const editLink = screen.getByLabelText("Edit proposal");
    expect(editLink).toHaveAttribute("href", `/proposals/${proposal.id}/edit`);
  });

  it("renders Delete button", async () => {
    const proposal = makeProposal();
    useProposalFixture(proposal);
    renderPage();
    await screen.findByText("pending");
    expect(screen.getByLabelText("Delete proposal")).toBeInTheDocument();
  });

  it("clicking Delete opens confirm modal", async () => {
    const proposal = makeProposal();
    useProposalFixture(proposal);
    renderPage();
    await screen.findByLabelText("Delete proposal");

    fireEvent.click(screen.getByLabelText("Delete proposal"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("confirming delete navigates to /proposals", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_PEND2000000000" });
    useProposalFixture(proposal);
    server.use(
      http.delete(`${API_BASE}/proposals/${proposal.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );
    renderPage();
    await screen.findByLabelText("Delete proposal");

    fireEvent.click(screen.getByLabelText("Delete proposal"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proposals");
    });
  });

  it("renders revision count badge when revision_count > 0", async () => {
    const proposal = makeProposal({ revision_count: 3 });
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("Revised 3x")).toBeInTheDocument();
  });

  it("renders selections summary", async () => {
    const proposal = makeProposal({
      selections: { skill: "finesse", modifiers: {} },
    });
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("Selections")).toBeInTheDocument();
    expect(screen.getByText("finesse")).toBeInTheDocument();
  });
});

// ── Approved proposal ─────────────────────────────────────────────

describe("proposal detail — approved", () => {
  it("renders approved status badge", async () => {
    const proposal = makeApprovedProposal();
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("approved")).toBeInTheDocument();
  });

  it("renders CalculatedEffectCard", async () => {
    const proposal = makeApprovedProposal();
    useProposalFixture(proposal);
    renderPage();
    expect(
      await screen.findByLabelText("Calculated effect")
    ).toBeInTheDocument();
  });

  it("renders GM note when present", async () => {
    const proposal = makeApprovedProposal({ gm_notes: "Perfect execution!" });
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("Perfect execution!")).toBeInTheDocument();
    expect(screen.getByText("GM Note")).toBeInTheDocument();
  });

  it("renders event ID when event_id is present", async () => {
    const proposal = makeApprovedProposal({
      event_id: "01EVENT_FULLID0000000000",
    });
    useProposalFixture(proposal);
    renderPage();
    expect(
      await screen.findByText("01EVENT_FULLID0000000000")
    ).toBeInTheDocument();
  });

  it("does not render Edit or Delete for approved", async () => {
    const proposal = makeApprovedProposal();
    useProposalFixture(proposal);
    renderPage();
    await screen.findByText("approved");
    expect(screen.queryByLabelText("Edit proposal")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete proposal")).not.toBeInTheDocument();
  });
});

// ── Rejected proposal ─────────────────────────────────────────────

describe("proposal detail — rejected", () => {
  it("renders rejected status badge", async () => {
    const proposal = makeRejectedProposal();
    useProposalFixture(proposal);
    renderPage();
    expect(await screen.findByText("rejected")).toBeInTheDocument();
  });

  it("renders rejection reason", async () => {
    const proposal = makeRejectedProposal({
      gm_notes: "Please clarify the intent.",
    });
    useProposalFixture(proposal);
    renderPage();
    expect(
      await screen.findByText("Please clarify the intent.")
    ).toBeInTheDocument();
    expect(screen.getByText("Rejection Reason")).toBeInTheDocument();
  });

  it("renders Revise button", async () => {
    const proposal = makeRejectedProposal({ id: "01PROPOSAL_REJ10000000000" });
    useProposalFixture(proposal);
    renderPage();
    await screen.findByText("rejected");
    const reviseLink = screen.getByLabelText("Revise proposal");
    expect(reviseLink).toHaveAttribute(
      "href",
      `/proposals/${proposal.id}/edit`
    );
  });

  it("renders Delete button", async () => {
    const proposal = makeRejectedProposal();
    useProposalFixture(proposal);
    renderPage();
    await screen.findByText("rejected");
    expect(screen.getByLabelText("Delete proposal")).toBeInTheDocument();
  });
});

// ── Loading and error states ──────────────────────────────────────

describe("proposal detail — loading and error", () => {
  it("shows loading skeleton while fetching", () => {
    mockProposalId = "01PROPOSAL_LOADING000000";
    server.use(
      http.get(`${API_BASE}/proposals/${mockProposalId}`, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(makeProposal());
      })
    );
    renderPage();
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("shows error state when proposal not found", async () => {
    mockProposalId = "01PROPOSAL_MISSING000000";
    server.use(
      http.get(`${API_BASE}/proposals/${mockProposalId}`, () =>
        HttpResponse.json(
          {
            error: {
              code: "not_found",
              message: "Proposal not found",
              details: null,
            },
          },
          { status: 404 }
        )
      )
    );
    renderPage();
    expect(
      await screen.findByText(/could not load proposal/i)
    ).toBeInTheDocument();
  });
});
