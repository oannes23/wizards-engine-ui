/**
 * Component tests: ActiveSessionBanner (Story 3.3.5)
 *
 * Covers:
 * - Renders nothing when no active session
 * - Renders banner with session name when session is active
 * - Shows Join button for non-participant player
 * - Shows Leave button for participant player
 * - Join calls POST /sessions/{id}/participants and shows toast
 * - Leave calls DELETE /sessions/{id}/participants/{characterId} and shows toast
 * - No join/leave buttons when playerCharacterId is null (viewer/GM)
 * - "All sessions" link present and correct href
 * - Session name links to session detail
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
  makeActiveSession,
  makeParticipant,
} from "@/mocks/fixtures/sessions";
import { paginatedList } from "@/mocks/fixtures/helpers";
import { ActiveSessionBanner } from "./ActiveSessionBanner";

const API_BASE = "http://localhost:8000/api/v1";
const PLAYER_CHAR_ID = "01CHAR_PLAYER000000000";
const SESSION_ID = "01SESSION_ACTIVE00000000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setupNoActiveSession() {
  server.use(
    http.get(`${API_BASE}/sessions`, () =>
      HttpResponse.json(paginatedList([]))
    )
  );
}

function setupActiveSession(participantCharIds: string[] = []) {
  const participants = participantCharIds.map((id) =>
    makeParticipant({ session_id: SESSION_ID, character_id: id })
  );
  const session = makeActiveSession({
    id: SESSION_ID,
    participants,
    summary: "The shadow council confrontation",
  });

  server.use(
    http.get(`${API_BASE}/sessions`, () =>
      HttpResponse.json(paginatedList([session]))
    )
  );
  return session;
}

function renderBanner(playerCharacterId?: string | null) {
  return render(
    <TestProviders>
      <ActiveSessionBanner playerCharacterId={playerCharacterId} />
    </TestProviders>
  );
}

// ── No active session ──────────────────────────────────────────────

describe("ActiveSessionBanner: no active session", () => {
  it("renders nothing when no session is active", async () => {
    setupNoActiveSession();
    renderBanner(PLAYER_CHAR_ID);
    // Wait for query to settle — the banner role should not appear
    await waitFor(() => {
      expect(
        screen.queryByRole("banner", { name: /active session banner/i })
      ).not.toBeInTheDocument();
    });
    // Also verify no session link rendered
    expect(screen.queryByRole("link", { name: /active session/i })).not.toBeInTheDocument();
  });
});

// ── Active session: banner content ────────────────────────────────

describe("ActiveSessionBanner: active session content", () => {
  it("renders the banner with role='banner'", async () => {
    setupActiveSession();
    renderBanner(null);
    expect(
      await screen.findByRole("banner", { name: /active session banner/i })
    ).toBeInTheDocument();
  });

  it("displays the session summary as a link to session detail", async () => {
    setupActiveSession();
    renderBanner(null);
    const link = await screen.findByRole("link", {
      name: /the shadow council confrontation/i,
    });
    expect(link).toHaveAttribute("href", `/sessions/${SESSION_ID}`);
  });

  it("shows 'All sessions' link to /sessions", async () => {
    setupActiveSession();
    renderBanner(null);
    await screen.findByRole("banner");
    const link = screen.getByRole("link", { name: /view all sessions/i });
    expect(link).toHaveAttribute("href", "/sessions");
  });
});

// ── Join / Leave buttons ────────────────────────────────────────────

describe("ActiveSessionBanner: join button for non-participant player", () => {
  it("shows Join button when player is NOT a participant", async () => {
    setupActiveSession([]); // no participants
    renderBanner(PLAYER_CHAR_ID);
    expect(
      await screen.findByRole("button", { name: /join active session/i })
    ).toBeInTheDocument();
  });

  it("does NOT show Join when player is already a participant", async () => {
    setupActiveSession([PLAYER_CHAR_ID]);
    renderBanner(PLAYER_CHAR_ID);
    await screen.findByRole("banner");
    expect(
      screen.queryByRole("button", { name: /join active session/i })
    ).not.toBeInTheDocument();
  });

  it("clicking Join calls POST /sessions/{id}/participants and shows toast", async () => {
    let joinCalled = false;
    setupActiveSession([]);
    server.use(
      http.post(`${API_BASE}/sessions/${SESSION_ID}/participants`, () => {
        joinCalled = true;
        return HttpResponse.json(
          makeParticipant({ session_id: SESSION_ID, character_id: PLAYER_CHAR_ID }),
          { status: 201 }
        );
      })
    );

    renderBanner(PLAYER_CHAR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /join active session/i }));

    await waitFor(() => {
      expect(joinCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Joined session.")).toBeInTheDocument();
    });
  });
});

describe("ActiveSessionBanner: leave button for participant player", () => {
  it("shows Leave button when player IS a participant", async () => {
    setupActiveSession([PLAYER_CHAR_ID]);
    renderBanner(PLAYER_CHAR_ID);
    expect(
      await screen.findByRole("button", { name: /leave active session/i })
    ).toBeInTheDocument();
  });

  it("clicking Leave calls DELETE and shows toast", async () => {
    let leaveCalled = false;
    setupActiveSession([PLAYER_CHAR_ID]);
    server.use(
      http.delete(
        `${API_BASE}/sessions/${SESSION_ID}/participants/${PLAYER_CHAR_ID}`,
        () => {
          leaveCalled = true;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    renderBanner(PLAYER_CHAR_ID);
    fireEvent.click(
      await screen.findByRole("button", { name: /leave active session/i })
    );

    await waitFor(() => {
      expect(leaveCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Left session.")).toBeInTheDocument();
    });
  });
});

describe("ActiveSessionBanner: no join/leave for viewer (no characterId)", () => {
  it("does not show Join or Leave when playerCharacterId is null", async () => {
    setupActiveSession([]);
    renderBanner(null);
    await screen.findByRole("banner");
    expect(
      screen.queryByRole("button", { name: /join active session/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /leave active session/i })
    ).not.toBeInTheDocument();
  });
});

// ── Error handling ─────────────────────────────────────────────────

describe("ActiveSessionBanner: error handling", () => {
  it("shows error toast when Join fails", async () => {
    setupActiveSession([]);
    server.use(
      http.post(`${API_BASE}/sessions/${SESSION_ID}/participants`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "fail", details: null } },
          { status: 500 }
        )
      )
    );

    renderBanner(PLAYER_CHAR_ID);
    fireEvent.click(await screen.findByRole("button", { name: /join active session/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to join session.")).toBeInTheDocument();
    });
  });

  it("shows error toast when Leave fails", async () => {
    setupActiveSession([PLAYER_CHAR_ID]);
    server.use(
      http.delete(
        `${API_BASE}/sessions/${SESSION_ID}/participants/${PLAYER_CHAR_ID}`,
        () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "fail", details: null } },
            { status: 500 }
          )
      )
    );

    renderBanner(PLAYER_CHAR_ID);
    fireEvent.click(
      await screen.findByRole("button", { name: /leave active session/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to leave session.")).toBeInTheDocument();
    });
  });
});
