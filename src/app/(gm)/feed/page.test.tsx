import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { paginatedList } from "@/mocks/fixtures/helpers";
import { makeFeedEvent } from "@/mocks/fixtures/feeds";
import GmFeedPage from "./page";

// ── Constants ──────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router & auth mocks ───────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "01GM_000000000000000000000",
      display_name: "GM",
      role: "gm",
      character_id: null,
    },
    isLoading: false,
    isGm: true,
    isPlayer: false,
    isViewer: false,
    canViewGmContent: true,
    canTakeGmActions: true,
    characterId: null,
    logout: vi.fn(),
  }),
}));

// ── MSW server lifecycle ──────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <GmFeedPage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("GmFeedPage — layout", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Event Feed" })).toBeInTheDocument();
  });

  it("renders the three tab triggers: All, Silent, Filter", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /silent/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /filter/i })).toBeInTheDocument();
  });

  it("All tab is active by default", () => {
    renderPage();
    const allTab = screen.getByRole("tab", { name: /^all$/i });
    expect(allTab).toHaveAttribute("data-state", "active");
  });

  it("has a tablist with accessible label", () => {
    renderPage();
    expect(screen.getByRole("tablist", { name: /feed tabs/i })).toBeInTheDocument();
  });
});

describe("GmFeedPage — All tab (default)", () => {
  it("loads and displays events on the All tab", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          paginatedList([
            makeFeedEvent({
              id: "01EVT_GM_A00000000000000000",
              narrative: "A GM-level event occurred.",
            }),
          ])
        )
      )
    );

    renderPage();
    expect(await screen.findByText("A GM-level event occurred.")).toBeInTheDocument();
  });

  it("shows empty state when All feed has no events", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    renderPage();
    expect(await screen.findByText("No events in your feed yet")).toBeInTheDocument();
  });

  it("shows error state when All feed request fails", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error" } },
          { status: 500 }
        )
      )
    );

    renderPage();
    expect(await screen.findByText("Could not load feed")).toBeInTheDocument();
  });

  it("shows load more button when there are more pages", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          paginatedList(
            [makeFeedEvent({ id: "01EVT_GM_A00000000000000000" })],
            true
          )
        )
      )
    );

    renderPage();
    expect(
      await screen.findByRole("button", { name: /load more/i })
    ).toBeInTheDocument();
  });
});
