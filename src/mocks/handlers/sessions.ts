import { http, HttpResponse } from "msw";
import {
  makeSession,
  makeActiveSession,
  makeEndedSession,
  makeParticipant,
} from "../fixtures/sessions";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

export const SESSION_ID = "01SESSION_DEFAULT0000000";
export const ACTIVE_SESSION_ID = "01SESSION_ACTIVE00000000";
export const ENDED_SESSION_ID = "01SESSION_ENDED00000000";

// ── Default handlers ──────────────────────────────────────────────

export const sessionHandlers = [
  // GET /sessions — list with optional status filter
  http.get(`${API_BASE}/sessions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (status === "active") {
      return HttpResponse.json(paginatedList([makeActiveSession()]));
    }
    if (status === "draft") {
      return HttpResponse.json(paginatedList([makeSession()]));
    }
    if (status === "ended") {
      return HttpResponse.json(paginatedList([makeEndedSession()]));
    }

    // All sessions
    return HttpResponse.json(
      paginatedList([
        makeActiveSession(),
        makeSession(),
        makeEndedSession(),
      ])
    );
  }),

  // GET /sessions/{id} — session detail
  http.get(`${API_BASE}/sessions/:id`, ({ params }) => {
    const { id } = params as { id: string };
    if (id === ACTIVE_SESSION_ID) {
      return HttpResponse.json(makeActiveSession({ id }));
    }
    if (id === ENDED_SESSION_ID) {
      return HttpResponse.json(makeEndedSession({ id }));
    }
    return HttpResponse.json(makeSession({ id }));
  }),

  // POST /sessions — create draft
  http.post(`${API_BASE}/sessions`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return HttpResponse.json(
      makeSession({
        id: "01SESSION_NEW000000000",
        summary: (body.summary as string) ?? "New session",
        time_now: (body.time_now as number) ?? null,
        notes: (body.notes as string) ?? null,
      }),
      { status: 201 }
    );
  }),

  // PATCH /sessions/{id} — update
  http.patch(`${API_BASE}/sessions/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeSession({ id }));
  }),

  // DELETE /sessions/{id} — hard-delete draft
  http.delete(`${API_BASE}/sessions/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /sessions/{id}/start
  http.post(`${API_BASE}/sessions/:id/start`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeActiveSession({ id }));
  }),

  // POST /sessions/{id}/end
  http.post(`${API_BASE}/sessions/:id/end`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeEndedSession({ id }));
  }),

  // POST /sessions/{id}/participants — add participant
  http.post(`${API_BASE}/sessions/:id/participants`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json(
      makeParticipant({
        session_id: id,
        character_id: (body.character_id as string) ?? "01CHAR_DEFAULT0000000000",
        additional_contribution: (body.additional_contribution as boolean) ?? false,
      }),
      { status: 201 }
    );
  }),

  // DELETE /sessions/{id}/participants/{character_id}
  http.delete(`${API_BASE}/sessions/:id/participants/:characterId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /sessions/{id}/participants/{character_id}
  http.patch(
    `${API_BASE}/sessions/:id/participants/:characterId`,
    async ({ params, request }) => {
      const { id, characterId } = params as { id: string; characterId: string };
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      return HttpResponse.json(
        makeParticipant({
          session_id: id,
          character_id: characterId,
          additional_contribution: (body.additional_contribution as boolean) ?? false,
        })
      );
    }
  ),
];

// ── Error scenario factories ──────────────────────────────────────

/** Override POST /sessions/{id}/start to return 409 (another session already active) */
export function startSessionConflictHandler(sessionId: string) {
  return http.post(
    `${API_BASE}/sessions/${sessionId}/start`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "session_already_active",
            message: "Another session is already active",
            details: null,
          },
        },
        { status: 409 }
      )
  );
}

/** Override DELETE /sessions/{id} to return 400 (cannot delete non-draft) */
export function deleteNonDraftHandler(sessionId: string) {
  return http.delete(
    `${API_BASE}/sessions/${sessionId}`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "session_not_draft",
            message: "Only draft sessions can be deleted",
            details: null,
          },
        },
        { status: 400 }
      )
  );
}

/** Override GET /sessions to return no sessions */
export function emptySessionsHandler() {
  return http.get(`${API_BASE}/sessions`, () =>
    HttpResponse.json(paginatedList([]))
  );
}

/** Override GET /sessions to return only active session (for active session banner) */
export function activeSessionOnlyHandler() {
  return http.get(`${API_BASE}/sessions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status === "active") {
      return HttpResponse.json(paginatedList([makeActiveSession()]));
    }
    return HttpResponse.json(paginatedList([makeActiveSession()]));
  });
}

/** Override GET /sessions to return no active session */
export function noActiveSessionHandler() {
  return http.get(`${API_BASE}/sessions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status === "active") {
      return HttpResponse.json(paginatedList([]));
    }
    return HttpResponse.json(paginatedList([makeSession()]));
  });
}
