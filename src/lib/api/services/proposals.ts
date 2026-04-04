import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type {
  ProposalResponse,
  ProposalStatus,
  ActionType,
} from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface SubmitProposalRequest {
  character_id: string;
  action_type: ActionType;
  narrative?: string;
  selections?: Record<string, unknown>;
}

export interface UpdateProposalRequest {
  narrative?: string;
  selections?: Record<string, unknown>;
}

export interface ApproveProposalRequest {
  narrative?: string | null;
  gm_overrides?: Record<string, unknown> | null;
  rider_event?: Record<string, unknown> | null;
}

export interface RejectProposalRequest {
  rejection_note?: string;
}

export interface CalculateProposalRequest {
  character_id: string;
  action_type: ActionType;
  narrative?: string;
  selections?: Record<string, unknown>;
}

export interface CalculateProposalResponse {
  calculated_effect: Record<string, unknown>;
}

// ── List / Detail ──────────────────────────────────────────────────

export interface ProposalListFilters {
  status?: ProposalStatus;
  character_id?: string;
  action_type?: ActionType;
  after?: string;
  limit?: number;
}

/** GET /proposals — paginated list of proposals */
export function listProposals(
  filters?: ProposalListFilters
): Promise<PaginatedResponse<ProposalResponse>> {
  return apiFetchPaginated<ProposalResponse>(
    "/proposals",
    filters as Record<string, string | number | boolean | null | undefined>
  );
}

/** GET /proposals/{id} — single proposal detail */
export function getProposal(id: string): Promise<ProposalResponse> {
  return api.get<ProposalResponse>(`/proposals/${id}`);
}

// ── Mutations ──────────────────────────────────────────────────────

/** POST /proposals — submit a new proposal */
export function submitProposal(
  body: SubmitProposalRequest
): Promise<ProposalResponse> {
  return api.post<ProposalResponse>("/proposals", body);
}

/** PATCH /proposals/{id} — update a pending or rejected proposal */
export function updateProposal(
  id: string,
  body: UpdateProposalRequest
): Promise<ProposalResponse> {
  return api.patch<ProposalResponse>(`/proposals/${id}`, body);
}

/** DELETE /proposals/{id} — hard-delete a pending or rejected proposal */
export function deleteProposal(id: string): Promise<void> {
  return api.del<void>(`/proposals/${id}`);
}

/** POST /proposals/{id}/approve — GM approves with optional overrides */
export function approveProposal(
  id: string,
  body?: ApproveProposalRequest
): Promise<ProposalResponse> {
  return api.post<ProposalResponse>(`/proposals/${id}/approve`, body ?? {});
}

/** POST /proposals/{id}/reject — GM rejects with optional note */
export function rejectProposal(
  id: string,
  body?: RejectProposalRequest
): Promise<ProposalResponse> {
  return api.post<ProposalResponse>(`/proposals/${id}/reject`, body ?? {});
}

/** POST /proposals/calculate — dry-run: compute calculated_effect without persisting */
export function calculateProposal(
  body: CalculateProposalRequest
): Promise<CalculateProposalResponse> {
  return api.post<CalculateProposalResponse>("/proposals/calculate", body);
}
