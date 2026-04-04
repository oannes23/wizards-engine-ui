"use client";

import { useState } from "react";
import { XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { RejectProposalRequest } from "@/lib/api/services/proposals";

// ── Types ─────────────────────────────────────────────────────────

interface RejectFormProps {
  onReject: (payload: RejectProposalRequest) => void;
  isSubmitting?: boolean;
}

// ── RejectForm ────────────────────────────────────────────────────

/**
 * RejectForm — inline rejection flow for GM queue proposal cards.
 *
 * A single [Reject] button that expands inline to show an optional
 * rejection note textarea, then a [Confirm Rejection] button.
 *
 * Pattern: quick interaction (single click) — rejection note is encouraged
 * but not required.
 */
export function RejectForm({ onReject, isSubmitting = false }: RejectFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  function handleConfirm() {
    onReject({ rejection_note: rejectionNote || undefined });
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        disabled={isSubmitting}
        className="
          inline-flex items-center gap-1.5 rounded-md px-3 py-2
          text-sm font-medium text-status-rejected
          border border-status-rejected/30
          hover:bg-status-rejected/10 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          min-h-[36px]
        "
        aria-label="Reject proposal"
        aria-expanded="false"
        aria-controls="reject-note-panel"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Reject
        <ChevronDown className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      id="reject-note-panel"
      className="space-y-3 rounded-md border border-status-rejected/30 bg-status-rejected/5 p-4"
      aria-label="Rejection form"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-status-rejected">
          Reject proposal
        </p>
        <button
          type="button"
          onClick={() => { setIsExpanded(false); setRejectionNote(""); }}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Collapse rejection form"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Note textarea */}
      <div>
        <label
          htmlFor="rejection-note"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Rejection note
          <span className="ml-1 text-xs text-text-secondary font-normal">
            (optional, but encouraged)
          </span>
        </label>
        <textarea
          id="rejection-note"
          value={rejectionNote}
          onChange={(e) => setRejectionNote(e.target.value)}
          placeholder="Explain why this proposal is rejected…"
          rows={3}
          className="
            w-full resize-none rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="
            flex-1 rounded-md bg-status-rejected px-4 py-2
            text-sm font-semibold text-white
            hover:bg-status-rejected/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
          aria-label="Confirm rejection"
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Rejecting…" : "Confirm Rejection"}
        </button>
        <button
          type="button"
          onClick={() => { setIsExpanded(false); setRejectionNote(""); }}
          disabled={isSubmitting}
          className="
            rounded-md px-3 py-2 text-sm text-text-secondary
            hover:text-text-primary transition-colors
          "
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
