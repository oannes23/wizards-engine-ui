import type { MeResponse, InviteResponse } from "@/lib/api/types";

/**
 * Factory function for creating user fixtures.
 * Returns a complete MeResponse with sensible defaults.
 */
export function makeUser(overrides?: Partial<MeResponse>): MeResponse {
  return {
    id: "01USER_DEFAULT0000000000",
    display_name: "Test User",
    role: "player",
    character_id: "01CHAR_DEFAULT0000000000",
    can_view_gm_content: false,
    can_take_gm_actions: false,
    ...overrides,
  };
}

// ── Canonical Personas ───────────────────────────────────────────

export const gmUser: MeResponse = makeUser({
  id: "01GM000000000000000000000",
  display_name: "The GM",
  role: "gm",
  character_id: null,
  can_view_gm_content: true,
  can_take_gm_actions: true,
});

export const gmWithCharacter: MeResponse = makeUser({
  id: "01GM000000000000000000000",
  display_name: "GM-Player",
  role: "gm",
  character_id: "01CH_GM00000000000000000",
  can_view_gm_content: true,
  can_take_gm_actions: true,
});

export const playerA: MeResponse = makeUser({
  id: "01PL_A0000000000000000000",
  display_name: "Alice",
  role: "player",
  character_id: "01CH_A0000000000000000000",
  can_view_gm_content: false,
  can_take_gm_actions: false,
});

export const playerB: MeResponse = makeUser({
  id: "01PL_B0000000000000000000",
  display_name: "Bob",
  role: "player",
  character_id: "01CH_B0000000000000000000",
  can_view_gm_content: false,
  can_take_gm_actions: false,
});

export const viewerUser: MeResponse = makeUser({
  id: "01VW000000000000000000000",
  display_name: "Viewer",
  role: "viewer",
  character_id: null,
  can_view_gm_content: true,
  can_take_gm_actions: false,
});

// ── Invite Factory ───────────────────────────────────────────────

/**
 * Factory function for creating invite fixtures.
 * Returns a complete InviteResponse with sensible defaults.
 */
export function makeInvite(overrides?: Partial<InviteResponse>): InviteResponse {
  return {
    id: "01INVITE_DEFAULT00000000",
    is_consumed: false,
    role: "player",
    login_url: "http://localhost:3000/login/01INVITE_DEFAULT00000000",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export const playerInvite: InviteResponse = makeInvite({
  id: "01INVITE_PLAYER000000000",
  role: "player",
  login_url: "http://localhost:3000/login/01INVITE_PLAYER000000000",
});

export const viewerInvite: InviteResponse = makeInvite({
  id: "01INVITE_VIEWER000000000",
  role: "viewer",
  login_url: "http://localhost:3000/login/01INVITE_VIEWER000000000",
});
