/**
 * Integration tests for the Proposals List Page.
 *
 * Covers: Epic 2.1, Story 2.1.1
 *   - Status filter chips: All | Pending (N) | Approved | Rejected
 *   - Proposal cards: action type badge, narrative excerpt, status badge, timestamp
 *   - Pending: [Edit] [Delete] buttons; Delete opens confirm modal
 *   - Approved: CalculatedEffectCard, GM note
 *   - Rejected: rejection note, [Revise] button
 *   - Empty states per filter group
 *   - "New Proposal" button linking to /proposals/new
 *   - Loading skeleton and error state
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
import { paginatedList } from "@/mocks/fixtures/helpers";
import { emptyProposalsHandler } from "@/mocks/handlers/proposals";
import ProposalsListPage from "@/app/(player)/proposals/page";

const API_BASE = "http://localhost:8000/api/v1";

// ── Mocks ─────────────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: playerA,
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// ── MSW lifecycle ─────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <ProposalsListPage />
    </TestProviders>
  );
}

function useProposalsFixture(
  proposals: ReturnType<typeof makeProposal>[]
) {
  server.use(
    http.get(`${API_BASE}/proposals`, () =>
      HttpResponse.json(paginatedList(proposals))
    )
  );
}

// ── Page chrome ───────────────────────────────────────────────────

describe("proposals list — page chrome", () => {
  it("renders page heading", async () => {
    useProposalsFixture([]);
    renderPage();
    expect(await screen.findByRole("heading", { name: "Proposals" })).toBeInTheDocument();
  });

  it("renders New Proposal link to /proposals/new", async () => {
    useProposalsFixture([]);
    renderPage();
    const link = await screen.findByRole("link", { name: "New Proposal" });
    expect(link).toHaveAttribute("href", "/proposals/new");
  });
});

// ── Filter chips ──────────────────────────────────────────────────

describe("proposals list — filter chips", () => {
  it("renders all four filter chips", async () => {
    useProposalsFixture([makeProposal()]);
    renderPage();
    await screen.findByText("All");
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("shows pending count badge", async () => {
    useProposalsFixture([makeProposal(), makeProposal({ id: "01P2" })]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("2 pending")).toBeInTheDocument();
    });
  });

  it("filters to pending only when Pending chip is clicked", async () => {
    useProposalsFixture([makeProposal(), makeApprovedProposal(), makeRejectedProposal()]);
    renderPage();
    await screen.findByText("All");

    // Initially shows all three
    await waitFor(() => {
      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.getByText("approved")).toBeInTheDocument();
      expect(screen.getByText("rejected")).toBeInTheDocument();
    });

    // Filter to pending
    fireEvent.click(screen.getByRole("button", { name: /^pending/i }));

    await waitFor(() => {
      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.queryByText("approved")).not.toBeInTheDocument();
      expect(screen.queryByText("rejected")).not.toBeInTheDocument();
    });
  });

  it("shows approved empty state when filter is approved and none exist", async () => {
    useProposalsFixture([makeProposal()]); // only pending
    renderPage();
    await screen.findByText("All");

    fireEvent.click(screen.getByRole("button", { name: "Approved" }));

    await waitFor(() => {
      expect(screen.getByText("No approved proposals")).toBeInTheDocument();
    });
  });
});

// ── Proposal cards ────────────────────────────────────────────────

describe("proposals list — proposal cards", () => {
  it("renders action type badge on card", async () => {
    useProposalsFixture([makeProposal({ action_type: "use_skill" })]);
    renderPage();
    expect(await screen.findByText("Use Skill")).toBeInTheDocument();
  });

  it("renders narrative excerpt on pending card", async () => {
    useProposalsFixture([
      makeProposal({ narrative: "I pickpocket the guard." }),
    ]);
    renderPage();
    expect(
      await screen.findByText("I pickpocket the guard.")
    ).toBeInTheDocument();
  });

  it("renders status badge", async () => {
    useProposalsFixture([makeProposal()]);
    renderPage();
    expect(await screen.findByText("pending")).toBeInTheDocument();
  });

  it("renders CalculatedEffectCard on approved proposal", async () => {
    useProposalsFixture([makeApprovedProposal()]);
    renderPage();
    expect(
      await screen.findByLabelText("Calculated effect")
    ).toBeInTheDocument();
  });

  it("renders GM note on approved proposal", async () => {
    useProposalsFixture([
      makeApprovedProposal({ gm_notes: "Well done!" }),
    ]);
    renderPage();
    expect(await screen.findByText("Well done!")).toBeInTheDocument();
  });

  it("renders rejection reason on rejected proposal", async () => {
    useProposalsFixture([
      makeRejectedProposal({ gm_notes: "Not appropriate." }),
    ]);
    renderPage();
    expect(await screen.findByText("Not appropriate.")).toBeInTheDocument();
  });

  it("renders Revise button on rejected proposal", async () => {
    useProposalsFixture([makeRejectedProposal()]);
    renderPage();
    expect(
      await screen.findByLabelText("Revise proposal")
    ).toBeInTheDocument();
  });
});

// ── Delete flow ───────────────────────────────────────────────────

describe("proposals list — delete", () => {
  it("clicking Delete opens confirm modal", async () => {
    useProposalsFixture([makeProposal()]);
    renderPage();
    await screen.findByLabelText("Delete proposal");

    fireEvent.click(screen.getByLabelText("Delete proposal"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Proposal")).toBeInTheDocument();
  });

  it("Cancel closes modal without calling API", async () => {
    let deleteCalled = false;
    useProposalsFixture([makeProposal()]);
    server.use(
      http.delete(`${API_BASE}/proposals/:id`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderPage();
    await screen.findByLabelText("Delete proposal");

    fireEvent.click(screen.getByLabelText("Delete proposal"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteCalled).toBe(false);
  });

  it("confirming delete fires API and shows success toast", async () => {
    const proposal = makeProposal();
    useProposalsFixture([proposal]);
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
      expect(screen.getByText(/proposal deleted/i)).toBeInTheDocument();
    });
  });

  it("delete failure shows error toast", async () => {
    const proposal = makeProposal();
    useProposalsFixture([proposal]);
    server.use(
      http.delete(`${API_BASE}/proposals/:id`, () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "Not found", details: null } },
          { status: 404 }
        )
      )
    );
    renderPage();
    await screen.findByLabelText("Delete proposal");

    fireEvent.click(screen.getByLabelText("Delete proposal"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete proposal/i)).toBeInTheDocument();
    });
  });
});

// ── Empty states ──────────────────────────────────────────────────

describe("proposals list — empty states", () => {
  it("shows all-empty state when no proposals", async () => {
    server.use(emptyProposalsHandler());
    renderPage();
    expect(await screen.findByText("No proposals yet")).toBeInTheDocument();
  });
});

// ── Loading and error ─────────────────────────────────────────────

describe("proposals list — loading and error", () => {
  it("shows loading skeleton while fetching", () => {
    server.use(
      http.get(`${API_BASE}/proposals`, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(paginatedList([]));
      })
    );
    renderPage();
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    server.use(
      http.get(`${API_BASE}/proposals`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "Internal error", details: null } },
          { status: 500 }
        )
      )
    );
    renderPage();
    expect(
      await screen.findByText(/could not load proposals/i)
    ).toBeInTheDocument();
  });
});
