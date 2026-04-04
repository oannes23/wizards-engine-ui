import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { StoryDetailResponse } from "../types";

// ── Filters ────────────────────────────────────────────────────────

export interface StoryListFilters {
  status?: "active" | "completed" | "abandoned";
  tag?: string;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * GET /stories — Paginated list of stories (visibility-filtered by server).
 */
export function listStories(
  filters?: StoryListFilters
): Promise<PaginatedResponse<StoryDetailResponse>> {
  return apiFetchPaginated<StoryDetailResponse>("/stories", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /stories/{id} — Story detail (owners, entries, visibility-filtered).
 */
export function getStory(id: string): Promise<StoryDetailResponse> {
  return api.get<StoryDetailResponse>(`/stories/${id}`);
}

/**
 * GET /stories where the current user's character is an owner.
 * Used for "My Stories" sidebar on the player feed page.
 *
 * NOTE: There is no dedicated /me/stories endpoint. We fetch all stories
 * and the server visibility-filters the results. The sidebar shows active
 * stories only.
 */
export function getMyStories(): Promise<PaginatedResponse<StoryDetailResponse>> {
  return apiFetchPaginated<StoryDetailResponse>("/stories", {
    status: "active",
    limit: 20,
  });
}
