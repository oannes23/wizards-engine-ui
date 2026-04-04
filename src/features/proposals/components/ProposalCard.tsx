"use client";

import Link from "next/link";
import { Edit2, Trash2, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/lib/utils/time";
import type { ProposalResponse } from "@/lib/api/types";
import { ActionTypeBadge } from "./ActionTypeBadge";
import { CalculatedEffectCard } from "./CalculatedEffectCard";

interface ProposalCardProps {
  proposal: ProposalResponse;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * ProposalCard — shows a single proposal with status-appropriate actions.
 *
 * - Pending: action type badge, narrative excerpt, timestamp, [Edit] [Delete]
 * - Approved: CalculatedEffectCard with costs, GM note
 * - Rejected: rejection note, [Revise] button
 */
export function ProposalCard({ proposal, onDelete, isDeleting }: ProposalCardProps) {
  const narrativeExcerpt = proposal.narrative
    ? proposal.narrative.length > 120
      ? `${proposal.narrative.slice(0, 120)}…`
      : proposal.narrative
    : null;

  return (
    <article
      className="rounded-lg border border-border-default bg-bg-surface p-4 flex flex-col gap-3"
      aria-label={`${proposal.action_type} proposal, ${proposal.status}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ActionTypeBadge actionType={proposal.action_type} />
          {proposal.revision_count > 0 && (
            <span
              className="text-xs text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-full"
              title={`Revised ${proposal.revision_count} time${proposal.revision_count !== 1 ? "s" : ""}`}
            >
              Revised {proposal.revision_count}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={proposal.status} />
          <time
            dateTime={proposal.created_at}
            className="text-xs text-text-secondary tabular-nums whitespace-nowrap"
          >
            {formatRelativeTime(proposal.created_at)}
          </time>
        </div>
      </div>

      {/* Narrative excerpt */}
      {narrativeExcerpt && (
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
          {narrativeExcerpt}
        </p>
      )}
      {!narrativeExcerpt && (
        <p className="text-sm text-text-secondary italic">No narrative provided.</p>
      )}

      {/* Status-specific content */}
      {proposal.status === "approved" && proposal.calculated_effect && (
        <CalculatedEffectCard
          actionType={proposal.action_type}
          calculatedEffect={proposal.calculated_effect}
        />
      )}

      {proposal.status === "approved" && proposal.gm_notes && (
        <div className="rounded-md bg-status-approved/10 border border-status-approved/20 px-3 py-2">
          <p className="text-xs font-semibold text-status-approved mb-0.5">GM Note</p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}

      {proposal.status === "rejected" && proposal.gm_notes && (
        <div className="rounded-md bg-status-rejected/10 border border-status-rejected/20 px-3 py-2">
          <p className="text-xs font-semibold text-status-rejected mb-0.5">Rejection Reason</p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {(proposal.status === "pending" || proposal.status === "rejected") && (
        <div className="flex items-center gap-2 pt-1">
          {proposal.status === "rejected" ? (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="
                inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
                text-sm font-medium bg-brand-blue text-white
                hover:bg-brand-blue-light transition-colors min-h-[36px]
              "
              aria-label={`Revise proposal`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Revise
            </Link>
          ) : (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="
                inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
                text-sm font-medium bg-bg-elevated text-text-primary
                hover:bg-brand-navy-light transition-colors min-h-[36px]
              "
              aria-label={`Edit proposal`}
            >
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Link>
          )}
          <button
            onClick={() => onDelete?.(proposal.id)}
            disabled={isDeleting}
            className="
              inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
              text-sm font-medium text-status-rejected
              hover:bg-status-rejected/10 transition-colors min-h-[36px]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label={`Delete proposal`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
          <Link
            href={`/proposals/${proposal.id}`}
            className="ml-auto text-sm text-text-secondary hover:text-text-primary transition-colors"
            aria-label="View proposal details"
          >
            View details
          </Link>
        </div>
      )}

      {proposal.status === "approved" && (
        <div className="flex items-center justify-between pt-1">
          {proposal.event_id && (
            <span className="text-xs text-text-secondary">
              Event: <span className="font-mono">{proposal.event_id.slice(-8)}</span>
            </span>
          )}
          <Link
            href={`/proposals/${proposal.id}`}
            className="ml-auto text-sm text-text-secondary hover:text-text-primary transition-colors"
            aria-label="View proposal details"
          >
            View details
          </Link>
        </div>
      )}
    </article>
  );
}
