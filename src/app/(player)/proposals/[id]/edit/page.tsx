"use client";

/**
 * ProposalEditPage — /proposals/[id]/edit
 *
 * Pre-fills the wizard with the existing proposal's data.
 * Supports both pending (edit) and rejected (revise) proposals.
 *
 * On submit: PATCH /proposals/{id} (same ID, not a new proposal).
 * PATCH triggers recalculation server-side and transitions a rejected
 * proposal back to "pending" (creating a proposal.revised event).
 *
 * The GM's rejection note (if any) is shown as a warning banner at the
 * top of step 2 (via the WizardProvider initialData mechanism).
 *
 * Approved proposals redirect to the detail page — they cannot be edited.
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { StepIndicator } from "@/components/ui/StepIndicator";
import {
  WizardProvider,
  useWizard,
  type WizardStep,
  type WizardState,
} from "@/features/proposals/components/WizardProvider";
import { WizardStep2 } from "@/features/proposals/components/WizardStep2";
import { ReviewStep } from "@/features/proposals/components/ReviewStep";
import { useProposal } from "@/features/proposals";
import type { ProposalResponse } from "@/lib/api/types";

// ── Helpers ───────────────────────────────────────────────────────────

function buildInitialData(proposal: ProposalResponse): Partial<WizardState> {
  return {
    currentStep: 1,
    actionType: proposal.action_type,
    narrative: proposal.narrative ?? "",
    formData: {
      [proposal.action_type]: (proposal.selections as Record<string, unknown>) ?? {},
    },
  };
}

// ── Inner wizard content ───────────────────────────────────────────────

function EditWizardInner({
  proposal,
}: {
  proposal: ProposalResponse;
}) {
  const { characterId } = useAuth();
  const { data: character, isLoading, error } = useCharacter(characterId, { polling: false });
  const { state, goToStep, setFormData } = useWizard();

  // Field-level errors from POST /proposals/calculate 422 response
  const [step2FieldErrors, setStep2FieldErrors] = useState<
    Record<string, string>
  >({});

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
  }

  const stepHeadings = ["", "Edit Details", "Review & Resubmit"];

  return (
    <div className="flex flex-col gap-6">
      {/* Step heading */}
      <h2 className="text-lg font-semibold text-text-primary">
        {stepHeadings[state.currentStep]}
      </h2>

      {/* Rejection note banner (only on step 1 for rejected proposals) */}
      {state.currentStep === 1 && proposal.status === "rejected" && proposal.gm_notes && (
        <div
          className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4"
          role="note"
          aria-label="GM rejection note"
          data-testid="rejection-note-banner"
        >
          <p className="text-xs font-semibold text-status-rejected mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-text-primary">{proposal.gm_notes}</p>
        </div>
      )}

      {/* Step 1 — edit form (action type is fixed, so no step 0 here) */}
      {state.currentStep === 1 && state.actionType && (
        <WizardStep2
          character={character}
          onNext={handleStep2Next}
          fieldErrors={step2FieldErrors}
        />
      )}

      {/* Step 2 — review and resubmit */}
      {state.currentStep === 2 && characterId && (
        <ReviewStep
          characterId={characterId}
          editProposalId={proposal.id}
          onValidationErrors={handleValidationErrors}
        />
      )}
    </div>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────

function EditPageContent({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const { data: proposal, isLoading, isError } = useProposal(proposalId);

  // Redirect approved proposals — they cannot be edited
  useEffect(() => {
    if (proposal && proposal.status === "approved") {
      router.replace(`/proposals/${proposalId}`);
    }
  }, [proposal, proposalId, router]);

  if (isLoading) {
    return (
      <div
        className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4"
        aria-busy="true"
        aria-label="Loading proposal"
      >
        <div className="h-6 w-32 rounded bg-bg-elevated animate-pulse" />
        <div className="h-48 rounded-lg bg-bg-elevated animate-pulse" />
      </div>
    );
  }

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

  // Don't render the wizard while redirect is in progress
  if (proposal.status === "approved") return null;

  const initialData = buildInitialData(proposal);
  const isRevise = proposal.status === "rejected";

  return (
    <WizardProvider initialData={initialData} skipDraftRestore>
      <EditLayout proposalId={proposalId} isRevise={isRevise}>
        <EditWizardInner proposal={proposal} />
      </EditLayout>
    </WizardProvider>
  );
}

function EditLayout({
  proposalId,
  isRevise,
  children,
}: {
  proposalId: string;
  isRevise: boolean;
  children: React.ReactNode;
}) {
  const { state } = useWizard();

  return (
    <div className="flex flex-col min-h-screen bg-bg-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/proposals/${proposalId}`}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Cancel and return to proposal"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="font-heading text-base font-bold text-text-primary">
            {isRevise ? "Revise Proposal" : "Edit Proposal"}
          </h1>
        </div>
        {/* Step indicator: only steps 1 and 2 are relevant in edit mode */}
        <StepIndicator
          steps={["Edit Details", "Review & Resubmit"]}
          currentStep={state.currentStep === 2 ? 1 : 0}
        />
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

// ── Page default export ────────────────────────────────────────────────

export default function ProposalEditPage() {
  const { id } = useParams<{ id: string }>();
  return <EditPageContent proposalId={id} />;
}
