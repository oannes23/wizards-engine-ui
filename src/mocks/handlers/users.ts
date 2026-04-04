import { http, HttpResponse } from "msw";
import { playerA, gmUser, playerInvite, viewerInvite } from "../fixtures/users";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

// ── Shared fixture — importable by tests ───────────────────────────

export const starredFixture = {
  items: [
    { type: "character", id: "01CH_NPC000000000000000", name: "Mira Dusk" },
    { type: "group", id: "01GRP000000000000000000", name: "The Council" },
    { type: "location", id: "01LOC000000000000000000", name: "The Archive" },
  ],
};

// ── Handlers ──────────────────────────────────────────────────────

export const usersHandlers = [
  // PATCH /me — update display name
  http.patch(`${API_BASE}/me`, async ({ request }) => {
    const body = await request.json() as { display_name?: string };
    return HttpResponse.json({
      ...playerA,
      display_name: body.display_name ?? playerA.display_name,
    });
  }),

  // POST /me/refresh-link — rotate login code
  http.post(`${API_BASE}/me/refresh-link`, () => {
    return HttpResponse.json({
      login_url: "http://localhost:3000/login/new-rotated-code-abc123",
    });
  }),

  // GET /players
  http.get(`${API_BASE}/players`, () => {
    return HttpResponse.json({
      items: [gmUser, playerA],
      next_cursor: null,
      has_more: false,
    });
  }),

  // GET /me/starred — starred objects (uses starredFixture as default)
  http.get(`${API_BASE}/me/starred`, () => {
    return HttpResponse.json(starredFixture);
  }),

  // POST /me/starred — star an object (idempotent)
  http.post(`${API_BASE}/me/starred`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /me/starred/:type/:id — unstar (idempotent)
  http.delete(`${API_BASE}/me/starred/:type/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /players/:id/regenerate-token — rotate player's login code (GM only)
  http.post(`${API_BASE}/players/:id/regenerate-token`, ({ params }) => {
    return HttpResponse.json({
      login_url: `http://localhost:3000/login/regenerated-${params.id as string}`,
    });
  }),

  // POST /me/character — GM creates their own character
  http.post(`${API_BASE}/me/character`, async ({ request }) => {
    const body = await request.json() as { name: string; description?: string };
    return HttpResponse.json(
      {
        ...gmUser,
        character_id: "01CH_GM00000000000000000",
        display_name: body.name ?? "GM Character",
      },
      { status: 201 }
    );
  }),

  // GET /game/invites — list all invites (GM/Viewer)
  http.get(`${API_BASE}/game/invites`, () => {
    return HttpResponse.json(paginatedList([playerInvite, viewerInvite]));
  }),

  // POST /game/invites — generate a new invite
  http.post(`${API_BASE}/game/invites`, async ({ request }) => {
    const body = await request.json() as { role?: "player" | "viewer" };
    return HttpResponse.json(
      {
        id: "01INVITE_NEW0000000000000",
        is_consumed: false,
        role: body.role ?? "player",
        login_url: "http://localhost:3000/login/01INVITE_NEW0000000000000",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // DELETE /game/invites/:id — delete unconsumed invite
  http.delete(`${API_BASE}/game/invites/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
