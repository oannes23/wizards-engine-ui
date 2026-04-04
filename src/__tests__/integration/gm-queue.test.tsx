/**
 * Integration tests: GM Queue (Epic 2.2)
 *
 * Covers the end-to-end GM queue flow from page render through
 * approve/reject mutations:
 *
 *   - Queue loads with pending proposals
 *   - Quick approve: single click, success toast fires
 *   - Approve with options: narrative override + force flag
 *   - Reject with a note
 *   - System proposal (resolve_trauma): bond selector + required fields
 *   - System proposal (resolve_clock): narrative field required
 *   - Error states: 409 already-resolved, network failure
 *   - Recent tab: shows approved/rejected history, empty state
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
  within,
} from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders, createTestQueryClient } from "@/mocks/TestProviders";
import {
  makeProposal,
  makeApprovedProposal,
  makeRejectedProposal,
} from "@/mocks/fixtures/proposals";
import { paginatedList } from "@/mocks/fixtures/helpers";
import {
  MOCK_DASHBOARD,
  MOCK_QUEUE_SUMMARY,
  makeSystemTraumaProposal,
  makeSystemClockProposal,
  pendingProposalsQueueHandler,
  approveAlreadyApprovedHandler,
  rejectAlreadyResolvedHandler,
} from "@/mocks/handlers/gm";
import GmQueuePage from "@/app/(gm)/gm/page";
import { GmProposalReviewCard } from "@/features/proposals/components/GmProposalReviewCard";
import { useApproveProposal, useRejectProposal } from "@/features/proposals/hooks/useGmQueue";
import type { BondDisplayResponse, ProposalResponse } from "@/lib/api/types";
import type {
  ApproveProposalRequest,
  RejectProposalRequest,
} from "@/lib/api/services/proposals";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Mocks ─────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm",
}));

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Install the standard GM page MSW handlers. The /proposals handler is
 * provided via pendingProposalsQueueHandler so callers can control the queue.
 * The Recent tab uses the same /proposals route without status=pending so
 * we also provide a fallback returning empty to avoid unhandled requests.
 */
function setupCommonHandlers(pendingItems = [makeProposal()]) {
  server.use(
    http.get(`${API_BASE}/me`, () =>
      HttpResponse.json({
        id: "01GM000000000000000000000",
        display_name: "The GM",
        role: "gm",
        character_id: null,
        can_view_gm_content: true,
        can_take_gm_actions: true,
      })
    ),
    http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
    http.get(`${API_BASE}/gm/dashboard`, () => HttpResponse.json(MOCK_DASHBOARD)),
    http.get(`${API_BASE}/gm/queue-summary`, () => HttpResponse.json(MOCK_QUEUE_SUMMARY)),
    pendingProposalsQueueHandler(pendingItems)
  );
}

/**
 * Create a QueryClient with refetchOnMount enabled.
 * Needed for tests that trigger lazy-mounted tab content (Recent tab),
 * where the default test QueryClient disables refetchOnMount globally.
 */
function createFreshQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Allow fetches to fire when components mount (tab switch triggers mount)
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });
}

function renderPage(queryClient?: QueryClient) {
  return render(
    <TestProviders queryClient={queryClient}>
      <GmQueuePage />
    </TestProviders>
  );
}

// ── resolve_trauma test harness ───────────────────────────────────

const TRAUMA_BONDS: BondDisplayResponse[] = [
  {
    id: "01BOND_A0000000000000000",
    slot_type: "pc_bond",
    target_type: "character",
    target_id: "01CH_B0000000000000000000",
    target_name: "Eve",
    label: "Mentor",
    description: null,
    is_active: true,
    bidirectional: false,
    charges: 5,
    degradations: 0,
    is_trauma: false,
    effective_charges_max: 5,
  },
];

/**
 * Render a GmProposalReviewCard wired to the real approve/reject mutations.
 * Used for trauma resolution tests where characterBonds must be injected.
 */
function TraumaCardHarness({
  proposal,
  bonds,
}: {
  proposal: ProposalResponse;
  bonds: BondDisplayResponse[];
}) {
  const approve = useApproveProposal();
  const reject = useRejectProposal();
  return (
    <GmProposalReviewCard
      proposal={proposal}
      characterBonds={bonds}
      onApprove={(id: string, payload: ApproveProposalRequest) =>
        approve.mutateAsync({ id, body: payload })
      }
      onReject={(id: string, payload: RejectProposalRequest) =>
        reject.mutateAsync({ id, body: payload })
      }
    />
  );
}

// ── Suite 1: Page load ────────────────────────────────────────────

describe("gm-queue: page load", () => {
  it("renders the page heading and description", async () => {
    setupCommonHandlers();
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Proposal Queue" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Review and act on player proposals")
    ).toBeInTheDocument();
  });

  it("renders Queue and Recent tab triggers", async () => {
    setupCommonHandlers();
    renderPage();
    await screen.findByRole("heading", { name: "Proposal Queue" });
    expect(screen.getByRole("tab", { name: /queue/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /recent/i })).toBeInTheDocument();
  });

  it("Queue tab is selected by default", async () => {
    setupCommonHandlers();
    renderPage();
    await screen.findByRole("heading", { name: "Proposal Queue" });
    expect(screen.getByRole("tab", { name: /queue/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  it("shows a pending proposal card in the queue", async () => {
    setupCommonHandlers([makeProposal({ action_type: "use_skill" })]);
    renderPage();
    expect(await screen.findByText("Use Skill")).toBeInTheDocument();
  });

  it("shows pending count badge from dashboard data", async () => {
    setupCommonHandlers();
    renderPage();
    // MOCK_DASHBOARD.pending_proposals === 2
    expect(await screen.findByLabelText("2 pending")).toBeInTheDocument();
  });

  it("shows empty queue state when no pending proposals", async () => {
    setupCommonHandlers([]);
    renderPage();
    expect(await screen.findByText("Queue is empty")).toBeInTheDocument();
  });

  it("shows error state when proposals fetch fails", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.get(`${API_BASE}/gm/dashboard`, () => HttpResponse.json(MOCK_DASHBOARD)),
      http.get(`${API_BASE}/gm/queue-summary`, () =>
        HttpResponse.json(MOCK_QUEUE_SUMMARY)
      ),
      http.get(`${API_BASE}/proposals`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "Internal error", details: null } },
          { status: 500 }
        )
      )
    );
    renderPage();
    expect(await screen.findByText("Could not load queue")).toBeInTheDocument();
  });
});

// ── Suite 2: Queue sort order ─────────────────────────────────────

describe("gm-queue: sort order", () => {
  it("pins system proposals above player proposals", async () => {
    const playerProposal = makeProposal({
      id: "01PROPOSAL_PLAYER00000000",
      action_type: "use_skill",
      created_at: "2026-01-01T00:00:00Z",
    });
    const traumaProposal = makeSystemTraumaProposal();
    const clockProposal = makeSystemClockProposal();

    setupCommonHandlers([playerProposal, traumaProposal, clockProposal]);
    renderPage();

    await waitFor(() => {
      const articles = screen.getAllByRole("article");
      expect(articles[0]).toHaveAttribute(
        "aria-label",
        expect.stringContaining("(system)")
      );
    });
  });

  it("player proposals are ordered oldest-first (FIFO)", async () => {
    const older = makeProposal({
      id: "01PROPOSAL_OLD000000000",
      action_type: "use_skill",
      narrative: "Older proposal",
      created_at: "2026-01-01T00:00:00Z",
    });
    const newer = makeProposal({
      id: "01PROPOSAL_NEW000000000",
      action_type: "use_skill",
      narrative: "Newer proposal",
      created_at: "2026-03-01T00:00:00Z",
    });

    // API returns newer first; client should re-sort to oldest-first
    setupCommonHandlers([newer, older]);
    renderPage();

    await waitFor(() => {
      const articles = screen.getAllByRole("article");
      expect(within(articles[0]).getByText("Older proposal")).toBeInTheDocument();
      expect(within(articles[1]).getByText("Newer proposal")).toBeInTheDocument();
    });
  });
});

// ── Suite 3: Quick approve ────────────────────────────────────────

describe("gm-queue: quick approve", () => {
  it("clicking Approve fires POST /proposals/{id}/approve and shows success toast", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_TO_APPROVE000" });
    let approveBody: unknown;

    setupCommonHandlers([proposal]);
    server.use(
      http.post(`${API_BASE}/proposals/${proposal.id}/approve`, async ({ request }) => {
        approveBody = await request.json().catch(() => ({}));
        return HttpResponse.json(makeApprovedProposal({ id: proposal.id }));
      })
    );

    renderPage();
    expect(await screen.findByLabelText("Approve proposal")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Approve proposal"));

    await waitFor(() => {
      expect(screen.getByText("Proposal approved.")).toBeInTheDocument();
    });

    // Quick approve sends an empty payload
    expect(approveBody).toEqual({});
  });

  it("approve 409 (already resolved) shows error toast", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_DUPE000000000" });
    setupCommonHandlers([proposal]);
    server.use(approveAlreadyApprovedHandler(proposal.id));

    renderPage();
    expect(await screen.findByLabelText("Approve proposal")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Approve proposal"));

    await waitFor(() => {
      expect(screen.getByText("Failed to approve proposal.")).toBeInTheDocument();
    });
  });
});

// ── Suite 4: Approve with options ─────────────────────────────────

describe("gm-queue: approve with options", () => {
  it("opens options panel when Options button is clicked", async () => {
    setupCommonHandlers();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /options/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /options/i }));

    expect(screen.getByLabelText(/narrative override/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/force approval despite insufficient resources/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/bond strained/i)).toBeInTheDocument();
  });

  it("sending narrative override and force=true posts correct payload", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_OPTS000000000" });
    let capturedBody: Record<string, unknown> = {};

    setupCommonHandlers([proposal]);
    server.use(
      http.post(`${API_BASE}/proposals/${proposal.id}/approve`, async ({ request }) => {
        capturedBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return HttpResponse.json(makeApprovedProposal({ id: proposal.id }));
      })
    );

    renderPage();
    await screen.findByLabelText("Approve proposal");

    // Open options
    fireEvent.click(screen.getByRole("button", { name: /options/i }));

    // Fill narrative override
    fireEvent.change(screen.getByLabelText(/narrative override/i), {
      target: { value: "The GM narrates differently." },
    });

    // Check force flag
    fireEvent.click(
      screen.getByLabelText(/force approval despite insufficient resources/i)
    );

    // Submit with options
    fireEvent.click(screen.getByLabelText("Approve with options"));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        narrative: "The GM narrates differently.",
        gm_overrides: expect.objectContaining({ force: true }),
      });
    });
  });
});

// ── Suite 5: Reject ───────────────────────────────────────────────

describe("gm-queue: reject", () => {
  it("clicking Reject expands the rejection form", async () => {
    setupCommonHandlers();
    renderPage();

    await screen.findByLabelText("Reject proposal");

    fireEvent.click(screen.getByLabelText("Reject proposal"));

    expect(screen.getByLabelText("Rejection form")).toBeInTheDocument();
    expect(screen.getByLabelText(/rejection note/i)).toBeInTheDocument();
  });

  it("confirming rejection with a note POSTs correct payload and shows toast", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_REJECT000000" });
    let capturedBody: Record<string, unknown> = {};

    setupCommonHandlers([proposal]);
    server.use(
      http.post(`${API_BASE}/proposals/${proposal.id}/reject`, async ({ request }) => {
        capturedBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return HttpResponse.json(makeRejectedProposal({ id: proposal.id }));
      })
    );

    renderPage();
    await screen.findByLabelText("Reject proposal");

    fireEvent.click(screen.getByLabelText("Reject proposal"));
    fireEvent.change(screen.getByLabelText(/rejection note/i), {
      target: { value: "Out of scope for this scene." },
    });
    fireEvent.click(screen.getByLabelText("Confirm rejection"));

    await waitFor(() => {
      expect(screen.getByText("Proposal rejected.")).toBeInTheDocument();
    });

    expect(capturedBody).toMatchObject({
      rejection_note: "Out of scope for this scene.",
    });
  });

  it("cancelling rejection collapses the form without calling the API", async () => {
    let rejectCalled = false;
    setupCommonHandlers();
    server.use(
      http.post(`${API_BASE}/proposals/:id/reject`, () => {
        rejectCalled = true;
        return HttpResponse.json(makeRejectedProposal());
      })
    );

    renderPage();
    await screen.findByLabelText("Reject proposal");

    fireEvent.click(screen.getByLabelText("Reject proposal"));
    expect(screen.getByLabelText("Rejection form")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByLabelText("Rejection form")).not.toBeInTheDocument();
    expect(rejectCalled).toBe(false);
  });

  it("reject 409 (already resolved) shows error toast", async () => {
    const proposal = makeProposal({ id: "01PROPOSAL_RJDUPE000000" });
    setupCommonHandlers([proposal]);
    server.use(rejectAlreadyResolvedHandler(proposal.id));

    renderPage();
    await screen.findByLabelText("Reject proposal");

    fireEvent.click(screen.getByLabelText("Reject proposal"));
    fireEvent.click(screen.getByLabelText("Confirm rejection"));

    await waitFor(() => {
      expect(screen.getByText("Failed to reject proposal.")).toBeInTheDocument();
    });
  });
});

// ── Suite 6: System proposal — resolve_trauma ─────────────────────

describe("gm-queue: system proposal resolve_trauma", () => {
  it("renders the resolve_trauma system proposal with system badge", async () => {
    setupCommonHandlers([makeSystemTraumaProposal()]);
    renderPage();

    expect(await screen.findByLabelText("System proposal")).toBeInTheDocument();
    expect(screen.getByLabelText("Resolve trauma form")).toBeInTheDocument();
  });

  it("Resolve button is disabled when no bond is selected", async () => {
    setupCommonHandlers([makeSystemTraumaProposal()]);
    renderPage();

    // Without bonds the Resolve button stays disabled
    expect(await screen.findByLabelText("Resolve trauma")).toBeDisabled();
  });

  it("fills trauma form and submits correct gm_overrides payload", async () => {
    const proposal = makeSystemTraumaProposal();
    let capturedBody: Record<string, unknown> = {};

    server.use(
      http.post(`${API_BASE}/proposals/${proposal.id}/approve`, async ({ request }) => {
        capturedBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return HttpResponse.json(makeApprovedProposal({ id: proposal.id }));
      })
    );

    render(
      <TestProviders>
        <TraumaCardHarness proposal={proposal} bonds={TRAUMA_BONDS} />
      </TestProviders>
    );

    // Wait for the form
    expect(await screen.findByLabelText("Resolve trauma form")).toBeInTheDocument();

    // Select bond
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "01BOND_A0000000000000000" },
    });

    // Fill trauma name
    fireEvent.change(screen.getByLabelText("Trauma name *"), {
      target: { value: "Broken Bond" },
    });

    // Fill trauma description
    fireEvent.change(screen.getByLabelText("Trauma description *"), {
      target: { value: "The night everything shattered." },
    });

    // Resolve button should now be enabled
    const resolveBtn = screen.getByLabelText("Resolve trauma");
    expect(resolveBtn).not.toBeDisabled();

    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(capturedBody).toEqual({
        gm_overrides: {
          trauma_bond_id: "01BOND_A0000000000000000",
          trauma_name: "Broken Bond",
          trauma_description: "The night everything shattered.",
        },
      });
    });
  });

  it("does not render a Reject button for system proposals", async () => {
    setupCommonHandlers([makeSystemTraumaProposal()]);
    renderPage();

    await screen.findByLabelText("Resolve trauma form");

    expect(screen.queryByLabelText("Reject proposal")).not.toBeInTheDocument();
  });

  it("shows bond name and label in the bond selector", () => {
    const proposal = makeSystemTraumaProposal();

    render(
      <TestProviders>
        <TraumaCardHarness proposal={proposal} bonds={TRAUMA_BONDS} />
      </TestProviders>
    );

    // "Eve — Mentor" is how bond options are displayed
    expect(screen.getByText("Eve — Mentor")).toBeInTheDocument();
  });
});

// ── Suite 7: System proposal — resolve_clock ──────────────────────

describe("gm-queue: system proposal resolve_clock", () => {
  it("renders the resolve_clock system proposal with system badge", async () => {
    setupCommonHandlers([makeSystemClockProposal()]);
    renderPage();

    expect(await screen.findByLabelText("System proposal")).toBeInTheDocument();
    expect(screen.getByLabelText("Resolve clock form")).toBeInTheDocument();
  });

  it("submits narrative-only payload for resolve_clock", async () => {
    const proposal = makeSystemClockProposal();
    let capturedBody: Record<string, unknown> = {};

    setupCommonHandlers([proposal]);
    server.use(
      http.post(`${API_BASE}/proposals/${proposal.id}/approve`, async ({ request }) => {
        capturedBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return HttpResponse.json(makeApprovedProposal({ id: proposal.id }));
      })
    );

    renderPage();
    await screen.findByLabelText("Resolve clock form");

    fireEvent.change(
      screen.getByPlaceholderText(/what happens when/i),
      { target: { value: "The doomsday clock strikes midnight." } }
    );

    fireEvent.click(screen.getByLabelText("Resolve clock"));

    await waitFor(() => {
      expect(capturedBody).toEqual({
        narrative: "The doomsday clock strikes midnight.",
      });
    });
  });

  it("does not render a Reject button for resolve_clock proposals", async () => {
    setupCommonHandlers([makeSystemClockProposal()]);
    renderPage();

    await screen.findByLabelText("Resolve clock form");

    expect(screen.queryByLabelText("Reject proposal")).not.toBeInTheDocument();
  });
});

// ── Suite 8: Recent tab ───────────────────────────────────────────

describe("gm-queue: recent tab", () => {
  /**
   * Radix Tabs responds to pointerdown, not just click. Use the full
   * event sequence so the tab switch is actually registered.
   * Also uses a fresh QueryClient (refetchOnMount: true) so the
   * RecentTabContent query fires when the panel mounts.
   */
  /**
   * Radix Tabs v1.1 activates on mousedown (button=0, ctrlKey=false).
   * fireEvent.click alone does not trigger this handler in JSDOM.
   */
  function switchToRecentTab() {
    const tab = screen.getByRole("tab", { name: /recent/i });
    fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  }

  function renderPageWithFreshClient() {
    return renderPage(createFreshQueryClient());
  }

  it("switches to Recent tab and shows approved proposal", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.get(`${API_BASE}/gm/dashboard`, () => HttpResponse.json(MOCK_DASHBOARD)),
      http.get(`${API_BASE}/gm/queue-summary`, () =>
        HttpResponse.json(MOCK_QUEUE_SUMMARY)
      ),
      http.get(`${API_BASE}/proposals`, ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        if (status === "pending") return HttpResponse.json(paginatedList([]));
        // Recent query omits status — return an approved proposal
        return HttpResponse.json(paginatedList([makeApprovedProposal()]));
      })
    );

    renderPageWithFreshClient();

    // Wait for queue tab content to settle
    await screen.findByText("Queue is empty");

    switchToRecentTab();

    // The approved proposal's StatusBadge renders "approved"
    expect(await screen.findByText("approved")).toBeInTheDocument();
  });

  it("shows empty state on Recent tab when no history exists", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.get(`${API_BASE}/gm/dashboard`, () => HttpResponse.json(MOCK_DASHBOARD)),
      http.get(`${API_BASE}/gm/queue-summary`, () =>
        HttpResponse.json(MOCK_QUEUE_SUMMARY)
      ),
      http.get(`${API_BASE}/proposals`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    renderPageWithFreshClient();

    await screen.findByText("Queue is empty");

    switchToRecentTab();

    expect(await screen.findByText("No history yet")).toBeInTheDocument();
  });

  it("shows rejected proposal with gm_notes on Recent tab", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.get(`${API_BASE}/gm/dashboard`, () => HttpResponse.json(MOCK_DASHBOARD)),
      http.get(`${API_BASE}/gm/queue-summary`, () =>
        HttpResponse.json(MOCK_QUEUE_SUMMARY)
      ),
      http.get(`${API_BASE}/proposals`, ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        if (status === "pending") return HttpResponse.json(paginatedList([]));
        return HttpResponse.json(
          paginatedList([
            makeRejectedProposal({ gm_notes: "Scene was already resolved." }),
          ])
        );
      })
    );

    renderPageWithFreshClient();

    await screen.findByText("Queue is empty");

    switchToRecentTab();

    expect(
      await screen.findByText("Scene was already resolved.")
    ).toBeInTheDocument();
  });
});
