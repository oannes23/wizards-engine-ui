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

// ── Entry Types ────────────────────────────────────────────────────

export interface StoryEntry {
  id: string;
  text: string;
  author_id: string;
  character_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AddEntryRequest {
  text: string;
  character_id?: string | null;
}

export interface EditEntryRequest {
  text: string;
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
 * GET /stories/{id}/entries — Paginated entries (oldest-first, cursor-based).
 * Used for "load more" to fetch entries older than what the detail response includes.
 */
export function getStoryEntries(
  storyId: string,
  params?: { after?: string; limit?: number }
): Promise<PaginatedResponse<StoryEntry>> {
  return apiFetchPaginated<StoryEntry>(`/stories/${storyId}/entries`, params);
}

/**
 * POST /stories/{id}/entries — Add a narrative entry.
 * Author is auto-set from the authenticated user.
 */
export function addStoryEntry(
  storyId: string,
  body: AddEntryRequest
): Promise<StoryEntry> {
  return api.post<StoryEntry>(`/stories/${storyId}/entries`, body);
}

/**
 * PATCH /stories/{id}/entries/{entry_id} — Edit an entry's text.
 * Only owners and GM can edit.
 */
export function editStoryEntry(
  storyId: string,
  entryId: string,
  body: EditEntryRequest
): Promise<StoryEntry> {
  return api.patch<StoryEntry>(`/stories/${storyId}/entries/${entryId}`, body);
}

/**
 * DELETE /stories/{id}/entries/{entry_id} — Soft-delete an entry.
 * Only owners and GM can delete.
 */
export function deleteStoryEntry(
  storyId: string,
  entryId: string
): Promise<void> {
  return api.del<void>(`/stories/${storyId}/entries/${entryId}`);
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
