import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { LocationDetailResponse } from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface CreateLocationRequest {
  name: string;
  description?: string;
  parent_id?: string;
  notes?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  notes?: string;
}

// ── Filters ────────────────────────────────────────────────────────

export interface LocationListFilters {
  name?: string;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * POST /locations — Create a new location.
 */
export function createLocation(
  body: CreateLocationRequest
): Promise<LocationDetailResponse> {
  return api.post<LocationDetailResponse>("/locations", body);
}

/**
 * PATCH /locations/{id} — Update name, description, notes.
 */
export function updateLocation(
  id: string,
  body: UpdateLocationRequest
): Promise<LocationDetailResponse> {
  return api.patch<LocationDetailResponse>(`/locations/${id}`, body);
}

/**
 * DELETE /locations/{id} — Soft-delete.
 */
export function deleteLocation(id: string): Promise<void> {
  return api.del<void>(`/locations/${id}`);
}

/**
 * GET /locations — Paginated list of locations.
 */
export function listLocations(
  filters?: LocationListFilters
): Promise<PaginatedResponse<LocationDetailResponse>> {
  return apiFetchPaginated<LocationDetailResponse>("/locations", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /locations/{id} — Location detail (traits, bonds, presence tiers).
 */
export function getLocation(id: string): Promise<LocationDetailResponse> {
  return api.get<LocationDetailResponse>(`/locations/${id}`);
}
