import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { InviteResponse } from "../types";

// ── Request types ──────────────────────────────────────────────────

export interface CreateInviteRequest {
  /** Optional: defaults to "player" if omitted */
  role?: "player" | "viewer";
}

// ── Invites ────────────────────────────────────────────────────────

/**
 * POST /game/invites — Generate a new invite code (GM only).
 * Optional body: { role?: "player" | "viewer" }
 */
export function createInvite(
  body?: CreateInviteRequest
): Promise<InviteResponse> {
  return api.post<InviteResponse>("/game/invites", body ?? {});
}

/**
 * GET /game/invites — List all invites (paginated, GM/Viewer).
 */
export function listInvites(params?: {
  after?: string;
  limit?: number;
}): Promise<PaginatedResponse<InviteResponse>> {
  return apiFetchPaginated<InviteResponse>("/game/invites", params);
}

/**
 * DELETE /game/invites/{id} — Delete an unconsumed invite (GM only).
 * Returns 409 if the invite has already been consumed.
 */
export function deleteInvite(inviteId: string): Promise<void> {
  return api.del<void>(`/game/invites/${inviteId}`);
}
