import { http, HttpResponse } from "msw";
import { makeGroup, makeLocation, makeStory } from "../fixtures/world";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

// ── Canonical world IDs ────────────────────────────────────────────

export const GROUP_ID = "01GROUP_DEFAULT000000000";
export const LOCATION_ID = "01LOC_DEFAULT0000000000";
export const STORY_ID = "01STORY_DEFAULT000000000";
export const ENTRY_ID_1 = "01ENTRY_0000000000000001";

// ── Handlers ──────────────────────────────────────────────────────

export const worldHandlers = [
  // ── Groups ──────────────────────────────────────────────────────

  // GET /groups — list
  http.get(`${API_BASE}/groups`, () => {
    return HttpResponse.json(paginatedList([makeGroup()]));
  }),

  // GET /groups/{id} — detail
  http.get(`${API_BASE}/groups/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeGroup({ id }));
  }),

  // GET /groups/{id}/feed
  http.get(`${API_BASE}/groups/:id/feed`, () => {
    return HttpResponse.json(paginatedList([]));
  }),

  // ── Locations ────────────────────────────────────────────────────

  // GET /locations — list
  http.get(`${API_BASE}/locations`, () => {
    return HttpResponse.json(paginatedList([makeLocation()]));
  }),

  // GET /locations/{id} — detail
  http.get(`${API_BASE}/locations/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeLocation({ id }));
  }),

  // GET /locations/{id}/feed
  http.get(`${API_BASE}/locations/:id/feed`, () => {
    return HttpResponse.json(paginatedList([]));
  }),

  // ── Stories ──────────────────────────────────────────────────────

  // GET /stories — list
  http.get(`${API_BASE}/stories`, () => {
    return HttpResponse.json(paginatedList([makeStory()]));
  }),

  // GET /stories/{id} — detail
  http.get(`${API_BASE}/stories/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeStory({ id }));
  }),

  // GET /stories/{id}/entries — paginated entries
  http.get(`${API_BASE}/stories/:id/entries`, ({ params }) => {
    const { id } = params as { id: string };
    const story = makeStory({ id });
    return HttpResponse.json(paginatedList(story.entries));
  }),

  // POST /stories/{id}/entries — add entry
  http.post(`${API_BASE}/stories/:id/entries`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { text: string; character_id?: string };
    const newEntry = {
      id: `01ENTRY_NEW_${Date.now()}`,
      text: body.text,
      author_id: "01USER_PLAYER000000000",
      character_id: body.character_id ?? null,
      session_id: null,
      created_at: new Date().toISOString(),
    };
    void id;
    return HttpResponse.json(newEntry, { status: 201 });
  }),

  // PATCH /stories/{id}/entries/{entryId} — edit entry
  http.patch(
    `${API_BASE}/stories/:id/entries/:entryId`,
    async ({ params, request }) => {
      const { id, entryId } = params as { id: string; entryId: string };
      const body = (await request.json()) as { text: string };
      void id;
      return HttpResponse.json({
        id: entryId,
        text: body.text,
        author_id: "01USER_PLAYER000000000",
        character_id: "01CHAR_DEFAULT0000000000",
        session_id: null,
        created_at: "2026-01-15T10:00:00Z",
      });
    }
  ),

  // DELETE /stories/{id}/entries/{entryId} — delete entry
  http.delete(
    `${API_BASE}/stories/:id/entries/:entryId`,
    ({ params }) => {
      void params;
      return new HttpResponse(null, { status: 204 });
    }
  ),
];
