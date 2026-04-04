"use client";

/**
 * ReviewStep — Wizard Step 3: Review & Submit
 *
 * On mount, calls POST /proposals/calculate (dry-run) to get the
 * server-computed calculated_effect. Displays a formatted summary of
 * all selections plus the CalculatedEffectCard.
 *
 * - 422 from calculate → navigate back to Step 2 with field-level errors
 * - Submit button → POST /proposals → toast + redirect to /proposals
 * - Back button → Step 2 without losing state
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { CalculatedEffectCard } from "./CalculatedEffectCard";
import {
  calculateProposal,
  submitProposal,
  updateProposal,
} from "@/lib/api/services/proposals";
import type { CalculateProposalResponse } from "@/lib/api/services/proposals";
import { ApiError } from "@/lib/api/errors";
import { clearWizardDraft } from "./WizardProvider";
import { useToast } from "@/lib/toast/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { ACTION_TYPE_LABELS } from "@/lib/constants";
import type { WizardStep } from "./WizardProvider";

// ── Types ────────────────────────────────────────────────────────────

interface ReviewStepProps {
  characterId: string;
  /** If provided, PATCH this proposal instead of creating a new one */
  editProposalId?: string;
  /** Called with field-level validation errors when calculate returns 422 */
  onValidationErrors?: (errors: Record<string, string>) => void;
}

// ── Selections summary helpers ────────────────────────────────────────

/**
 * Render a scalar selection value as a human-readable string.
 */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length === 0
      ? "None"
      : `${value.length} item${value.length !== 1 ? "s" : ""}`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== ""
    );
    if (entries.length === 0) return "None";
    return entries.map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(", ");
  }
  return String(value);
}

/**
 * Render selections as a description list.
 * Omits null/undefined/"" values and "modifiers" when empty.
 */
function SelectionsSummary({
  selections,
}: {
  selections: Record<string, unknown>;
}) {
  const entries = Object.entries(selections).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "object" && !Array.isArray(v)) {
      return Object.values(v as Record<string, unknown>).some(
        (inner) => inner !== null && inner !== undefined && inner !== ""
      );
    }
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <dl className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 text-sm">
          <dt className="shrink-0 text-text-secondary capitalize min-w-[100px]">
            {key.replace(/_/g, " ")}
          </dt>
          <dd className="text-text-primary font-medium break-all">
            {renderValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ── Component ─────────────────────────────────────────────────────────

export function ReviewStep({
  characterId,
  editProposalId,
  onValidationErrors,
}: ReviewStepProps) {
  const { state, goBack, goToStep, reset } = useWizard();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [calculationResult, setCalculationResult] =
    useState<CalculateProposalResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { actionType, narrative, formData } = state;
  const currentSelections = useMemo(
    () => (actionType ? (formData[actionType] ?? {}) : {}),
    [actionType, formData]
  );

  // ── Build request payload ────────────────────────────────────────

  const buildPayload = useCallback(() => {
    if (!actionType) return null;
    return {
      character_id: characterId,
      action_type: actionType,
      narrative: narrative || undefined,
      selections: Object.keys(currentSelections).length > 0
        ? currentSelections
        : undefined,
    };
  }, [actionType, characterId, narrative, currentSelections]);

  // ── Calculate on mount ───────────────────────────────────────────

  useEffect(() => {
    const payload = buildPayload();
    if (!payload) return;

    let cancelled = false;
    setIsCalculating(true);
    setCalculateError(null);

    calculateProposal(payload)
      .then((result) => {
        if (!cancelled) {
          setCalculationResult(result);
          setIsCalculating(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setIsCalculating(false);

        if (err instanceof ApiError && err.status === 422) {
          // Navigate back to step 2 with field errors
          const fieldErrors = err.details?.fields ?? {};
          onValidationErrors?.(fieldErrors);
          goToStep(1 as WizardStep);
          return;
        }

        // Generic error — show in step 3 with retry option
        setCalculateError(
          err instanceof ApiError
            ? err.message
            : "Could not compute effect. Please try again."
        );
      });

    return () => {
      cancelled = true;
    };
    // Only recalculate on mount — intentional single-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit ───────────────────────────────────────────────────────

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editProposalId) {
        await updateProposal(editProposalId, {
          narrative: payload.narrative,
          selections: payload.selections,
        });
      } else {
        await submitProposal(payload);
      }

      clearWizardDraft();
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      toastSuccess(
        editProposalId ? "Proposal updated and resubmitted." : "Proposal submitted!"
      );
      router.push("/proposals");
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof ApiError && err.status === 409) {
        toastError("This proposal has already been approved and cannot be edited.");
      } else {
        toastError("Failed to submit proposal. Please try again.");
      }
    }
  }

  // ── Retry calculate ──────────────────────────────────────────────

  function handleRetryCalculate() {
    const payload = buildPayload();
    if (!payload) return;

    setIsCalculating(true);
    setCalculateError(null);

    calculateProposal(payload)
      .then((result) => {
        setCalculationResult(result);
        setIsCalculating(false);
      })
      .catch((err: unknown) => {
        setIsCalculating(false);
        if (err instanceof ApiError && err.status === 422) {
          const fieldErrors = err.details?.fields ?? {};
          onValidationErrors?.(fieldErrors);
          goToStep(1 as WizardStep);
          return;
        }
        setCalculateError(
          err instanceof ApiError
            ? err.message
            : "Could not compute effect. Please try again."
        );
      });
  }

  if (!actionType) return null;

  const actionLabel = ACTION_TYPE_LABELS[actionType] ?? actionType;

  return (
    <div className="flex flex-col gap-6" data-testid="review-step">
      {/* Proposal summary card */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-text-primary">Review Your Proposal</h2>

        {/* Action type */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Action</span>
          <span className="font-medium text-sm text-text-primary">{actionLabel}</span>
        </div>

        {/* Narrative */}
        {narrative && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Narrative
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{narrative}</p>
          </div>
        )}

        {/* Selections */}
        {Object.keys(currentSelections).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Selections
            </p>
            <SelectionsSummary selections={currentSelections} />
          </div>
        )}
      </div>

      {/* Calculated effect */}
      {isCalculating && (
        <div
          className="rounded-lg border border-border-default bg-bg-elevated p-6 flex items-center justify-center gap-3"
          aria-busy="true"
          aria-label="Computing effect"
          data-testid="calculating-spinner"
        >
          <Loader2
            className="h-5 w-5 text-brand-teal animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-text-secondary">Computing effect…</span>
        </div>
      )}

      {!isCalculating && calculateError && (
        <div
          className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4 flex flex-col gap-3"
          role="alert"
          data-testid="calculate-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-status-rejected shrink-0" aria-hidden="true" />
            <p className="text-sm text-status-rejected">{calculateError}</p>
          </div>
          <button
            type="button"
            onClick={handleRetryCalculate}
            className="
              self-start inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
              text-sm font-medium bg-bg-elevated text-text-primary
              hover:bg-brand-navy-light transition-colors
            "
          >
            Retry
          </button>
        </div>
      )}

      {!isCalculating && !calculateError && calculationResult && (
        <CalculatedEffectCard
          actionType={actionType}
          calculatedEffect={calculationResult.calculated_effect}
          data-testid="calculated-effect-card"
        />
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          disabled={isSubmitting}
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-bg-elevated text-text-primary
            hover:bg-brand-navy-light transition-colors min-h-[40px]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Back to fill details"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isCalculating}
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-brand-teal text-bg-page
            hover:bg-brand-teal/90 transition-colors min-h-[40px] ml-auto
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label={editProposalId ? "Resubmit proposal" : "Submit proposal"}
          data-testid="submit-button"
        >
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {editProposalId ? "Resubmit" : "Submit Proposal"}
        </button>
      </div>
    </div>
  );
}
