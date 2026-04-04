import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { GroupDetailResponse } from "../types";

// ── Filters ────────────────────────────────────────────────────────

export interface GroupListFilters {
  name?: string;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * GET /groups — Paginated list of groups.
 */
export function listGroups(
  filters?: GroupListFilters
): Promise<PaginatedResponse<GroupDetailResponse>> {
  return apiFetchPaginated<GroupDetailResponse>("/groups", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /groups/{id} — Group detail (traits, bonds, computed members).
 */
export function getGroup(id: string): Promise<GroupDetailResponse> {
  return api.get<GroupDetailResponse>(`/groups/${id}`);
}
