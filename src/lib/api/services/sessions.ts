import { api } from "../client";
import type {
  PaginatedResponse,
  SessionResponse,
  ParticipantResponse,
  SessionStatus,
} from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface CreateSessionRequest {
  time_now?: number;
  date?: string;
  summary?: string;
  notes?: string;
}

export interface UpdateSessionRequest {
  time_now?: number;
  date?: string;
  summary?: string;
  notes?: string;
}

export interface AddParticipantRequest {
  character_id: string;
  additional_contribution?: boolean;
}

export interface UpdateParticipantRequest {
  additional_contribution: boolean;
}

// ── Filters ────────────────────────────────────────────────────────

export interface SessionListFilters {
  status?: SessionStatus;
  after?: string;
  limit?: number;
}

// ── List / Detail ──────────────────────────────────────────────────

/** GET /sessions — paginated list, optional status filter */
export function listSessions(
  filters?: SessionListFilters
): Promise<PaginatedResponse<SessionResponse>> {
  return api.get<PaginatedResponse<SessionResponse>>(
    "/sessions",
    filters as Record<string, string | number | boolean | null | undefined>
  );
}

/** GET /sessions/{id} — session detail with participants */
export function getSession(id: string): Promise<SessionResponse> {
  return api.get<SessionResponse>(`/sessions/${id}`);
}

// ── Mutations ──────────────────────────────────────────────────────

/** POST /sessions — create draft session */
export function createSession(
  body: CreateSessionRequest
): Promise<SessionResponse> {
  return api.post<SessionResponse>("/sessions", body);
}

/** PATCH /sessions/{id} — update draft/active session */
export function updateSession(
  id: string,
  body: UpdateSessionRequest
): Promise<SessionResponse> {
  return api.patch<SessionResponse>(`/sessions/${id}`, body);
}

/** DELETE /sessions/{id} — hard-delete draft only */
export function deleteSession(id: string): Promise<void> {
  return api.del<void>(`/sessions/${id}`);
}

/** POST /sessions/{id}/start — Draft → Active */
export function startSession(id: string): Promise<SessionResponse> {
  return api.post<SessionResponse>(`/sessions/${id}/start`);
}

/** POST /sessions/{id}/end — Active → Ended */
export function endSession(id: string): Promise<SessionResponse> {
  return api.post<SessionResponse>(`/sessions/${id}/end`);
}

// ── Participants ───────────────────────────────────────────────────

/** POST /sessions/{id}/participants — add participant */
export function addParticipant(
  sessionId: string,
  body: AddParticipantRequest
): Promise<ParticipantResponse> {
  return api.post<ParticipantResponse>(`/sessions/${sessionId}/participants`, body);
}

/** DELETE /sessions/{id}/participants/{character_id} — remove participant */
export function removeParticipant(
  sessionId: string,
  characterId: string
): Promise<void> {
  return api.del<void>(`/sessions/${sessionId}/participants/${characterId}`);
}

/** PATCH /sessions/{id}/participants/{character_id} — update contribution flag */
export function updateParticipant(
  sessionId: string,
  characterId: string,
  body: UpdateParticipantRequest
): Promise<ParticipantResponse> {
  return api.patch<ParticipantResponse>(
    `/sessions/${sessionId}/participants/${characterId}`,
    body
  );
}
