/**
 * Integration tests: SessionLifecycleControls (Story 3.3.4)
 *
 * Covers:
 * - Draft session: Start and Delete buttons visible
 * - Active session: End button visible, no Start/Delete
 * - Ended session: no controls rendered
 * - Start confirmation modal shows participant info
 * - End confirmation modal warns about Plot clamping
 * - Delete confirmation modal fires DELETE /sessions/{id}
 * - Start conflict (409) shows error toast
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
  makeParticipant,
} from "@/mocks/fixtures/sessions";
import { startSessionConflictHandler } from "@/mocks/handlers/sessions";
import { SessionLifecycleControls } from "./SessionLifecycleControls";
import type { SessionResponse } from "@/lib/api/types";

const API_BASE = "http://localhost:8000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/sessions/test",
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setupActiveSessionHandler() {
  server.use(
    http.get(`${API_BASE}/sessions`, ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("status") === "active") {
        return HttpResponse.json({ items: [], next_cursor: null, has_more: false });
      }
      return HttpResponse.json({ items: [], next_cursor: null, has_more: false });
    })
  );
}

function renderControls(session: SessionResponse) {
  return render(
    <TestProviders>
      <SessionLifecycleControls session={session} />
    </TestProviders>
  );
}

// ── Button visibility ──────────────────────────────────────────────

describe("SessionLifecycleControls: button visibility", () => {
  it("shows Start Session and Delete buttons for draft session", () => {
    setupActiveSessionHandler();
    renderControls(makeSession({ status: "draft" }));
    expect(screen.getByLabelText("Start session")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete session")).toBeInTheDocument();
  });

  it("shows End Session button for active session", () => {
    setupActiveSessionHandler();
    renderControls(makeActiveSession());
    expect(screen.getByLabelText("End session")).toBeInTheDocument();
    expect(screen.queryByLabelText("Start session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();
  });

  it("renders nothing for ended session", () => {
    setupActiveSessionHandler();
    renderControls(makeEndedSession());
    expect(screen.queryByLabelText("Start session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();
  });
});

// ── Start confirmation modal ───────────────────────────────────────

describe("SessionLifecycleControls: start confirmation", () => {
  it("clicking Start Session opens confirmation modal", () => {
    setupActiveSessionHandler();
    renderControls(makeSession({ status: "draft", participants: [] }));
    fireEvent.click(screen.getByLabelText("Start session"));
    expect(screen.getByText("Start Session?")).toBeInTheDocument();
  });

  it("modal shows distribution info", () => {
    setupActiveSessionHandler();
    renderControls(
      makeSession({
        status: "draft",
        time_now: 42,
        participants: [makeParticipant()],
      })
    );
    fireEvent.click(screen.getByLabelText("Start session"));
    expect(
      screen.getByText(/free time will be distributed/i)
    ).toBeInTheDocument();
  });

  it("Start Session button in modal is disabled with 0 participants", () => {
    setupActiveSessionHandler();
    renderControls(makeSession({ status: "draft", participants: [] }));
    fireEvent.click(screen.getByLabelText("Start session"));
    const confirmBtn = screen.getByRole("button", { name: "Start Session" });
    expect(confirmBtn).toBeDisabled();
  });

  it("clicking Start Session in modal calls POST /sessions/{id}/start", async () => {
    const session = makeSession({
      status: "draft",
      participants: [makeParticipant()],
    });
    let startCalled = false;

    setupActiveSessionHandler();
    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/start`, () => {
        startCalled = true;
        return HttpResponse.json(makeActiveSession({ id: session.id }));
      })
    );

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Start session"));

    const confirmBtn = screen.getByRole("button", { name: "Start Session" });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(startCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Session started.")).toBeInTheDocument();
    });
  });

  it("start conflict (409) shows error toast", async () => {
    const session = makeSession({
      status: "draft",
      participants: [makeParticipant()],
    });

    setupActiveSessionHandler();
    server.use(startSessionConflictHandler(session.id));

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Start session"));
    fireEvent.click(screen.getByRole("button", { name: "Start Session" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to start session.")).toBeInTheDocument();
    });
  });
});

// ── End confirmation modal ─────────────────────────────────────────

describe("SessionLifecycleControls: end confirmation", () => {
  it("clicking End Session opens confirmation modal", () => {
    setupActiveSessionHandler();
    renderControls(makeActiveSession());
    fireEvent.click(screen.getByLabelText("End session"));
    expect(screen.getByText("End Session?")).toBeInTheDocument();
  });

  it("modal warns about Plot clamping", () => {
    setupActiveSessionHandler();
    renderControls(makeActiveSession());
    fireEvent.click(screen.getByLabelText("End session"));
    expect(screen.getByText(/clamp.*plot.*maximum/i)).toBeInTheDocument();
  });

  it("confirming End calls POST /sessions/{id}/end and shows toast", async () => {
    const session = makeActiveSession();
    let endCalled = false;

    setupActiveSessionHandler();
    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/end`, () => {
        endCalled = true;
        return HttpResponse.json(makeEndedSession({ id: session.id }));
      })
    );

    renderControls(session);
    fireEvent.click(screen.getByLabelText("End session"));
    fireEvent.click(screen.getByRole("button", { name: "End Session" }));

    await waitFor(() => {
      expect(endCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Session ended.")).toBeInTheDocument();
    });
  });

  it("cancelling end modal does not call the API", async () => {
    let endCalled = false;
    server.use(
      http.get(`${API_BASE}/sessions`, () =>
        HttpResponse.json({ items: [], next_cursor: null, has_more: false })
      ),
      http.post(`${API_BASE}/sessions/:id/end`, () => {
        endCalled = true;
        return HttpResponse.json(makeEndedSession());
      })
    );

    renderControls(makeActiveSession());
    fireEvent.click(screen.getByLabelText("End session"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Wait a tick to ensure no API calls happened
    await new Promise((r) => setTimeout(r, 50));
    expect(endCalled).toBe(false);
    expect(screen.queryByText("End Session?")).not.toBeInTheDocument();
  });
});

// ── Delete confirmation modal ──────────────────────────────────────

describe("SessionLifecycleControls: delete confirmation", () => {
  it("clicking Delete opens confirmation modal", () => {
    setupActiveSessionHandler();
    renderControls(makeSession({ status: "draft" }));
    fireEvent.click(screen.getByLabelText("Delete session"));
    expect(screen.getByText("Delete Session?")).toBeInTheDocument();
  });

  it("confirming delete calls DELETE /sessions/{id}", async () => {
    const session = makeSession({ status: "draft" });
    let deleteCalled = false;

    setupActiveSessionHandler();
    server.use(
      http.delete(`${API_BASE}/sessions/${session.id}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Delete session"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });
});
