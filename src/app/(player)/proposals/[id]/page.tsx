"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/lib/toast/useToast";
import { formatRelativeTime } from "@/lib/utils/time";
import {
  ActionTypeBadge,
  CalculatedEffectCard,
  useProposal,
  useDeleteProposal,
} from "@/features/proposals";
import { useAuth } from "@/lib/auth/useAuth";

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { characterId } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: proposal, isLoading, isError } = useProposal(id);
  const deleteMutation = useDeleteProposal(characterId);

  // ── Delete flow ───────────────────────────────────────────────

  function handleDeleteConfirm() {
    if (!proposal) return;
    deleteMutation.mutate(proposal.id, {
      onSuccess: () => {
        toastSuccess("Proposal deleted.");
        router.push("/proposals");
      },
      onError: () => {
        toastError("Failed to delete proposal.");
        setShowDeleteModal(false);
      },
    });
  }

  // ── Loading state ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4"
        aria-busy="true"
        aria-label="Loading proposal"
      >
        <div className="h-6 w-32 rounded bg-bg-elevated animate-pulse" />
        <div className="h-48 rounded-lg bg-bg-elevated animate-pulse" />
        <div className="h-32 rounded-lg bg-bg-elevated animate-pulse" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────

  if (isError || !proposal) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to proposals
        </Link>
        <div
          className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4 text-sm text-status-rejected"
          role="alert"
        >
          Could not load proposal. It may not exist or you may not have access.
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────

  const canEdit = proposal.status === "pending" || proposal.status === "rejected";
  const isRejected = proposal.status === "rejected";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      {/* Back link */}
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to proposals
      </Link>

      {/* Proposal header card */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <ActionTypeBadge actionType={proposal.action_type} />
            {proposal.revision_count > 0 && (
              <span
                className="text-xs text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-full"
                aria-label={`Revised ${proposal.revision_count} times`}
              >
                Revised {proposal.revision_count}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={proposal.status} />
            <time
              dateTime={proposal.created_at}
              className="text-xs text-text-secondary tabular-nums"
            >
              {formatRelativeTime(proposal.created_at)}
            </time>
          </div>
        </div>

        {/* Narrative */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Narrative
          </p>
          {proposal.narrative ? (
            <p className="text-sm text-text-primary leading-relaxed">
              {proposal.narrative}
            </p>
          ) : (
            <p className="text-sm text-text-secondary italic">
              No narrative provided.
            </p>
          )}
        </div>

        {/* Selections summary */}
        {proposal.selections && Object.keys(proposal.selections).length > 0 && (
          <SelectionsSummary
            actionType={proposal.action_type}
            selections={proposal.selections}
          />
        )}
      </div>

      {/* Calculated effect (approved or calculated) */}
      {proposal.calculated_effect && (
        <CalculatedEffectCard
          actionType={proposal.action_type}
          calculatedEffect={proposal.calculated_effect}
        />
      )}

      {/* GM notes / rejection note */}
      {proposal.status === "approved" && proposal.gm_notes && (
        <div className="rounded-lg border border-status-approved/30 bg-status-approved/10 p-4">
          <p className="text-xs font-semibold text-status-approved mb-1">GM Note</p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}

      {proposal.status === "rejected" && proposal.gm_notes && (
        <div className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4">
          <p className="text-xs font-semibold text-status-rejected mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}

      {/* Event link (approved) */}
      {proposal.status === "approved" && proposal.event_id && (
        <div className="text-sm text-text-secondary">
          Event ID:{" "}
          <span className="font-mono text-text-primary">
            {proposal.event_id}
          </span>
        </div>
      )}

      {/* Action buttons */}
      {canEdit && (
        <div className="flex items-center gap-2 pt-2">
          {isRejected ? (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="
                inline-flex items-center gap-1.5 rounded-md px-4 py-2
                text-sm font-medium bg-brand-blue text-white
                hover:bg-brand-blue-light transition-colors min-h-[40px]
              "
              aria-label="Revise proposal"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Revise
            </Link>
          ) : (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="
                inline-flex items-center gap-1.5 rounded-md px-4 py-2
                text-sm font-medium bg-bg-elevated text-text-primary
                hover:bg-brand-navy-light transition-colors min-h-[40px]
              "
              aria-label="Edit proposal"
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
            className="
              inline-flex items-center gap-1.5 rounded-md px-4 py-2
              text-sm font-medium text-status-rejected
              hover:bg-status-rejected/10 transition-colors min-h-[40px]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label="Delete proposal"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}

// ── Selections summary component ───────────────────────────────────

function SelectionsSummary({
  selections,
}: {
  actionType: string;
  selections: Record<string, unknown>;
}) {
  const entries = Object.entries(selections).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
        Selections
      </p>
      <dl className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-sm">
            <dt className="shrink-0 text-text-secondary capitalize min-w-[100px]">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="text-text-primary font-medium break-all">
              {renderSelectionValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function renderSelectionValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} item${value.length !== 1 ? "s" : ""}`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined
    );
    if (entries.length === 0) return "None";
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
  }
  return String(value);
}
