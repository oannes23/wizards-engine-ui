"use client";

import { AlertTriangle } from "lucide-react";
import { ActionTypeBadge } from "./ActionTypeBadge";
import { CalculatedEffectCard } from "./CalculatedEffectCard";
import { ApproveForm } from "./ApproveForm";
import { RejectForm } from "./RejectForm";
import { formatRelativeTime } from "@/lib/utils/time";
import type { ProposalResponse, BondDisplayResponse } from "@/lib/api/types";
import type {
  ApproveProposalRequest,
  RejectProposalRequest,
} from "@/lib/api/services/proposals";

// ── Types ─────────────────────────────────────────────────────────

interface GmProposalReviewCardProps {
  proposal: ProposalResponse;
  /** Player display name — resolved by the parent from the players list */
  playerName?: string;
  /** Active bonds for the affected character — required for resolve_trauma */
  characterBonds?: BondDisplayResponse[];
  onApprove: (id: string, payload: ApproveProposalRequest) => void;
  onReject: (id: string, payload: RejectProposalRequest) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

const SYSTEM_TYPES = new Set(["resolve_trauma", "resolve_clock"]);

function isSystem(proposal: ProposalResponse): boolean {
  return proposal.origin === "system" || SYSTEM_TYPES.has(proposal.action_type);
}

// ── Selections summary ─────────────────────────────────────────────

function SelectionsSummary({ proposal }: { proposal: ProposalResponse }) {
  const { action_type, selections } = proposal;

  if (!selections || Object.keys(selections).length === 0) return null;

  const rows: Array<{ label: string; value: string }> = [];

  if (action_type === "use_skill" && selections.skill) {
    rows.push({ label: "Skill", value: String(selections.skill) });
    const plot = selections.plot_spend;
    if (plot && Number(plot) > 0) {
      rows.push({ label: "Plot spend", value: String(plot) });
    }
  }

  if (
    (action_type === "use_magic" || action_type === "charge_magic") &&
    selections.magic_stat
  ) {
    rows.push({ label: "Magic stat", value: String(selections.magic_stat) });
    if (selections.intention)
      rows.push({ label: "Intention", value: String(selections.intention) });
    if (selections.symbolism)
      rows.push({ label: "Symbolism", value: String(selections.symbolism) });
  }

  if (action_type === "work_on_project") {
    if (selections.story_id)
      rows.push({ label: "Story", value: String(selections.story_id).slice(-8) });
    if (selections.clock_id)
      rows.push({ label: "Clock", value: String(selections.clock_id).slice(-8) });
  }

  if (action_type === "new_trait") {
    if (selections.slot_type)
      rows.push({ label: "Slot", value: String(selections.slot_type).replace(/_/g, " ") });
    if (selections.proposed_name)
      rows.push({ label: "Name", value: String(selections.proposed_name) });
  }

  if (action_type === "new_bond") {
    if (selections.target_type)
      rows.push({ label: "Target type", value: String(selections.target_type) });
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-2 text-sm">
          <span className="text-text-secondary shrink-0">{label}:</span>
          <span className="text-text-primary capitalize">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

/**
 * GmProposalReviewCard — a proposal card in the GM queue.
 *
 * System proposals (resolve_trauma, resolve_clock):
 *   - Distinct styling: amber border, system icon, "System" label
 *   - Inline form with required inputs instead of approve/reject
 *   - Urgency indicator in header
 *
 * Player proposals:
 *   - Action type badge, player name, narrative, selections, calculated_effect
 *   - Revision count badge for resubmitted proposals
 *   - ApproveForm (quick approve + expandable options) + RejectForm
 */
export function GmProposalReviewCard({
  proposal,
  playerName,
  characterBonds = [],
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: GmProposalReviewCardProps) {
  const system = isSystem(proposal);

  const borderClass = system
    ? "border-amber-500/40 bg-amber-500/5"
    : "border-border-default bg-bg-surface";

  return (
    <article
      className={`rounded-lg border ${borderClass} p-4 flex flex-col gap-4`}
      aria-label={`${proposal.action_type} proposal${system ? " (system)" : ""}`}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* System icon + badge */}
          {system && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400"
              aria-label="System proposal"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              System
            </span>
          )}

          <ActionTypeBadge actionType={proposal.action_type} />

          {/* Revision count badge */}
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
          {/* Player name */}
          {playerName && (
            <span className="text-sm text-text-secondary">{playerName}</span>
          )}

          {/* Relative timestamp */}
          <time
            dateTime={proposal.created_at}
            className="text-xs text-text-secondary tabular-nums whitespace-nowrap"
          >
            {formatRelativeTime(proposal.created_at)}
          </time>
        </div>
      </div>

      {/* ── Narrative ──────────────────────────────────────────── */}
      {proposal.narrative ? (
        <p className="text-sm text-text-primary leading-relaxed">
          {proposal.narrative}
        </p>
      ) : (
        <p className="text-sm text-text-secondary italic">
          {system ? "System-generated proposal." : "No narrative provided."}
        </p>
      )}

      {/* ── Selections detail ──────────────────────────────────── */}
      <SelectionsSummary proposal={proposal} />

      {/* ── Calculated effect ──────────────────────────────────── */}
      {proposal.calculated_effect && !system && (
        <CalculatedEffectCard
          actionType={proposal.action_type}
          calculatedEffect={proposal.calculated_effect}
        />
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1 border-t border-border-default">
        {/* Approve form (includes system proposal inline forms) */}
        <ApproveForm
          proposal={proposal}
          characterBonds={characterBonds}
          onApprove={(payload) => onApprove(proposal.id, payload)}
          isSubmitting={isApproving}
        />

        {/* Reject form — not shown for system proposals */}
        {!system && (
          <RejectForm
            onReject={(payload) => onReject(proposal.id, payload)}
            isSubmitting={isRejecting}
          />
        )}
      </div>
    </article>
  );
}
