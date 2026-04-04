import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { ClockResponse, GameObjectType } from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface CreateClockRequest {
  name: string;
  segments: number;
  associated_type?: GameObjectType;
  associated_id?: string;
  notes?: string;
}

export interface UpdateClockRequest {
  name?: string;
  segments?: number;
  notes?: string;
}

// ── Filters ────────────────────────────────────────────────────────

export interface ClockListFilters {
  associated_type?: GameObjectType;
  associated_id?: string;
  include_deleted?: boolean;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/** GET /clocks — paginated list of clocks */
export function listClocks(
  filters?: ClockListFilters
): Promise<PaginatedResponse<ClockResponse>> {
  return apiFetchPaginated<ClockResponse>("/clocks", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/** GET /clocks/{id} — clock detail */
export function getClock(id: string): Promise<ClockResponse> {
  return api.get<ClockResponse>(`/clocks/${id}`);
}

/** POST /clocks — create clock */
export function createClock(body: CreateClockRequest): Promise<ClockResponse> {
  return api.post<ClockResponse>("/clocks", body);
}

/** PATCH /clocks/{id} — update name, notes, segments */
export function updateClock(
  id: string,
  body: UpdateClockRequest
): Promise<ClockResponse> {
  return api.patch<ClockResponse>(`/clocks/${id}`, body);
}

/** DELETE /clocks/{id} — soft-delete */
export function deleteClock(id: string): Promise<void> {
  return api.del<void>(`/clocks/${id}`);
}
