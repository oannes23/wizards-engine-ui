import type { ProposalFilterStatus } from "../types";
import { PROPOSAL_FILTER_CHIPS } from "../types";

interface ProposalFilterChipsProps {
  active: ProposalFilterStatus;
  pendingCount: number;
  onChange: (status: ProposalFilterStatus) => void;
}

/**
 * ProposalFilterChips — horizontal chip row for filtering proposals by status.
 *
 * Shows: All | Pending (N) | Approved | Rejected
 * The pending chip includes the count badge.
 */
export function ProposalFilterChips({
  active,
  pendingCount,
  onChange,
}: ProposalFilterChipsProps) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Filter proposals by status"
    >
      {PROPOSAL_FILTER_CHIPS.map((chip) => {
        const isActive = chip.id === active;
        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id)}
            aria-pressed={isActive}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1
              text-sm font-medium transition-colors min-h-[32px]
              ${
                isActive
                  ? "bg-brand-teal text-bg-page"
                  : "bg-bg-elevated text-text-secondary hover:bg-brand-navy-light hover:text-text-primary"
              }
            `}
          >
            {chip.label}
            {chip.id === "pending" && pendingCount > 0 && (
              <span
                className={`
                  inline-flex items-center justify-center rounded-full
                  px-1.5 py-0.5 text-xs font-semibold tabular-nums min-w-[18px]
                  ${isActive ? "bg-bg-page/20 text-bg-page" : "bg-status-pending/20 text-status-pending"}
                `}
                aria-label={`${pendingCount} pending`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
