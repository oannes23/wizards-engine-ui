"use client";

import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/lib/toast/useToast";
import {
  ProposalCard,
  ProposalFilterChips,
  useAllProposals,
  useDeleteProposal,
} from "@/features/proposals";
import type { ProposalFilterStatus } from "@/features/proposals";
import type { ProposalStatus } from "@/lib/api/types";

// ── Empty state copy by status filter ───────────────────────────

const EMPTY_COPY: Record<ProposalFilterStatus, { title: string; description: string }> = {
  all: {
    title: "No proposals yet",
    description: "Submit your first proposal to get started.",
  },
  pending: {
    title: "No pending proposals",
    description: "All your proposals have been reviewed.",
  },
  approved: {
    title: "No approved proposals",
    description: "Approved proposals will appear here.",
  },
  rejected: {
    title: "No rejected proposals",
    description: "Rejected proposals will appear here.",
  },
};

// ── Page ──────────────────────────────────────────────────────────

export default function ProposalsListPage() {
  const { characterId } = useAuth();
  const [activeFilter, setActiveFilter] = useState<ProposalFilterStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data, isLoading, isError } = useAllProposals(characterId);
  const deleteMutation = useDeleteProposal(characterId);

  // Derive all proposals and per-status counts
  const allProposals = data?.items ?? [];
  const pendingCount = allProposals.filter((p) => p.status === "pending").length;

  // Filter client-side from the full list (already fetched)
  const visibleProposals =
    activeFilter === "all"
      ? allProposals
      : allProposals.filter((p) => p.status === (activeFilter as ProposalStatus));

  // ── Delete flow ───────────────────────────────────────────────

  function handleDeleteRequest(id: string) {
    setDeleteTarget(id);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toastSuccess("Proposal deleted.");
        setDeleteTarget(null);
      },
      onError: () => {
        toastError("Failed to delete proposal.");
        setDeleteTarget(null);
      },
    });
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Proposals
        </h1>
        <Link
          href="/proposals/new"
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-brand-blue text-white
            hover:bg-brand-blue-light transition-colors min-h-[40px]
          "
          aria-label="New Proposal"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Proposal
        </Link>
      </div>

      {/* Filter chips */}
      <ProposalFilterChips
        active={activeFilter}
        pendingCount={pendingCount}
        onChange={setActiveFilter}
      />

      {/* Content */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading proposals">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-bg-elevated animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4 text-sm text-status-rejected"
          role="alert"
        >
          Could not load proposals. Please try again.
        </div>
      )}

      {!isLoading && !isError && visibleProposals.length === 0 && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title={EMPTY_COPY[activeFilter].title}
          description={EMPTY_COPY[activeFilter].description}
          action={
            activeFilter === "all"
              ? { label: "New Proposal", onClick: () => {} }
              : undefined
          }
        />
      )}

      {!isLoading && !isError && visibleProposals.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onDelete={handleDeleteRequest}
              isDeleting={
                deleteMutation.isPending && deleteTarget === proposal.id
              }
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}
