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
