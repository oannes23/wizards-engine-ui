"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import {
  listProposals,
  approveProposal,
  rejectProposal,
  type ApproveProposalRequest,
  type RejectProposalRequest,
} from "@/lib/api/services/proposals";
import { getGmDashboard, getGmQueueSummary } from "@/lib/api/services/gm";
import type {
  PaginatedResponse,
  ProposalResponse,
  GmDashboardResponse,
} from "@/lib/api/types";
import { POLLING_INTERVALS } from "@/lib/constants";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";

// ── GM Queue (pending proposals) ───────────────────────────────────

/**
 * useGmPendingProposals — fetches all pending proposals for the GM queue.
 *
 * Polls at 10s normally, 5s during active session.
 * Proposal order after fetch is sorted client-side:
 *   1. System proposals (origin: "system") pinned first
 *   2. Player proposals sorted oldest-first (FIFO)
 */
export function useGmPendingProposals() {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  const refetchInterval = isActive
    ? POLLING_INTERVALS.ACTIVE_SESSION
    : POLLING_INTERVALS.FAST;

  return useQuery<PaginatedResponse<ProposalResponse>>({
    queryKey: queryKeys.proposals.list({ status: "pending", limit: 100 }),
    queryFn: () => listProposals({ status: "pending", limit: 100 }),
    staleTime: 5_000,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

// ── GM Recent (approved/rejected history, paginated) ──────────────

/**
 * useGmRecentProposals — infinite-scroll list of approved/rejected proposals.
 *
 * Returns newest-first (API default). Loads up to 20 per page.
 * "Load more" paginates back indefinitely.
 */
export function useGmRecentProposals() {
  return useInfiniteQuery<PaginatedResponse<ProposalResponse>>({
    queryKey: queryKeys.proposals.list({ status: "recent", limit: 20 }),
    queryFn: ({ pageParam }) =>
      listProposals({
        limit: 20,
        // Fetch both approved and rejected by omitting status filter;
        // the component can filter client-side or accept the mix.
        after: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
  });
}

// ── GM Dashboard ──────────────────────────────────────────────────

/**
 * useGmDashboard — GET /gm/dashboard for PC summaries + pending count.
 */
export function useGmDashboard() {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  return useQuery<GmDashboardResponse>({
    queryKey: queryKeys.gm.dashboard,
    queryFn: getGmDashboard,
    staleTime: 15_000,
    refetchInterval: isActive
      ? POLLING_INTERVALS.ACTIVE_SESSION
      : POLLING_INTERVALS.NORMAL,
    refetchIntervalInBackground: false,
  });
}

// ── GM Queue Summary ──────────────────────────────────────────────

/**
 * useGmQueueSummary — GET /gm/queue-summary for the nav badge count.
 */
export function useGmQueueSummary() {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  return useQuery({
    queryKey: queryKeys.gm.queueSummary,
    queryFn: getGmQueueSummary,
    staleTime: 10_000,
    refetchInterval: isActive
      ? POLLING_INTERVALS.ACTIVE_SESSION
      : POLLING_INTERVALS.FAST,
    refetchIntervalInBackground: false,
    // Gracefully handle missing endpoint during dev — return 0
    select: (data) => data?.pending_count ?? 0,
  });
}

// ── Approve mutation ──────────────────────────────────────────────

/**
 * useApproveProposal — POST /proposals/{id}/approve
 *
 * Invalidates proposal list and GM dashboard queries on success.
 */
export function useApproveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: ApproveProposalRequest;
    }) => approveProposal(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.gm.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.gm.queueSummary });
    },
  });
}

// ── Reject mutation ───────────────────────────────────────────────

/**
 * useRejectProposal — POST /proposals/{id}/reject
 *
 * Invalidates proposal list and GM dashboard queries on success.
 */
export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: RejectProposalRequest;
    }) => rejectProposal(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.gm.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.gm.queueSummary });
    },
  });
}
