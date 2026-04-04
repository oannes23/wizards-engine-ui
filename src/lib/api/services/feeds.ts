import { apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { FeedItemResponse, FeedFilters } from "../types";

/**
 * GET /me/feed — Personal feed (events + story entries visible to the user).
 *
 * All feed endpoints share filters: type?, target_type?, target_id?,
 * actor_type?, session_id?, since?, until?, after?, limit?
 */
export function getFeed(
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>("/me/feed", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /me/feed/starred — Feed filtered to starred Game Objects.
 */
export function getStarredFeed(
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>("/me/feed/starred", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /me/feed/silent — Silent events only (GM / audit log view).
 */
export function getSilentFeed(
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>("/me/feed/silent", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /characters/{id}/feed — Character-specific feed.
 */
export function getCharacterFeed(
  characterId: string,
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>(
    `/characters/${characterId}/feed`,
    {
      ...(filters as Record<string, string | number | boolean | null | undefined>),
    }
  );
}

/**
 * GET /groups/{id}/feed — Group feed.
 */
export function getGroupFeed(
  groupId: string,
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>(`/groups/${groupId}/feed`, {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/**
 * GET /locations/{id}/feed — Location feed.
 */
export function getLocationFeed(
  locationId: string,
  filters?: FeedFilters
): Promise<PaginatedResponse<FeedItemResponse>> {
  return apiFetchPaginated<FeedItemResponse>(
    `/locations/${locationId}/feed`,
    {
      ...(filters as Record<string, string | number | boolean | null | undefined>),
    }
  );
}
