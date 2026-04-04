"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  startSession,
  endSession,
  addParticipant,
  removeParticipant,
  updateParticipant,
  type CreateSessionRequest,
  type UpdateSessionRequest,
  type AddParticipantRequest,
  type UpdateParticipantRequest,
} from "@/lib/api/services/sessions";
import type { PaginatedResponse, SessionResponse, SessionStatus } from "@/lib/api/types";
import { POLLING_INTERVALS } from "@/lib/constants";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";

// ── List ───────────────────────────────────────────────────────────

/**
 * useSessionList — paginated list of sessions filtered by status.
 *
 * Polls at 60s (moderate cache, spec/domains/sessions.md).
 */
export function useSessionList(status?: SessionStatus) {
  return useInfiniteQuery<PaginatedResponse<SessionResponse>>({
    queryKey: queryKeys.sessions.list,
    queryFn: ({ pageParam }) =>
      listSessions({ status, after: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * useAllSessions — flat list of all sessions for the sessions list page.
 *
 * Fetches all without status filter. Used by list pages that section by status.
 */
export function useAllSessions() {
  return useQuery<PaginatedResponse<SessionResponse>>({
    queryKey: queryKeys.sessions.list,
    queryFn: () => listSessions({ limit: 100 }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ── Detail ─────────────────────────────────────────────────────────

/**
 * useSession — session detail with participants.
 *
 * Polls at 30s when the session is not ended.
 */
export function useSession(id: string) {
  const { data: activeSession } = useActiveSession();
  const isThisActive = activeSession?.id === id;

  const refetchInterval = isThisActive
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.NORMAL;

  return useQuery<SessionResponse>({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

// ── Create ─────────────────────────────────────────────────────────

/**
 * useCreateSession — POST /sessions
 *
 * Invalidates session list on success.
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSessionRequest) => createSession(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────

/**
 * useUpdateSession — PATCH /sessions/{id}
 *
 * Invalidates session detail and list on success.
 */
export function useUpdateSession(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateSessionRequest) => updateSession(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────

/**
 * useDeleteSession — DELETE /sessions/{id}
 *
 * Invalidates session list on success.
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

// ── Lifecycle ──────────────────────────────────────────────────────

/**
 * useStartSession — POST /sessions/{id}/start
 *
 * Invalidates session detail, list, and active session cache.
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startSession(id),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(session.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
    },
  });
}

/**
 * useEndSession — POST /sessions/{id}/end
 *
 * Invalidates session detail, list, and active session cache.
 */
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => endSession(id),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(session.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
    },
  });
}

// ── Participants ───────────────────────────────────────────────────

/**
 * useAddParticipant — POST /sessions/{id}/participants
 */
export function useAddParticipant(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AddParticipantRequest) => addParticipant(sessionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
    },
  });
}

/**
 * useRemoveParticipant — DELETE /sessions/{id}/participants/{character_id}
 */
export function useRemoveParticipant(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) => removeParticipant(sessionId, characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
    },
  });
}

/**
 * useUpdateParticipant — PATCH /sessions/{id}/participants/{character_id}
 */
export function useUpdateParticipant(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      body,
    }: {
      characterId: string;
      body: UpdateParticipantRequest;
    }) => updateParticipant(sessionId, characterId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
    },
  });
}
