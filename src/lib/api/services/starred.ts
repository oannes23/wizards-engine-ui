import { api } from "../client";
import type { GameObjectType, StarredObjectsResponse } from "../types";

/**
 * GET /me/starred — List all starred objects for the current user.
 */
export function getStarredObjects(): Promise<StarredObjectsResponse> {
  return api.get<StarredObjectsResponse>("/me/starred");
}

/**
 * POST /me/starred — Star an object (idempotent).
 * Body: { type, id }
 */
export function starObject(
  type: GameObjectType | "story",
  id: string
): Promise<void> {
  return api.post<void>("/me/starred", { type, id });
}

/**
 * DELETE /me/starred/{type}/{id} — Unstar an object (idempotent).
 */
export function unstarObject(
  type: GameObjectType | "story",
  id: string
): Promise<void> {
  return api.del<void>(`/me/starred/${type}/${id}`);
}
