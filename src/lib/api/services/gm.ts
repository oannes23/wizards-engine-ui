import { api } from "../client";
import type { GmDashboardResponse } from "../types";

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
