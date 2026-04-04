"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { Inbox, Clock, AlertCircle } from "lucide-react";
import { GmProposalReviewCard } from "@/features/proposals/components/GmProposalReviewCard";
import { GmQueueSummary } from "@/features/proposals/components/GmQueueSummary";
import { ActionTypeBadge } from "@/features/proposals/components/ActionTypeBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/lib/utils/time";
import {
  useGmPendingProposals,
  useGmRecentProposals,
  useGmDashboard,
  useApproveProposal,
  useRejectProposal,
} from "@/features/proposals/hooks/useGmQueue";
import { useToast } from "@/lib/toast/useToast";
import type { ProposalResponse } from "@/lib/api/types";
import type {
  ApproveProposalRequest,
  RejectProposalRequest,
} from "@/lib/api/services/proposals";

// ── Tab type ──────────────────────────────────────────────────────

type QueueTab = "queue" | "recent";

// ── Proposal sort helper ──────────────────────────────────────────

/**
 * Sort proposals for the GM queue:
 * 1. System proposals (origin: "system") pinned at top
 * 2. Player proposals sorted oldest-first (FIFO fairness)
 */
function sortQueueProposals(proposals: ProposalResponse[]): ProposalResponse[] {
  const system = proposals.filter((p) => p.origin === "system");
  const player = proposals
    .filter((p) => p.origin !== "system")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  return [...system, ...player];
}

// ── Queue tab ─────────────────────────────────────────────────────

function QueueTabContent() {
  const { data: pendingData, isLoading, isError } = useGmPendingProposals();
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();
  const toast = useToast();

  const sorted = useMemo(
    () => sortQueueProposals(pendingData?.items ?? []),
    [pendingData?.items]
  );

  async function handleApprove(id: string, payload: ApproveProposalRequest) {
    try {
      await approveMutation.mutateAsync({ id, body: payload });
      toast.success("Proposal approved.");
    } catch {
      toast.error("Failed to approve proposal.");
    }
  }

  async function handleReject(id: string, payload: RejectProposalRequest) {
    try {
      await rejectMutation.mutateAsync({ id, body: payload });
      toast.success("Proposal rejected.");
    } catch {
      toast.error("Failed to reject proposal.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
            aria-hidden="true"
          >
            <div className="h-5 w-1/3 bg-bg-elevated rounded mb-3" />
            <div className="h-4 w-2/3 bg-bg-elevated rounded mb-2" />
            <div className="h-4 w-1/2 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Could not load queue"
        description="An error occurred while fetching proposals. Try refreshing."
      />
    );
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="Queue is empty"
        description="No pending proposals. Check back after players submit actions."
      />
    );
  }

  return (
    <div className="space-y-4">
      {sorted.map((proposal) => (
        <GmProposalReviewCard
          key={proposal.id}
          proposal={proposal}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={
            approveMutation.isPending &&
            approveMutation.variables?.id === proposal.id
          }
          isRejecting={
            rejectMutation.isPending &&
            rejectMutation.variables?.id === proposal.id
          }
        />
      ))}
    </div>
  );
}

// ── Recent tab ────────────────────────────────────────────────────

function RecentTabContent() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGmRecentProposals();

  const allItems = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.items)
        // Only approved and rejected
        .filter((p) => p.status === "approved" || p.status === "rejected"),
    [data?.pages]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
            aria-hidden="true"
          >
            <div className="h-5 w-1/3 bg-bg-elevated rounded mb-3" />
            <div className="h-4 w-2/3 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Could not load history"
        description="An error occurred fetching recent proposals."
      />
    );
  }

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-8 w-8" />}
        title="No history yet"
        description="Approved and rejected proposals will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {allItems.map((proposal) => (
        <RecentProposalCard key={proposal.id} proposal={proposal} />
      ))}
      <LoadMoreButton
        onClick={() => fetchNextPage()}
        isLoading={isFetchingNextPage}
        hasMore={hasNextPage ?? false}
      />
    </div>
  );
}

// ── Recent proposal card (read-only, collapsed view) ─────────────

function RecentProposalCard({ proposal }: { proposal: ProposalResponse }) {
  const narrativeExcerpt = proposal.narrative
    ? proposal.narrative.length > 100
      ? `${proposal.narrative.slice(0, 100)}…`
      : proposal.narrative
    : null;

  return (
    <article
      className="rounded-lg border border-border-default bg-bg-surface p-4 flex flex-col gap-2"
      aria-label={`${proposal.action_type} proposal, ${proposal.status}`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ActionTypeBadge actionType={proposal.action_type} />
          {proposal.revision_count > 0 && (
            <span className="text-xs text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-full">
              Revised {proposal.revision_count}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={proposal.status} />
          <time
            dateTime={proposal.updated_at}
            className="text-xs text-text-secondary tabular-nums"
          >
            {formatRelativeTime(proposal.updated_at)}
          </time>
        </div>
      </div>
      {narrativeExcerpt && (
        <p className="text-sm text-text-secondary leading-relaxed">
          {narrativeExcerpt}
        </p>
      )}
      {proposal.status === "rejected" && proposal.gm_notes && (
        <div className="rounded-md bg-status-rejected/10 border border-status-rejected/20 px-3 py-1.5">
          <p className="text-xs text-status-rejected font-medium">Rejected:</p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmQueuePage — GM home page at /gm.
 *
 * Layout:
 *   Desktop: proposal queue (main) + right sidebar (PC summary)
 *   Mobile: queue only — PC summary in a collapsible below
 *
 * Two tabs:
 *   Queue — pending proposals (system pinned top, player FIFO)
 *   Recent — approved/rejected history (paginated, oldest-last)
 *
 * Polling: 10s normal, 5s active session (handled in useGmPendingProposals)
 */
export default function GmQueuePage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("queue");
  const { data: dashboard } = useGmDashboard();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-8">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Proposal Queue
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Review and act on player proposals
          </p>
        </div>

        {/* Desktop layout: sidebar + main */}
        <div className="flex gap-6">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            <Tabs.Root
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as QueueTab)}
            >
              {/* Tab bar */}
              <Tabs.List
                className="flex gap-1 mb-4 border-b border-border-default"
                aria-label="Queue tabs"
              >
                <Tabs.Trigger
                  value="queue"
                  className="
                    flex items-center gap-1.5 px-3 py-2
                    text-sm font-medium text-text-secondary
                    border-b-2 border-transparent -mb-px
                    hover:text-text-primary transition-colors
                    data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
                  "
                >
                  <Inbox className="h-4 w-4" aria-hidden="true" />
                  Queue
                  {dashboard && dashboard.pending_proposals > 0 && (
                    <span
                      className="inline-flex items-center rounded-full bg-brand-teal/20 px-1.5 py-0.5 text-xs font-medium text-brand-teal"
                      aria-label={`${dashboard.pending_proposals} pending`}
                    >
                      {dashboard.pending_proposals}
                    </span>
                  )}
                </Tabs.Trigger>

                <Tabs.Trigger
                  value="recent"
                  className="
                    flex items-center gap-1.5 px-3 py-2
                    text-sm font-medium text-text-secondary
                    border-b-2 border-transparent -mb-px
                    hover:text-text-primary transition-colors
                    data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
                  "
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Recent
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="queue" className="focus:outline-none">
                <QueueTabContent />
              </Tabs.Content>

              <Tabs.Content value="recent" className="focus:outline-none">
                <RecentTabContent />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          {/* Sidebar — desktop only */}
          <div className="hidden lg:block w-72 shrink-0">
            {dashboard ? (
              <GmQueueSummary
                dashboard={dashboard}
                onPcClick={(id) => router.push(`/gm/character/${id}`)}
              />
            ) : (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
                    aria-hidden="true"
                  >
                    <div className="h-4 w-2/3 bg-bg-elevated rounded mb-2" />
                    <div className="h-3 w-1/2 bg-bg-elevated rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: PC summaries below queue */}
        {dashboard && dashboard.pc_summaries.length > 0 && (
          <div className="lg:hidden mt-6">
            <details className="rounded-lg border border-border-default bg-bg-surface">
              <summary className="px-4 py-3 text-sm font-medium text-text-primary cursor-pointer select-none">
                Character Status ({dashboard.pc_summaries.length})
              </summary>
              <div className="px-4 pb-4">
                <GmQueueSummary
                  dashboard={dashboard}
                  onPcClick={(id) => router.push(`/gm/character/${id}`)}
                />
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
