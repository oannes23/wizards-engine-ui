import { http, HttpResponse } from "msw";
import { makeClock, makeTraitTemplate } from "../fixtures/clocks";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

export const CLOCK_ID = "01CLOCK_DEFAULT000000000";
export const TEMPLATE_ID = "01TEMPLATE_DEFAULT000000";

export const clockHandlers = [
  // ── Clocks ────────────────────────────────────────────────────────

  // GET /clocks
  http.get(`${API_BASE}/clocks`, () => {
    return HttpResponse.json(paginatedList([makeClock(), makeClock({
      id: "01CLOCK_NEAR00000000000",
      name: "Ritual Preparation",
      segments: 8,
      progress: 7,
    })]));
  }),

  // GET /clocks/{id}
  http.get(`${API_BASE}/clocks/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeClock({ id }));
  }),

  // POST /clocks
  http.post(`${API_BASE}/clocks`, async ({ request }) => {
    const body = (await request.json()) as { name: string; segments: number; notes?: string };
    return HttpResponse.json(makeClock({
      id: "01CLOCK_NEW0000000000000",
      name: body.name,
      segments: body.segments,
      notes: body.notes ?? null,
    }), { status: 201 });
  }),

  // PATCH /clocks/{id}
  http.patch(`${API_BASE}/clocks/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<{ name: string; segments: number; notes: string }>;
    return HttpResponse.json(makeClock({ id, ...body }));
  }),

  // DELETE /clocks/{id}
  http.delete(`${API_BASE}/clocks/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Trait Templates ───────────────────────────────────────────────

  // GET /trait-templates
  http.get(`${API_BASE}/trait-templates`, () => {
    return HttpResponse.json(paginatedList([makeTraitTemplate(), {
      ...makeTraitTemplate(),
      id: "01TEMPLATE_ROLE00000000",
      name: "Gifted Mage",
      description: "Natural talent for magical arts",
      type: "role",
    }]));
  }),

  // GET /trait-templates/{id}
  http.get(`${API_BASE}/trait-templates/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeTraitTemplate({ id }));
  }),

  // POST /trait-templates
  http.post(`${API_BASE}/trait-templates`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description: string; type: string };
    return HttpResponse.json(makeTraitTemplate({
      id: "01TEMPLATE_NEW000000000",
      name: body.name,
      description: body.description,
      type: body.type as "core" | "role",
    }), { status: 201 });
  }),

  // PATCH /trait-templates/{id}
  http.patch(`${API_BASE}/trait-templates/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<{ name: string; description: string }>;
    return HttpResponse.json(makeTraitTemplate({ id, ...body }));
  }),

  // DELETE /trait-templates/{id}
  http.delete(`${API_BASE}/trait-templates/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
