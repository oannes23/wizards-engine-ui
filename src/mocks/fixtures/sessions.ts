import type { SessionResponse, ParticipantResponse } from "@/lib/api/types";

/**
 * Factory for ParticipantResponse test fixtures.
 */
export function makeParticipant(
  overrides?: Partial<ParticipantResponse>
): ParticipantResponse {
  return {
    session_id: "01SESSION_DEFAULT0000000",
    character_id: "01CHAR_DEFAULT0000000000",
    character_name: "Kael",
    additional_contribution: false,
    ...overrides,
  };
}

/**
 * Factory for a draft SessionResponse.
 */
export function makeSession(
  overrides?: Partial<SessionResponse>
): SessionResponse {
  return {
    id: "01SESSION_DEFAULT0000000",
    status: "draft",
    time_now: 42,
    date: "2026-01-15",
    summary: "The crew investigates the warehouse",
    notes: null,
    participants: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Factory for an active session.
 */
export function makeActiveSession(
  overrides?: Partial<SessionResponse>
): SessionResponse {
  return makeSession({
    id: "01SESSION_ACTIVE00000000",
    status: "active",
    time_now: 42,
    summary: "The crew faces the shadow council",
    participants: [makeParticipant({ session_id: "01SESSION_ACTIVE00000000" })],
    ...overrides,
  });
}

/**
 * Factory for an ended session.
 */
export function makeEndedSession(
  overrides?: Partial<SessionResponse>
): SessionResponse {
  return makeSession({
    id: "01SESSION_ENDED00000000",
    status: "ended",
    time_now: 40,
    date: "2025-12-01",
    summary: "The heist at the mansion",
    ...overrides,
  });
}
