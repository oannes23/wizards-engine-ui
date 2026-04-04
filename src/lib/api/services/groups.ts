import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { GroupDetailResponse } from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface CreateGroupRequest {
  name: string;
  description?: string;
  notes?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  notes?: string;
}

// ── Filters ────────────────────────────────────────────────────────

export interface GroupListFilters {
  name?: string;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * POST /groups — Create a new group.
 */
export function createGroup(body: CreateGroupRequest): Promise<GroupDetailResponse> {
  return api.post<GroupDetailResponse>("/groups", body);
}

/**
 * PATCH /groups/{id} — Update name, description, notes.
 */
export function updateGroup(
  id: string,
  body: UpdateGroupRequest
): Promise<GroupDetailResponse> {
  return api.patch<GroupDetailResponse>(`/groups/${id}`, body);
}

/**
 * DELETE /groups/{id} — Soft-delete.
 */
export function deleteGroup(id: string): Promise<void> {
  return api.del<void>(`/groups/${id}`);
}

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
