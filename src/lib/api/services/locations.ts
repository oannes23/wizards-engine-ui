import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { LocationDetailResponse } from "../types";

// ── Filters ────────────────────────────────────────────────────────

export interface LocationListFilters {
  name?: string;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

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
