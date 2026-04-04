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
import { gmUser, playerA, playerB, makeInvite } from "@/mocks/fixtures/users";
import { paginatedList } from "@/mocks/fixtures/helpers";
import GmPlayersPage from "./page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router mock ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/players",
}));

// ── Auth mock (GM) ────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: gmUser,
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

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Default handlers ──────────────────────────────────────────────

const defaultPlayersHandler = http.get(`${API_BASE}/players`, () =>
  HttpResponse.json(
    paginatedList([
      { ...gmUser, login_url: "http://localhost:3000/login/gm-code", is_active: true },
      { ...playerA, login_url: "http://localhost:3000/login/alice-code", is_active: true },
      { ...playerB, login_url: "http://localhost:3000/login/bob-code", is_active: false },
    ])
  )
);

const playerInvite = makeInvite({
  id: "01INVITE_PLAYER000000000",
  role: "player",
  is_consumed: false,
  login_url: "http://localhost:3000/login/invite-player",
  created_at: "2026-01-01T10:00:00Z",
});

const consumedInvite = makeInvite({
  id: "01INVITE_CONSUMED0000000",
  role: "player",
  is_consumed: true,
  login_url: "http://localhost:3000/login/invite-consumed",
  created_at: "2026-01-02T10:00:00Z",
});

const defaultInvitesHandler = http.get(`${API_BASE}/game/invites`, () =>
  HttpResponse.json(paginatedList([playerInvite, consumedInvite]))
);

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <GmPlayersPage />
    </TestProviders>
  );
}

// ── Story 3.4.1: Players Roster ───────────────────────────────────

describe("GmPlayersPage — players roster", () => {
  it("renders the page heading", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    expect(await screen.findByRole("heading", { name: /players & invites/i })).toBeInTheDocument();
  });

  it("lists all players with display names", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    expect(await screen.findByText("The GM")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows role badges for each player", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("The GM");
    // Role badges rendered (gm, player, player)
    expect(screen.getByText("gm")).toBeInTheDocument();
    expect(screen.getAllByText("player").length).toBeGreaterThanOrEqual(1);
  });

  it("shows active/inactive status badge from is_active field", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("The GM");
    // Active users show "Active" badge
    const activeBadges = screen.getAllByText("Active");
    expect(activeBadges.length).toBeGreaterThanOrEqual(2);
    // Inactive user shows "Inactive" badge
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows login URL with copy button for each player", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("The GM");
    expect(screen.getByText(/gm-code/)).toBeInTheDocument();
    // Copy buttons present
    const copyButtons = screen.getAllByRole("button", { name: /copy login url/i });
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no players", async () => {
    server.use(
      http.get(`${API_BASE}/players`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      defaultInvitesHandler
    );
    renderPage();
    expect(await screen.findByText(/no players yet/i)).toBeInTheDocument();
  });

  it("shows error state when players fetch fails", async () => {
    server.use(
      http.get(`${API_BASE}/players`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        )
      ),
      defaultInvitesHandler
    );
    renderPage();
    expect(await screen.findByText(/could not load players/i)).toBeInTheDocument();
  });
});

// ── Story 3.4.2: Invite Management ───────────────────────────────

describe("GmPlayersPage — invite management", () => {
  it("shows invites section heading", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    // Use level 2 to distinguish from the h1 "Players & Invites"
    const invitesHeading = await screen.findByRole("heading", { level: 2, name: /^invites$/i });
    expect(invitesHeading).toBeInTheDocument();
  });

  it("renders unconsumed invite with Unused badge", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    expect(await screen.findByText("Unused")).toBeInTheDocument();
  });

  it("renders consumed invite with Used badge", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    expect(await screen.findByText("Used")).toBeInTheDocument();
  });

  it("shows invite URL for unconsumed invite", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    expect(await screen.findByText(/invite-player/)).toBeInTheDocument();
  });

  it("does not show invite URL for consumed invite", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("Used");
    expect(screen.queryByText(/invite-consumed/)).not.toBeInTheDocument();
  });

  it("generates a new invite on button click", async () => {
    let postCalled = false;
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.post(`${API_BASE}/game/invites`, async () => {
        postCalled = true;
        return HttpResponse.json(
          {
            id: "01INVITE_NEW0000000000000",
            is_consumed: false,
            role: "player",
            login_url: "http://localhost:3000/login/brand-new-invite",
            created_at: new Date().toISOString(),
          },
          { status: 201 }
        );
      }),
      // Re-add GET handler to avoid unhandled after invalidation
      http.get(`${API_BASE}/game/invites`, () =>
        HttpResponse.json(paginatedList([playerInvite, consumedInvite]))
      )
    );

    renderPage();
    const generateBtn = await screen.findByRole("button", { name: /generate invite/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(postCalled).toBe(true);
    });
    expect(await screen.findByText(/brand-new-invite/i)).toBeInTheDocument();
  });

  it("shows error toast when invite generation fails", async () => {
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.post(`${API_BASE}/game/invites`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "fail", details: null } },
          { status: 500 }
        )
      )
    );

    renderPage();
    const generateBtn = await screen.findByRole("button", { name: /generate invite/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to generate invite link/i)).toBeInTheDocument();
    });
  });

  it("shows a confirm modal before deleting an invite", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();

    const deleteBtn = await screen.findByRole("button", { name: /delete invite/i });
    fireEvent.click(deleteBtn);

    expect(await screen.findByRole("heading", { name: /delete invite/i })).toBeInTheDocument();
  });

  it("deletes an invite after confirm", async () => {
    let deleteCalled = false;
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.delete(`${API_BASE}/game/invites/${playerInvite.id}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API_BASE}/game/invites`, () =>
        HttpResponse.json(paginatedList([consumedInvite]))
      )
    );

    renderPage();
    const deleteBtn = await screen.findByRole("button", { name: /delete invite/i });
    fireEvent.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it("shows error toast when delete fails", async () => {
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.delete(`${API_BASE}/game/invites/:id`, () =>
        HttpResponse.json(
          { error: { code: "already_consumed", message: "Cannot delete consumed invite", details: null } },
          { status: 409 }
        )
      )
    );

    renderPage();
    const deleteBtn = await screen.findByRole("button", { name: /delete invite/i });
    fireEvent.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete invite/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no invites", async () => {
    server.use(
      defaultPlayersHandler,
      http.get(`${API_BASE}/game/invites`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );
    renderPage();
    expect(await screen.findByText(/no invites yet/i)).toBeInTheDocument();
  });

  it("shows error state when invites fetch fails", async () => {
    server.use(
      defaultPlayersHandler,
      http.get(`${API_BASE}/game/invites`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        )
      )
    );
    renderPage();
    expect(await screen.findByText(/could not load invites/i)).toBeInTheDocument();
  });
});

// ── Story 3.4.3: Token Regeneration ──────────────────────────────

describe("GmPlayersPage — token regeneration", () => {
  it("shows a Regen Link button for each player", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("Alice");
    // Buttons have aria-label "Regenerate token for {name}"
    const regenButtons = screen.getAllByRole("button", { name: /regenerate token for/i });
    expect(regenButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("opens a confirm modal before regenerating", async () => {
    server.use(defaultPlayersHandler, defaultInvitesHandler);
    renderPage();
    await screen.findByText("Alice");

    // Click the first regen button (any player)
    const regenBtn = screen.getAllByRole("button", { name: /regenerate token for/i })[0];
    fireEvent.click(regenBtn);

    expect(
      await screen.findByRole("heading", { name: /regenerate login link/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/invalidate.*current login link/i)
    ).toBeInTheDocument();
  });

  it("calls regenerate-token endpoint after confirming", async () => {
    let regenerateCalled = false;
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.post(`${API_BASE}/players/${playerA.id}/regenerate-token`, () => {
        regenerateCalled = true;
        return HttpResponse.json({
          login_url: "http://localhost:3000/login/regenerated-alice",
        });
      })
    );

    renderPage();
    await screen.findByText("Alice");

    // Find the regen button for Alice specifically
    const aliceRegenBtn = screen.getByRole("button", {
      name: new RegExp(`regenerate token for alice`, "i"),
    });
    fireEvent.click(aliceRegenBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^regenerate$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(regenerateCalled).toBe(true);
    });
  });

  it("shows the new login URL after regenerating", async () => {
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.post(`${API_BASE}/players/${playerA.id}/regenerate-token`, () =>
        HttpResponse.json({
          login_url: "http://localhost:3000/login/regenerated-alice",
        })
      )
    );

    renderPage();
    await screen.findByText("Alice");

    const aliceRegenBtn = screen.getByRole("button", {
      name: new RegExp(`regenerate token for alice`, "i"),
    });
    fireEvent.click(aliceRegenBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^regenerate$/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText(/regenerated-alice/i)).toBeInTheDocument();
  });

  it("shows error toast when regeneration fails", async () => {
    server.use(
      defaultPlayersHandler,
      defaultInvitesHandler,
      http.post(`${API_BASE}/players/${playerA.id}/regenerate-token`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        )
      )
    );

    renderPage();
    await screen.findByText("Alice");

    const aliceRegenBtn = screen.getByRole("button", {
      name: new RegExp(`regenerate token for alice`, "i"),
    });
    fireEvent.click(aliceRegenBtn);

    const confirmBtn = await screen.findByRole("button", { name: /^regenerate$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to regenerate token/i)).toBeInTheDocument();
    });
  });
});
