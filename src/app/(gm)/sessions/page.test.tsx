/**
 * Integration tests: GM Sessions List Page (Story 3.3.1 + 3.3.2)
 *
 * Covers:
 * - Status-sectioned list (active, draft, ended)
 * - Ended section collapsed by default
 * - Inline create form toggle and submit
 * - Empty state
 * - Error state
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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import {
  makeSession,
  makeActiveSession,
  makeEndedSession,
} from "@/mocks/fixtures/sessions";
import { paginatedList } from "@/mocks/fixtures/helpers";
import GmSessionsPage from "./page";

const API_BASE = "http://localhost:8000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/sessions",
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setupHandlers(
  sessions = [makeActiveSession(), makeSession(), makeEndedSession()]
) {
  server.use(
    http.get(`${API_BASE}/sessions`, ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      if (status === "active") {
        return HttpResponse.json(
          paginatedList(sessions.filter((s) => s.status === "active"))
        );
      }
      return HttpResponse.json(paginatedList(sessions));
    })
  );
}

function renderPage() {
  return render(
    <TestProviders>
      <GmSessionsPage />
    </TestProviders>
  );
}

// ── Page load ─────────────────────────────────────────────────────

describe("gm-sessions: page load", () => {
  it("renders page heading", async () => {
    setupHandlers();
    renderPage();
    expect(
      await screen.findByRole("heading", { name: /sessions/i })
    ).toBeInTheDocument();
  });

  it("shows 'New Session' create form toggle button", async () => {
    setupHandlers();
    renderPage();
    expect(
      await screen.findByRole("button", { name: /new session/i })
    ).toBeInTheDocument();
  });

  it("shows active session card with Active section heading", async () => {
    setupHandlers([makeActiveSession({ summary: "The big reveal" })]);
    renderPage();
    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(screen.getByText("The big reveal")).toBeInTheDocument();
  });

  it("shows draft sessions in Draft section", async () => {
    setupHandlers([makeSession({ summary: "Planning session" })]);
    renderPage();
    expect(await screen.findByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Planning session")).toBeInTheDocument();
  });

  it("shows ended sessions collapsed in Ended section", async () => {
    setupHandlers([makeEndedSession({ summary: "Old adventure" })]);
    renderPage();
    // The <details> element with the summary "Ended" should be present
    expect(await screen.findByText("Ended")).toBeInTheDocument();
  });

  it("shows empty state when no sessions", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([])))
    );
    renderPage();
    expect(await screen.findByText("No sessions yet")).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "Error", details: null } },
          { status: 500 }
        )
      )
    );
    renderPage();
    expect(await screen.findByText("Could not load sessions")).toBeInTheDocument();
  });
});

// ── Create form ───────────────────────────────────────────────────

describe("gm-sessions: create form", () => {
  it("create form is hidden by default", async () => {
    setupHandlers([]);
    renderPage();
    await screen.findByRole("heading", { name: /sessions/i });
    expect(
      screen.queryByLabelText("Create session form")
    ).not.toBeInTheDocument();
  });

  it("clicking 'New Session' reveals the create form", async () => {
    setupHandlers([]);
    renderPage();
    await screen.findByRole("button", { name: /new session/i });
    fireEvent.click(screen.getByRole("button", { name: /new session/i }));
    expect(
      await screen.findByLabelText("Create session form")
    ).toBeInTheDocument();
  });

  it("create button is disabled when summary is empty", async () => {
    setupHandlers([]);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /new session/i }));
    expect(
      screen.getByRole("button", { name: /create draft/i })
    ).toBeDisabled();
  });

  it("submitting the form calls POST /sessions and shows success toast", async () => {
    let capturedBody: Record<string, unknown> = {};

    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.post(`${API_BASE}/sessions`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makeSession({
            id: "01SESSION_NEW000000000",
            summary: capturedBody.summary as string,
          }),
          { status: 201 }
        );
      })
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /new session/i }));

    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: "The dungeon crawl" },
    });
    fireEvent.change(screen.getByLabelText(/time now/i), {
      target: { value: "45" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(screen.getByText("Session created.")).toBeInTheDocument();
    });

    expect(capturedBody).toMatchObject({
      summary: "The dungeon crawl",
      time_now: 45,
    });
  });

  it("form collapses after successful creation", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.post(`${API_BASE}/sessions`, async () =>
        HttpResponse.json(makeSession(), { status: 201 })
      )
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /new session/i }));
    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: "Test session" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(
        screen.queryByLabelText("Create session form")
      ).not.toBeInTheDocument();
    });
  });

  it("shows error toast when create fails", async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([]))),
      http.post(`${API_BASE}/sessions`, () =>
        HttpResponse.json(
          { error: { code: "validation_error", message: "Bad input", details: null } },
          { status: 422 }
        )
      )
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /new session/i }));
    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: "Failing session" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create session.")).toBeInTheDocument();
    });
  });
});
