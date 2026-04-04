import { http, HttpResponse } from "msw";
import { gmUser } from "../fixtures/users";

const API_BASE = "http://localhost:8000/api/v1";

export const authHandlers = [
  http.get(`${API_BASE}/me`, () => {
    return HttpResponse.json(gmUser);
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { code: string };
    if (body.code === "valid-user-code") {
      return HttpResponse.json({
        id: "01GM000000000000000000000",
        display_name: "The GM",
        role: "gm",
        character_id: null,
      });
    }
    if (body.code === "valid-player-code") {
      return HttpResponse.json({
        id: "01PL_A0000000000000000000",
        display_name: "Alice",
        role: "player",
        character_id: "01CH_A0000000000000000000",
      });
    }
    if (body.code === "valid-invite-code") {
      return HttpResponse.json({});
    }
    return HttpResponse.json(
      { error: { code: "code_not_found", message: "Invalid code", details: null } },
      { status: 404 }
    );
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_BASE}/setup`, async ({ request }) => {
    const body = await request.json() as { display_name: string };
    if (body.display_name === "already-setup") {
      return HttpResponse.json(
        { error: { code: "gm_exists", message: "GM already exists", details: null } },
        { status: 409 }
      );
    }
    return HttpResponse.json({
      id: "01GM000000000000000000000",
      display_name: body.display_name,
      role: "gm",
      login_url: "http://localhost:3000/login/test-code",
    });
  }),

  http.post(`${API_BASE}/game/join`, async ({ request }) => {
    const body = await request.json() as { code: string; display_name: string; character_name?: string };
    if (body.code === "invalid-invite") {
      return HttpResponse.json(
        { error: { code: "invite_not_found", message: "Invite not found", details: null } },
        { status: 404 }
      );
    }
    if (body.code === "consumed-invite") {
      return HttpResponse.json(
        { error: { code: "invite_consumed", message: "Invite already used", details: null } },
        { status: 409 }
      );
    }
    return HttpResponse.json({
      id: "01PL_A0000000000000000000",
      display_name: body.display_name,
      role: "player",
      character_id: "01CH_A0000000000000000000",
    });
  }),
];
