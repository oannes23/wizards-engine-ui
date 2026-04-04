/**
 * Component tests: ParticipantManagement (Story 3.3.3)
 *
 * Covers:
 * - Empty participant list shows empty state
 * - Participants are rendered with their names
 * - GM view: add participant dropdown and "Add All" button visible
 * - Player view: join/leave buttons instead of dropdown
 * - Contribution toggle enabled in draft, disabled in active/ended
 * - Remove button visible for GM (draft/active), hidden for ended
 * - Add participant calls POST /sessions/{id}/participants
 * - Remove participant calls DELETE /sessions/{id}/participants/{charId}
 * - Contribution toggle calls PATCH /sessions/{id}/participants/{charId}
 * - "Add All" fires POST for each available character
 * - Player join / leave flow
 * - Error toasts on failure
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
import { makeSession, makeActiveSession, makeEndedSession, makeParticipant } from "@/mocks/fixtures/sessions";
import { makeCharacter } from "@/mocks/fixtures/characters";
import { ParticipantManagement } from "./ParticipantManagement";
import type { SessionResponse, CharacterDetailResponse } from "@/lib/api/types";

const API_BASE = "http://localhost:8000/api/v1";
const GM_CHAR_ID = "01CHAR_GM_000000000000";
const PLAYER_CHAR_ID = "01CHAR_PLAYER000000000";
const OTHER_CHAR_ID = "01CHAR_OTHER0000000000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/sessions/test",
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const kael = makeCharacter({
  id: PLAYER_CHAR_ID,
  name: "Kael",
  detail_level: "full",
});

const maren = makeCharacter({
  id: OTHER_CHAR_ID,
  name: "Maren",
  detail_level: "full",
});

const allCharacters: CharacterDetailResponse[] = [kael, maren];

function renderComponent(
  session: SessionResponse,
  {
    isGm = false,
    playerCharacterId = null,
    characters = allCharacters,
  }: {
    isGm?: boolean;
    playerCharacterId?: string | null;
    characters?: CharacterDetailResponse[];
  } = {}
) {
  return render(
    <TestProviders>
      <ParticipantManagement
        session={session}
        allCharacters={characters}
        isGm={isGm}
        playerCharacterId={playerCharacterId}
      />
    </TestProviders>
  );
}

// ── Empty state ────────────────────────────────────────────────────

describe("ParticipantManagement: empty state", () => {
  it("shows empty state when no participants", () => {
    const session = makeSession({ status: "draft", participants: [] });
    renderComponent(session, { isGm: true });
    expect(screen.getByText("No participants yet.")).toBeInTheDocument();
  });
});

// ── Participant list rendering ─────────────────────────────────────

describe("ParticipantManagement: participant list", () => {
  it("renders participant names", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
        makeParticipant({ character_id: OTHER_CHAR_ID, character_name: "Maren" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(screen.getByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Maren")).toBeInTheDocument();
  });

  it("renders contribution checkbox per participant", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).toBeInTheDocument();
  });
});

// ── Contribution toggle ────────────────────────────────────────────

describe("ParticipantManagement: contribution toggle", () => {
  it("contribution toggle is enabled in draft session", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).not.toBeDisabled();
  });

  it("contribution toggle is disabled in active session", () => {
    const session = makeActiveSession({
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).toBeDisabled();
  });

  it("contribution toggle is disabled in ended session", () => {
    const session = makeEndedSession({
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    ).toBeDisabled();
  });

  it("toggling contribution calls PATCH /sessions/{id}/participants/{charId}", async () => {
    let patchCalled = false;
    server.use(
      http.patch(
        `${API_BASE}/sessions/${makeSession().id}/participants/${PLAYER_CHAR_ID}`,
        () => {
          patchCalled = true;
          return HttpResponse.json(
            makeParticipant({
              character_id: PLAYER_CHAR_ID,
              additional_contribution: true,
            })
          );
        }
      )
    );

    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });

    fireEvent.click(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    );

    await waitFor(() => {
      expect(patchCalled).toBe(true);
    });
  });
});

// ── Remove participant ────────────────────────────────────────────

describe("ParticipantManagement: remove participant", () => {
  it("GM sees remove button in draft session", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("button", { name: /remove kael from session/i })
    ).toBeInTheDocument();
  });

  it("GM sees remove button in active session", () => {
    const session = makeActiveSession({
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.getByRole("button", { name: /remove kael from session/i })
    ).toBeInTheDocument();
  });

  it("remove button not shown for ended session", () => {
    const session = makeEndedSession({
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });
    expect(
      screen.queryByRole("button", { name: /remove kael from session/i })
    ).not.toBeInTheDocument();
  });

  it("clicking remove calls DELETE /sessions/{id}/participants/{charId}", async () => {
    let deleteCalled = false;
    server.use(
      http.delete(
        `${API_BASE}/sessions/${makeSession().id}/participants/${PLAYER_CHAR_ID}`,
        () => {
          deleteCalled = true;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });

    fireEvent.click(
      screen.getByRole("button", { name: /remove kael from session/i })
    );

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Participant removed.")).toBeInTheDocument();
    });
  });
});

// ── GM add participant ─────────────────────────────────────────────

describe("ParticipantManagement: GM add participant controls", () => {
  it("GM sees Add Participant section in draft session", () => {
    const session = makeSession({ status: "draft", participants: [] });
    renderComponent(session, { isGm: true, characters: allCharacters });
    expect(screen.getByLabelText("Select character to add")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add all remaining characters/i })
    ).toBeInTheDocument();
  });

  it("GM sees Add Participant section in active session", () => {
    const session = makeActiveSession({ participants: [] });
    renderComponent(session, { isGm: true, characters: allCharacters });
    expect(screen.getByLabelText("Select character to add")).toBeInTheDocument();
  });

  it("GM does NOT see Add Participant section for ended session", () => {
    const session = makeEndedSession({
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true, characters: allCharacters });
    expect(
      screen.queryByLabelText("Select character to add")
    ).not.toBeInTheDocument();
  });

  it("shows 'All characters already in session' when no available characters", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
        makeParticipant({ character_id: OTHER_CHAR_ID, character_name: "Maren" }),
      ],
    });
    renderComponent(session, { isGm: true, characters: allCharacters });
    expect(
      screen.getByText(/all characters are already in this session/i)
    ).toBeInTheDocument();
  });

  it("adding a participant calls POST /sessions/{id}/participants", async () => {
    let addCalled = false;
    let addBody: Record<string, unknown> = {};

    server.use(
      http.post(`${API_BASE}/sessions/${makeSession().id}/participants`, async ({ request }) => {
        addBody = (await request.json()) as Record<string, unknown>;
        addCalled = true;
        return HttpResponse.json(
          makeParticipant({ character_id: OTHER_CHAR_ID, character_name: "Maren" }),
          { status: 201 }
        );
      })
    );

    const session = makeSession({ status: "draft", participants: [] });
    renderComponent(session, { isGm: true, characters: allCharacters });

    // Select a character
    fireEvent.change(screen.getByLabelText("Select character to add"), {
      target: { value: OTHER_CHAR_ID },
    });

    // Click add button
    fireEvent.click(screen.getByRole("button", { name: /add selected participant/i }));

    await waitFor(() => {
      expect(addCalled).toBe(true);
    });
    expect(addBody).toMatchObject({ character_id: OTHER_CHAR_ID });
    await waitFor(() => {
      expect(screen.getByText("Participant added.")).toBeInTheDocument();
    });
  });
});

// ── Player view ────────────────────────────────────────────────────

describe("ParticipantManagement: player view", () => {
  it("player sees Join button when NOT a participant", () => {
    const session = makeSession({ status: "draft", participants: [] });
    renderComponent(session, { isGm: false, playerCharacterId: PLAYER_CHAR_ID });
    expect(
      screen.getByRole("button", { name: /join session/i })
    ).toBeInTheDocument();
  });

  it("player sees Leave button when IS a participant", () => {
    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: false, playerCharacterId: PLAYER_CHAR_ID });
    expect(
      screen.getByRole("button", { name: /leave session/i })
    ).toBeInTheDocument();
  });

  it("player does NOT see GM add participant dropdown", () => {
    const session = makeSession({ status: "draft", participants: [] });
    renderComponent(session, { isGm: false, playerCharacterId: PLAYER_CHAR_ID });
    expect(
      screen.queryByLabelText("Select character to add")
    ).not.toBeInTheDocument();
  });

  it("player sees NO join/leave for ended session", () => {
    const session = makeEndedSession({ participants: [] });
    renderComponent(session, { isGm: false, playerCharacterId: PLAYER_CHAR_ID });
    expect(screen.queryByRole("button", { name: /join session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /leave session/i })).not.toBeInTheDocument();
  });

  it("player join calls POST and shows toast", async () => {
    let joinCalled = false;
    const session = makeSession({
      id: "01SESSION_DRAFT000000000",
      status: "draft",
      participants: [],
    });

    server.use(
      http.post(`${API_BASE}/sessions/${session.id}/participants`, () => {
        joinCalled = true;
        return HttpResponse.json(
          makeParticipant({ session_id: session.id, character_id: PLAYER_CHAR_ID }),
          { status: 201 }
        );
      })
    );

    renderComponent(session, { isGm: false, playerCharacterId: PLAYER_CHAR_ID });
    fireEvent.click(screen.getByRole("button", { name: /join session/i }));

    await waitFor(() => {
      expect(joinCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByText("Joined session.")).toBeInTheDocument();
    });
  });
});

// ── Error handling ─────────────────────────────────────────────────

describe("ParticipantManagement: error handling", () => {
  it("shows error toast when remove fails", async () => {
    server.use(
      http.delete(
        `${API_BASE}/sessions/:id/participants/:charId`,
        () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "fail", details: null } },
            { status: 500 }
          )
      )
    );

    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });

    fireEvent.click(
      screen.getByRole("button", { name: /remove kael from session/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to remove participant.")).toBeInTheDocument();
    });
  });

  it("shows error toast when contribution update fails", async () => {
    server.use(
      http.patch(
        `${API_BASE}/sessions/:id/participants/:charId`,
        () =>
          HttpResponse.json(
            { error: { code: "server_error", message: "fail", details: null } },
            { status: 500 }
          )
      )
    );

    const session = makeSession({
      status: "draft",
      participants: [
        makeParticipant({ character_id: PLAYER_CHAR_ID, character_name: "Kael" }),
      ],
    });
    renderComponent(session, { isGm: true });

    fireEvent.click(
      screen.getByRole("checkbox", { name: /additional contribution for kael/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to update contribution flag.")
      ).toBeInTheDocument();
    });
  });
});
