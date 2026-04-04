import { http, HttpResponse } from "msw";
import {
  makeProposal,
  makeApprovedProposal,
  makeRejectedProposal,
} from "../fixtures/proposals";
import { makeCharacter } from "../fixtures/characters";
import { makeGroup, makeLocation } from "../fixtures/world";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

export const MOCK_DASHBOARD = {
  pending_proposals: 2,
  pc_summaries: [
    {
      id: "01CH_A0000000000000000000",
      name: "Alice",
      stress: 3,
      free_time: 10,
      plot: 2,
      gnosis: 15,
    },
    {
      id: "01CH_B0000000000000000000",
      name: "Bob",
      stress: 7,
      free_time: 5,
      plot: 1,
      gnosis: 8,
    },
  ],
  near_completion_clocks: [],
  stress_proximity: [
    {
      id: "01CH_B0000000000000000000",
      name: "Bob",
      stress: 7,
      effective_stress_max: 8,
    },
  ],
};

export const MOCK_QUEUE_SUMMARY = {
  pending_count: 2,
};

export const SYSTEM_PROPOSAL_ID = "01PROPOSAL_SYSTEM000000";
export const SYSTEM_CLOCK_PROPOSAL_ID = "01PROPOSAL_SYSCLOCK00000";

export const gmHandlers = [
  // GET /gm/dashboard
  http.get(`${API_BASE}/gm/dashboard`, () => {
    return HttpResponse.json(MOCK_DASHBOARD);
  }),

  // GET /gm/queue-summary
  http.get(`${API_BASE}/gm/queue-summary`, () => {
    return HttpResponse.json(MOCK_QUEUE_SUMMARY);
  }),

  // POST /proposals/{id}/approve
  http.post(`${API_BASE}/proposals/:id/approve`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeApprovedProposal({ id }));
  }),

  // POST /proposals/{id}/reject
  http.post(`${API_BASE}/proposals/:id/reject`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeRejectedProposal({ id }));
  }),

  // POST /gm/actions
  http.post(`${API_BASE}/gm/actions`, async () => {
    return HttpResponse.json({
      event: {
        id: "01EVENT_GMACTION0000000",
        type: "character.meter_updated",
        actor_type: "gm",
        actor_id: "01GM000000000000000000000",
        actor_name: "The GM",
        targets: [],
        primary_target_name: null,
        primary_target_type: null,
        changes: {},
        changes_summary: "Action applied",
        created_objects: null,
        deleted_objects: null,
        narrative: null,
        visibility: "bonded",
        proposal_id: null,
        parent_event_id: null,
        session_id: null,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // POST /gm/actions/batch
  http.post(`${API_BASE}/gm/actions/batch`, async ({ request }) => {
    const body = (await request.json()) as { actions: unknown[] };
    const events = body.actions.map((_: unknown, i: number) => ({
      id: `01EVENT_BATCH_${String(i).padStart(4, "0")}`,
      type: "character.meter_updated",
      actor_type: "gm",
      actor_id: "01GM000000000000000000000",
      actor_name: "The GM",
      targets: [],
      primary_target_name: null,
      primary_target_type: null,
      changes: {},
      changes_summary: "Action applied",
      created_objects: null,
      deleted_objects: null,
      narrative: null,
      visibility: "bonded",
      proposal_id: null,
      parent_event_id: null,
      session_id: null,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    return HttpResponse.json({ events });
  }),

  // POST /characters (GM create NPC)
  http.post(`${API_BASE}/characters`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string; notes?: string };
    return HttpResponse.json(makeCharacter({
      id: "01CHAR_NEW0000000000000",
      name: body.name,
      detail_level: "simplified",
      description: body.description ?? null,
      notes: body.notes ?? null,
      stress: null,
      free_time: null,
      plot: null,
      gnosis: null,
      skills: null,
      magic_stats: null,
      traits: null,
      magic_effects: null,
    }), { status: 201 });
  }),

  // PATCH /characters/{id}
  http.patch(`${API_BASE}/characters/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<{ name: string; description: string; notes: string }>;
    return HttpResponse.json(makeCharacter({ id, ...body }));
  }),

  // DELETE /characters/{id}
  http.delete(`${API_BASE}/characters/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /groups
  http.post(`${API_BASE}/groups`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string; notes?: string };
    return HttpResponse.json(makeGroup({
      id: "01GROUP_NEW0000000000000",
      name: body.name,
      description: body.description ?? null,
      notes: body.notes ?? null,
    }), { status: 201 });
  }),

  // PATCH /groups/{id}
  http.patch(`${API_BASE}/groups/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<{ name: string; description: string; notes: string }>;
    return HttpResponse.json(makeGroup({ id, ...body }));
  }),

  // DELETE /groups/{id}
  http.delete(`${API_BASE}/groups/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /locations
  http.post(`${API_BASE}/locations`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string; parent_id?: string; notes?: string };
    return HttpResponse.json(makeLocation({
      id: "01LOC_NEW00000000000000",
      name: body.name,
      description: body.description ?? null,
      parent_id: body.parent_id ?? null,
      notes: body.notes ?? null,
    }), { status: 201 });
  }),

  // PATCH /locations/{id}
  http.patch(`${API_BASE}/locations/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<{ name: string; description: string; notes: string }>;
    return HttpResponse.json(makeLocation({ id, ...body }));
  }),

  // DELETE /locations/{id}
  http.delete(`${API_BASE}/locations/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// ── Factory helpers ───────────────────────────────────────────────

export function makeSystemTraumaProposal() {
  return makeProposal({
    id: SYSTEM_PROPOSAL_ID,
    action_type: "resolve_trauma",
    origin: "system",
    status: "pending",
    narrative: "Alice has reached maximum stress. A bond must become a Trauma.",
    character_id: "01CH_A0000000000000000000",
    calculated_effect: null,
    selections: {},
  });
}

export function makeSystemClockProposal() {
  return makeProposal({
    id: SYSTEM_CLOCK_PROPOSAL_ID,
    action_type: "resolve_clock",
    origin: "system",
    status: "pending",
    narrative: "The Doomsday Clock has reached completion.",
    character_id: null,
    calculated_effect: null,
    selections: {},
    clock_id: "01CLOCK_DOOMSDAY0000000",
  });
}

// ── Error scenario factories ──────────────────────────────────────

/** Override approve to return 409 (already approved) */
export function approveAlreadyApprovedHandler(proposalId: string) {
  return http.post(
    `${API_BASE}/proposals/${proposalId}/approve`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "proposal_not_pending",
            message: "Proposal is not in pending status",
            details: null,
          },
        },
        { status: 409 }
      )
  );
}

/** Override reject to return 409 */
export function rejectAlreadyResolvedHandler(proposalId: string) {
  return http.post(
    `${API_BASE}/proposals/${proposalId}/reject`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "proposal_not_pending",
            message: "Proposal is not in pending status",
            details: null,
          },
        },
        { status: 409 }
      )
  );
}

/** Override GET /gm/queue-summary to return empty queue */
export function emptyQueueSummaryHandler() {
  return http.get(
    `${API_BASE}/gm/queue-summary`,
    () => HttpResponse.json({ pending_count: 0 })
  );
}

/** Override GET /gm/dashboard to return empty PC list */
export function emptyDashboardHandler() {
  return http.get(`${API_BASE}/gm/dashboard`, () =>
    HttpResponse.json({
      pending_proposals: 0,
      pc_summaries: [],
      near_completion_clocks: [],
      stress_proximity: [],
    })
  );
}

/** Override GET /proposals for queue to return pending list */
export function pendingProposalsQueueHandler(proposals = [makeProposal()]) {
  return http.get(`${API_BASE}/proposals`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status === "pending") {
      return HttpResponse.json(paginatedList(proposals));
    }
    return HttpResponse.json(paginatedList([]));
  });
}
