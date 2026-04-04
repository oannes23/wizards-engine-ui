import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { TestProviders } from "@/mocks/TestProviders";
import GmQueuePage from "./page";
import { makeProposal } from "@/mocks/fixtures/proposals";
import {
  MOCK_DASHBOARD,
  MOCK_QUEUE_SUMMARY,
  makeSystemTraumaProposal,
  makeSystemClockProposal,
  pendingProposalsQueueHandler,
} from "@/mocks/handlers/gm";
import { paginatedList } from "@/mocks/fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm",
}));

// Mock Radix Tabs to avoid issues in test environment
vi.mock("@radix-ui/react-tabs", async () => {
  const actual = await vi.importActual<typeof import("@radix-ui/react-tabs")>("@radix-ui/react-tabs");
  return actual;
});

const server = setupServer(
  // GET /me
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

  // GET /sessions?status=active
  http.get(`${API_BASE}/sessions`, () =>
    HttpResponse.json(paginatedList([]))
  ),

  // GET /gm/dashboard
  http.get(`${API_BASE}/gm/dashboard`, () =>
    HttpResponse.json(MOCK_DASHBOARD)
  ),

  // GET /gm/queue-summary
  http.get(`${API_BASE}/gm/queue-summary`, () =>
    HttpResponse.json(MOCK_QUEUE_SUMMARY)
  ),

  // GET /proposals (queue)
  http.get(`${API_BASE}/proposals`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status === "pending") {
      return HttpResponse.json(paginatedList([makeProposal()]));
    }
    return HttpResponse.json(paginatedList([]));
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  return render(
    <TestProviders>
      <GmQueuePage />
    </TestProviders>
  );
}

describe("GmQueuePage", () => {
  it("renders page heading", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Proposal Queue")).toBeInTheDocument();
    });
  });

  it("renders Queue and Recent tabs", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Queue")).toBeInTheDocument();
      expect(screen.getByText("Recent")).toBeInTheDocument();
    });
  });

  it("shows pending proposal in the queue tab", async () => {
    renderPage();
    await waitFor(() => {
      // The default pending proposal is use_skill
      expect(screen.getByText("Use Skill")).toBeInTheDocument();
    });
  });

  it("shows empty queue state when no pending proposals", async () => {
    server.use(pendingProposalsQueueHandler([]));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Queue is empty")).toBeInTheDocument();
    });
  });

  it("shows pending count badge on queue tab", async () => {
    renderPage();
    await waitFor(() => {
      // Dashboard returns pending_proposals: 2
      expect(screen.getByLabelText("2 pending")).toBeInTheDocument();
    });
  });

  describe("queue sort order", () => {
    it("pins system proposals at the top", async () => {
      const trauma = makeSystemTraumaProposal();
      const clock = makeSystemClockProposal();
      const player = makeProposal({
        // Older player proposal
        created_at: "2026-03-01T00:00:00Z",
      });

      server.use(pendingProposalsQueueHandler([player, trauma, clock]));
      renderPage();

      await waitFor(() => {
        const articles = screen.getAllByRole("article");
        // System proposals should be first two
        expect(articles[0]).toHaveAttribute(
          "aria-label",
          expect.stringContaining("(system)")
        );
      });
    });
  });
});
