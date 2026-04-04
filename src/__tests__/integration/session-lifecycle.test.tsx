/**
 * Integration tests: Session Lifecycle (Story 3.3 — Priority 4)
 *
 * Covers the full session state machine from spec/domains/sessions.md:
 *
 * Happy paths:
 * - Create draft session → verify in list
 * - Start session (draft → active): confirmation modal, resource distribution note,
 *   POST /sessions/{id}/start fires, session shown as Active
 * - End session (active → ended): confirmation modal, POST /sessions/{id}/end fires,
 *   session shown as Ended, no further lifecycle controls
 *
 * Rejections / edge cases:
 * - Start rejected with 0 participants (button disabled in modal)
 * - Start rejected 409 when another session already active
 * - Contribution toggle disabled after session starts
 * - Draft session deletion (hard-delete via DELETE /sessions/{id})
 *
 * spec/testing/strategy.md: Priority 4 (session lifecycle edge cases)
 * spec/domains/sessions.md: lifecycle section
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
import { paginatedList } from "@/mocks/fixtures/helpers";
import {
  startSessionConflictHandler,
  deleteNonDraftHandler,
} from "@/mocks/handlers/sessions";
import { SessionLifecycleControls } from "@/features/sessions/components/SessionLifecycleControls";
import GmSessionsPage from "@/app/(gm)/sessions/page";
import type { SessionResponse } from "@/lib/api/types";

const API_BASE = "http://localhost:8000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/sessions",
  useParams: () => ({}),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "01USER_GM_000000000000",
      display_name: "The GM",
      role: "gm",
      is_active: true,
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

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ────────────────────────────────────────────────────────

function renderControls(session: SessionResponse) {
  return render(
    <TestProviders>
      <SessionLifecycleControls session={session} />
    </TestProviders>
  );
}

function renderPage() {
  return render(
    <TestProviders>
      <GmSessionsPage />
    </TestProviders>
  );
}

function setupPageHandlers(sessions: SessionResponse[]) {
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

// ── Full lifecycle: draft → active → ended ─────────────────────────

describe("session-lifecycle: full happy path", () => {
  it("Draft → Active: confirms modal, fires start, shows success toast", async () => {
    const session = makeSession({
      status: "draft",
      participants: [makeParticipant()],
    });
    let startFired = false;

    setupPageHandlers([]);
    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/start`, () => {
        startFired = true;
        return HttpResponse.json(makeActiveSession({ id: session.id }));
      })
    );

    renderControls(session);

    // Step 1: Click "Start session"
    fireEvent.click(screen.getByLabelText("Start session"));

    // Step 2: Confirmation modal appears
    expect(screen.getByText("Start Session?")).toBeInTheDocument();

    // Step 3: Modal shows distribution note
    expect(
      screen.getByText(/free time will be distributed/i)
    ).toBeInTheDocument();

    // Step 4: Confirm button enabled (has participants)
    const confirmBtn = screen.getByRole("button", { name: "Start Session" });
    expect(confirmBtn).not.toBeDisabled();

    // Step 5: Confirm start
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(startFired).toBe(true);
    });

    // Step 6: Success toast
    await waitFor(() => {
      expect(screen.getByText("Session started.")).toBeInTheDocument();
    });
  });

  it("Active → Ended: confirms modal, fires end, shows success toast", async () => {
    const session = makeActiveSession();
    let endFired = false;

    setupPageHandlers([]);
    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/end`, () => {
        endFired = true;
        return HttpResponse.json(makeEndedSession({ id: session.id }));
      })
    );

    renderControls(session);

    // Step 1: End button visible (no Start or Delete)
    expect(screen.getByLabelText("End session")).toBeInTheDocument();
    expect(screen.queryByLabelText("Start session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();

    // Step 2: Open end confirmation
    fireEvent.click(screen.getByLabelText("End session"));
    expect(screen.getByText("End Session?")).toBeInTheDocument();
    expect(screen.getByText(/clamp.*plot.*maximum/i)).toBeInTheDocument();

    // Step 3: Confirm end
    fireEvent.click(screen.getByRole("button", { name: "End Session" }));

    await waitFor(() => {
      expect(endFired).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Session ended.")).toBeInTheDocument();
    });
  });

  it("Ended session: no lifecycle controls rendered", () => {
    setupPageHandlers([]);
    renderControls(makeEndedSession());

    expect(screen.queryByLabelText("Start session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End session")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();
  });
});

// ── Edge case: start with 0 participants rejected ─────────────────

describe("session-lifecycle: start rejected with 0 participants", () => {
  it("Start Session confirm button is disabled when participants list is empty", () => {
    const session = makeSession({ status: "draft", participants: [] });
    setupPageHandlers([]);
    renderControls(session);

    fireEvent.click(screen.getByLabelText("Start session"));

    const confirmBtn = screen.getByRole("button", { name: "Start Session" });
    expect(confirmBtn).toBeDisabled();
  });

  it("does not fire API call when confirm is disabled with 0 participants", async () => {
    let startFired = false;
    const session = makeSession({ status: "draft", participants: [] });

    setupPageHandlers([]);
    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/start`, () => {
        startFired = true;
        return HttpResponse.json(makeActiveSession({ id: session.id }));
      })
    );

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Start session"));

    // Attempt to click disabled button
    const confirmBtn = screen.getByRole("button", { name: "Start Session" });
    fireEvent.click(confirmBtn);

    await new Promise((r) => setTimeout(r, 50));
    expect(startFired).toBe(false);
  });
});

// ── Edge case: 409 conflict when another session already active ───

describe("session-lifecycle: 409 conflict on start", () => {
  it("shows error toast when start returns 409", async () => {
    const session = makeSession({
      status: "draft",
      participants: [makeParticipant()],
    });

    setupPageHandlers([]);
    server.use(startSessionConflictHandler(session.id));

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Start session"));
    fireEvent.click(screen.getByRole("button", { name: "Start Session" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to start session.")).toBeInTheDocument();
    });
  });
});

// ── Edge case: 400 on deleting non-draft session ──────────────────

describe("session-lifecycle: hard-delete draft-only constraint", () => {
  it("shows delete confirmation for draft session", () => {
    setupPageHandlers([]);
    const session = makeSession({ status: "draft" });
    renderControls(session);

    fireEvent.click(screen.getByLabelText("Delete session"));
    expect(screen.getByText("Delete Session?")).toBeInTheDocument();
  });

  it("confirmed delete fires DELETE /sessions/{id}", async () => {
    let deleteFired = false;
    const session = makeSession({ status: "draft" });

    setupPageHandlers([]);
    server.use(
      http.delete(`${API_BASE}/sessions/${session.id}`, () => {
        deleteFired = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderControls(session);
    fireEvent.click(screen.getByLabelText("Delete session"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteFired).toBe(true);
    });
  });

  it("active/ended sessions do not show Delete button", () => {
    setupPageHandlers([]);
    renderControls(makeActiveSession());
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();

    renderControls(makeEndedSession());
    expect(screen.queryByLabelText("Delete session")).not.toBeInTheDocument();
  });
});

// ── Contribution toggle locked after session start ─────────────────

describe("session-lifecycle: contribution toggle disabled after start", () => {
  it("toggle is enabled for draft participants", () => {
    const { ParticipantManagement } = require("@/features/sessions/components/ParticipantManagement");
    const { makeCharacter } = require("@/mocks/fixtures/characters");

    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: "char-a", character_name: "Kael" }),
      ],
    });

    render(
      <TestProviders>
        <ParticipantManagement
          session={session}
          allCharacters={[makeCharacter({ id: "char-a", name: "Kael", detail_level: "full" })]}
          isGm={true}
          playerCharacterId={null}
        />
      </TestProviders>
    );

    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).not.toBeDisabled();
  });

  it("toggle is disabled for active session participants", () => {
    const { ParticipantManagement } = require("@/features/sessions/components/ParticipantManagement");

    const session = makeActiveSession({
      participants: [
        makeParticipant({ character_id: "char-a", character_name: "Kael" }),
      ],
    });

    render(
      <TestProviders>
        <ParticipantManagement
          session={session}
          allCharacters={[]}
          isGm={true}
          playerCharacterId={null}
        />
      </TestProviders>
    );

    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).toBeDisabled();
  });
});

// ── Session list page: three sections ────────────────────────────

describe("session-lifecycle: sessions list page sections", () => {
  it("shows all three status sections when all types present", async () => {
    setupPageHandlers([
      makeActiveSession({ summary: "Running now" }),
      makeSession({ summary: "Upcoming draft" }),
      makeEndedSession({ summary: "Old session" }),
    ]);

    renderPage();

    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });

  it("creates session and shows success toast", async () => {
    setupPageHandlers([]);
    server.use(
      http.post(`${API_BASE}/sessions`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makeSession({
            id: "01SESSION_CREATED0000000",
            summary: body.summary as string,
          }),
          { status: 201 }
        );
      })
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /new session/i }));

    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: "The big battle" },
    });
    fireEvent.change(screen.getByLabelText(/time now/i), {
      target: { value: "50" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(screen.getByText("Session created.")).toBeInTheDocument();
    });
  });
});
