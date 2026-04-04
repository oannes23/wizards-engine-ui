"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import {
  listProposals,
  getProposal,
  deleteProposal,
  type ProposalListFilters,
} from "@/lib/api/services/proposals";
import type { PaginatedResponse, ProposalResponse, ProposalStatus } from "@/lib/api/types";
import { POLLING_INTERVALS } from "@/lib/constants";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";

// ── List hook ─────────────────────────────────────────────────────

interface UseProposalsOptions {
  characterId?: string | null;
  status?: ProposalStatus;
  polling?: boolean;
}

/**
 * useProposals — TanStack Query hook for GET /proposals (paginated list).
 *
 * Polls at 15s normally, 5s during active session.
 * Poll pauses when tab is hidden.
 *
 * Note: This hook fetches a single page (limit 100). The proposals list
 * is expected to be manageable without cursor pagination for MVP.
 */
export function useProposals({
  characterId,
  status,
  polling = true,
}: UseProposalsOptions = {}) {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  const refetchInterval = !polling
    ? false
    : isActive
      ? POLLING_INTERVALS.ACTIVE_SESSION
      : POLLING_INTERVALS.NORMAL;

  const filters: ProposalListFilters = {
    limit: 100,
    ...(characterId ? { character_id: characterId } : {}),
    ...(status ? { status } : {}),
  };

  return useQuery<PaginatedResponse<ProposalResponse>>({
    queryKey: queryKeys.proposals.list(filters as Record<string, unknown>),
    queryFn: () => listProposals(filters),
    enabled: !!characterId,
    staleTime: 10_000,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

// ── All-statuses hook (for counts) ───────────────────────────────

/**
 * useAllProposals — fetches all proposals for a character (no status filter).
 *
 * Used to derive per-status counts for the filter chips.
 */
export function useAllProposals(characterId: string | null | undefined) {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  const filters: ProposalListFilters = {
    limit: 100,
    ...(characterId ? { character_id: characterId } : {}),
  };

  return useQuery<PaginatedResponse<ProposalResponse>>({
    queryKey: queryKeys.proposals.list(filters as Record<string, unknown>),
    queryFn: () => listProposals(filters),
    enabled: !!characterId,
    staleTime: 10_000,
    refetchInterval: isActive ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.NORMAL,
    refetchIntervalInBackground: false,
  });
}

// ── Detail hook ───────────────────────────────────────────────────

/**
 * useProposal — TanStack Query hook for GET /proposals/{id}.
 */
export function useProposal(id: string | null | undefined) {
  return useQuery<ProposalResponse>({
    queryKey: queryKeys.proposals.detail(id ?? ""),
    queryFn: () => getProposal(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

// ── Delete mutation ───────────────────────────────────────────────

/**
 * useDeleteProposal — mutation for DELETE /proposals/{id}.
 *
 * Invalidates the proposals list on success.
 */
export function useDeleteProposal(_characterId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: string) => deleteProposal(proposalId),
    onSuccess: () => {
      // Invalidate all proposal list queries for this character
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    },
  });
}
