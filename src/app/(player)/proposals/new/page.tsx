"use client";

/**
 * ProposalWizardPage — /proposals/new
 *
 * 3-step wizard:
 *   Step 0: ActionTypeSelector — choose action type
 *   Step 1: WizardStep2 — fill details (dynamic per action type)
 *   Step 2: ReviewStep — server calculate + submit
 *
 * State management via WizardProvider (useReducer).
 * Draft auto-saved to sessionStorage on each step change.
 * Discard confirmation via beforeunload event.
 *
 * Field errors from POST /proposals/calculate are passed into the
 * step-2 forms via the `fieldErrors` prop exposed by this page.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { StepIndicator } from "@/components/ui/StepIndicator";
import {
  WizardProvider,
  useWizard,
  WIZARD_STEPS,
  type WizardStep,
} from "@/features/proposals/components/WizardProvider";
import { ActionTypeSelector } from "@/features/proposals/components/ActionTypeSelector";
import { WizardStep2 } from "@/features/proposals/components/WizardStep2";
import { ReviewStep } from "@/features/proposals/components/ReviewStep";

// ── Inner wizard (consumes context) ───────────────────────────────

function WizardInner() {
  const { characterId } = useAuth();
  const { data: character, isLoading, error } = useCharacter(characterId, { polling: false });
  const { state, goToStep, setFormData } = useWizard();

  // Field-level errors from POST /proposals/calculate 422 response
  // Passed into the step 2 form so fields can highlight errors
  const [step2FieldErrors, setStep2FieldErrors] = useState<
    Record<string, string>
  >({});

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
    setStep2FieldErrors({});
    goToStep(2 as WizardStep);
  }

  function handleValidationErrors(errors: Record<string, string>) {
    setStep2FieldErrors(errors);
    // ReviewStep already navigates back to step 1 — we just store the errors
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
        <WizardStep2
          character={character}
          onNext={handleStep2Next}
          fieldErrors={step2FieldErrors}
        />
      )}

      {state.currentStep === 2 && characterId && (
        <ReviewStep
          characterId={characterId}
          onValidationErrors={handleValidationErrors}
        />
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
