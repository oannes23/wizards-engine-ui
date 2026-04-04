"use client";

/**
 * ProposalWizardPage — /proposals/new
 *
 * 3-step wizard:
 *   Step 0: ActionTypeSelector — choose action type
 *   Step 1: WizardStep2 — fill details (dynamic per action type)
 *   Step 2: Review & Submit (Batch K — placeholder)
 *
 * State management via WizardProvider (useReducer).
 * Draft auto-saved to sessionStorage on each step change.
 * Discard confirmation via beforeunload event.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { StepIndicator } from "@/components/ui/StepIndicator";
import {
  WizardProvider,
  useWizard,
  WIZARD_STEPS,
  clearWizardDraft,
  type WizardStep,
} from "@/features/proposals/components/WizardProvider";
import { ActionTypeSelector } from "@/features/proposals/components/ActionTypeSelector";
import { WizardStep2 } from "@/features/proposals/components/WizardStep2";
import { submitProposal } from "@/lib/api/services/proposals";
import { useToast } from "@/lib/toast/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { ACTION_TYPE_LABELS } from "@/lib/constants";

// ── Step 3 placeholder ────────────────────────────────────────────

function Step3Placeholder() {
  const { state, goBack } = useWizard();
  const router = useRouter();
  const { characterId } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = [false, () => {}];

  async function handleSubmit() {
    if (!characterId || !state.actionType) return;
    try {
      await submitProposal({
        character_id: characterId,
        action_type: state.actionType,
        narrative: state.narrative || undefined,
        selections: state.actionType ? state.formData[state.actionType] : undefined,
      });
      clearWizardDraft();
      toastSuccess("Proposal submitted!");
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      router.push("/proposals");
    } catch {
      toastError("Failed to submit proposal. Please try again.");
    }
  }

  void isSubmitting;

  const actionLabel = state.actionType ? ACTION_TYPE_LABELS[state.actionType] : "Unknown";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border-default bg-bg-surface p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-text-primary">Review Your Proposal</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Action</span>
            <span className="font-medium text-text-primary">{actionLabel}</span>
          </div>
          {state.narrative && (
            <div>
              <p className="text-text-secondary mb-1">Narrative</p>
              <p className="text-text-primary leading-relaxed">{state.narrative}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-text-secondary italic">
          Server calculation (dice pool, costs) coming in Batch K.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-bg-elevated text-text-primary
            hover:bg-brand-navy-light transition-colors min-h-[40px]
          "
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-brand-teal text-bg-page
            hover:bg-brand-teal/90 transition-colors min-h-[40px] ml-auto
          "
        >
          Submit Proposal
        </button>
      </div>
    </div>
  );
}

// ── Inner wizard (consumes context) ───────────────────────────────

function WizardInner() {
  const { characterId } = useAuth();
  const { data: character, isLoading, error } = useCharacter(characterId, { polling: false });
  const { state, goToStep, setFormData } = useWizard();
  const router = useRouter();

  // Warn before leaving with unsaved data
  useEffect(() => {
    if (!state.actionType) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.actionType]);

  // Loading state
  if (isLoading || !character) {
    return (
      <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading character">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-bg-elevated" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4 text-sm text-status-rejected"
        role="alert"
      >
        Could not load character data. Please try again.
      </div>
    );
  }

  function handleStep2Next(data: Record<string, unknown>) {
    if (state.actionType) {
      setFormData(data);
    }
    goToStep(2 as WizardStep);
  }

  const stepHeadings = ["Choose Action Type", "Fill in Details", "Review & Submit"];

  return (
    <div className="flex flex-col gap-6">
      {/* Step heading */}
      <h2 className="text-lg font-semibold text-text-primary">
        {stepHeadings[state.currentStep]}
      </h2>

      {/* Step content */}
      {state.currentStep === 0 && (
        <ActionTypeSelector freeTime={character.free_time} />
      )}

      {state.currentStep === 1 && state.actionType && (
        <WizardStep2 character={character} onNext={handleStep2Next} />
      )}

      {state.currentStep === 2 && (
        <Step3Placeholder />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function ProposalWizardPage() {
  return (
    <WizardProvider>
      <WizardPageLayout />
    </WizardProvider>
  );
}

function WizardPageLayout() {
  const { state } = useWizard();

  return (
    <div className="flex flex-col min-h-screen bg-bg-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/proposals"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Cancel and return to proposals"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="font-heading text-base font-bold text-text-primary">
            New Proposal
          </h1>
        </div>
        <StepIndicator
          steps={Array.from(WIZARD_STEPS)}
          currentStep={state.currentStep}
        />
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <WizardInner />
      </main>
    </div>
  );
}
