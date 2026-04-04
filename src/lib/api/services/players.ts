import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { UserResponse, MeResponse } from "../types";

// ── Request types ──────────────────────────────────────────────────

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  notes?: string;
  attributes?: Record<string, unknown>;
}

// ── Players ────────────────────────────────────────────────────────

/**
 * GET /players — List all users.
 *
 * Role-dependent visibility:
 *  - GM: all users (including viewers) with login_url
 *  - Viewer: all users without login_url
 *  - Player: GM + players only, no login_url
 */
export function listPlayers(
  params?: { after?: string; limit?: number }
): Promise<PaginatedResponse<UserResponse>> {
  return apiFetchPaginated<UserResponse>("/players", params);
}

/**
 * POST /players/{id}/regenerate-token — Rotate a player's login code (GM only).
 * Returns the new login_url.
 */
export function regenerateToken(
  playerId: string
): Promise<{ login_url: string }> {
  return api.post<{ login_url: string }>(
    `/players/${playerId}/regenerate-token`
  );
}

/**
 * POST /me/character — Create a full (PC) character linked to the GM.
 * Returns UserResponse (note: full MeResponse shape including capabilities).
 */
export function createMyCharacter(
  body: CreateCharacterRequest
): Promise<MeResponse> {
  return api.post<MeResponse>("/me/character", body);
}
