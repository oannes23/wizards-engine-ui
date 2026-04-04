import { api } from "../client";
import type { GmDashboardResponse, GmActionRequest, EventResponse } from "../types";

// ── GM Queue Summary ──────────────────────────────────────────────

export interface GmQueueSummaryResponse {
  pending_count: number;
}

/** GET /gm/queue-summary — lightweight pending proposal count */
export function getGmQueueSummary(): Promise<GmQueueSummaryResponse> {
  return api.get<GmQueueSummaryResponse>("/gm/queue-summary");
}

// ── GM Dashboard ──────────────────────────────────────────────────

/** GET /gm/dashboard — aggregated PC state + pending count */
export function getGmDashboard(): Promise<GmDashboardResponse> {
  return api.get<GmDashboardResponse>("/gm/dashboard");
}

// ── GM Actions ────────────────────────────────────────────────────

export interface GmActionResponse {
  event: EventResponse;
}

export interface GmBatchActionResponse {
  events: EventResponse[];
}

/** POST /gm/actions — execute single GM action */
export function executeGmAction(body: GmActionRequest): Promise<GmActionResponse> {
  return api.post<GmActionResponse>("/gm/actions", body);
}

/** POST /gm/actions/batch — execute 1–50 actions atomically */
export function executeGmBatchActions(
  actions: GmActionRequest[]
): Promise<GmBatchActionResponse> {
  return api.post<GmBatchActionResponse>("/gm/actions/batch", { actions });
}
