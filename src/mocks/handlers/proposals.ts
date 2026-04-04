import { http, HttpResponse } from "msw";
import {
  makeProposal,
  makeApprovedProposal,
  makeRejectedProposal,
} from "../fixtures/proposals";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

export const PROPOSAL_ID = "01PROPOSAL_DEFAULT000000";
export const APPROVED_PROPOSAL_ID = "01PROPOSAL_APPROVED00000";
export const REJECTED_PROPOSAL_ID = "01PROPOSAL_REJECTED00000";

/** Default calculated_effect fixture for use_skill */
export const MOCK_CALCULATED_EFFECT = {
  dice_pool: 4,
  skill: "finesse",
  skill_level: 3,
  modifiers: [],
  plot_spend: 0,
  costs: { trait_charges: [], plot: 0 },
};

// ── Default handlers ──────────────────────────────────────────────

export const proposalHandlers = [
  // GET /proposals — list with optional status/character_id filter
  http.get(`${API_BASE}/proposals`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (status === "pending") {
      return HttpResponse.json(paginatedList([makeProposal()]));
    }
    if (status === "approved") {
      return HttpResponse.json(paginatedList([makeApprovedProposal()]));
    }
    if (status === "rejected") {
      return HttpResponse.json(paginatedList([makeRejectedProposal()]));
    }

    // All proposals
    return HttpResponse.json(
      paginatedList([
        makeProposal(),
        makeApprovedProposal(),
        makeRejectedProposal(),
      ])
    );
  }),

  // GET /proposals/{id} — single proposal detail
  http.get(`${API_BASE}/proposals/:id`, ({ params }) => {
    const { id } = params as { id: string };
    if (id === APPROVED_PROPOSAL_ID) {
      return HttpResponse.json(makeApprovedProposal({ id }));
    }
    if (id === REJECTED_PROPOSAL_ID) {
      return HttpResponse.json(makeRejectedProposal({ id }));
    }
    return HttpResponse.json(makeProposal({ id }));
  }),

  // POST /proposals — submit new proposal
  http.post(`${API_BASE}/proposals`, async () => {
    return HttpResponse.json(
      makeProposal({ id: "01PROPOSAL_NEW000000000", status: "pending" }),
      { status: 201 }
    );
  }),

  // POST /proposals/calculate — dry-run calculated_effect
  http.post(`${API_BASE}/proposals/calculate`, async () => {
    return HttpResponse.json({ calculated_effect: MOCK_CALCULATED_EFFECT });
  }),

  // PATCH /proposals/{id} — update pending/rejected proposal
  http.patch(`${API_BASE}/proposals/:id`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(makeProposal({ id, status: "pending" }));
  }),

  // DELETE /proposals/{id}
  http.delete(`${API_BASE}/proposals/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// ── Error scenario factories ──────────────────────────────────────

/** Override DELETE to return 404 */
export function deleteProposalNotFoundHandler(proposalId: string) {
  return http.delete(
    `${API_BASE}/proposals/${proposalId}`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "Proposal not found",
            details: null,
          },
        },
        { status: 404 }
      )
  );
}

/** Override GET /proposals to return empty list */
export function emptyProposalsHandler() {
  return http.get(`${API_BASE}/proposals`, () =>
    HttpResponse.json(paginatedList([]))
  );
}

/** Override POST /proposals/calculate to return 422 with field errors */
export function calculateValidationErrorHandler(
  fields: Record<string, string> = { skill: "Invalid skill selection" }
) {
  return http.post(`${API_BASE}/proposals/calculate`, () =>
    HttpResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Validation failed",
          details: { fields },
        },
      },
      { status: 422 }
    )
  );
}

/** Override POST /proposals/calculate to return a specific calculated effect */
export function calculateSuccessHandler(
  calculatedEffect: Record<string, unknown> = MOCK_CALCULATED_EFFECT
) {
  return http.post(`${API_BASE}/proposals/calculate`, () =>
    HttpResponse.json({ calculated_effect: calculatedEffect })
  );
}

/** Override PATCH /proposals/:id to return 409 (already approved) */
export function patchProposalApprovedHandler(proposalId: string) {
  return http.patch(`${API_BASE}/proposals/${proposalId}`, () =>
    HttpResponse.json(
      {
        error: {
          code: "proposal_approved",
          message: "This proposal has already been approved",
          details: null,
        },
      },
      { status: 409 }
    )
  );
}
