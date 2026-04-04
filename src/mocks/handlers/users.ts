import { http, HttpResponse } from "msw";
import { playerA, gmUser } from "../fixtures/users";

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
];
