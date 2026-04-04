"use client";

/**
 * WizardStep2 — Dynamic form dispatcher for Wizard Step 2.
 *
 * Routes to the correct form component based on the selected action type.
 * When `fieldErrors` is non-empty (populated by a 422 from ReviewStep),
 * a validation banner is shown at the top of the form.
 */

import { AlertCircle } from "lucide-react";
import type { CharacterDetailResponse } from "@/lib/api/types";
import { useWizard } from "./WizardProvider";
import { RegainGnosisForm } from "./forms/RegainGnosisForm";
import { RestForm } from "./forms/RestForm";
import { WorkOnProjectForm } from "./forms/WorkOnProjectForm";
import { NewTraitForm } from "./forms/NewTraitForm";
import { NewBondForm } from "./forms/NewBondForm";
import { UseSkillForm } from "./forms/UseSkillForm";
import { UseMagicForm } from "./forms/UseMagicForm";
import { ChargeMagicForm } from "./forms/ChargeMagicForm";

interface WizardStep2Props {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
  /** Field-level errors surfaced from POST /proposals/calculate 422 response */
  fieldErrors?: Record<string, string>;
}

export function WizardStep2({ character, onNext, fieldErrors }: WizardStep2Props) {
  const { state } = useWizard();
  const { actionType } = state;

  if (!actionType) return null;

  const hasFieldErrors =
    fieldErrors && Object.keys(fieldErrors).length > 0;

  const form = (() => {
    switch (actionType) {
      case "regain_gnosis":
        return <RegainGnosisForm character={character} onNext={onNext} />;
      case "rest":
        return <RestForm character={character} onNext={onNext} />;
      case "work_on_project":
        return <WorkOnProjectForm character={character} onNext={onNext} />;
      case "new_trait":
        return <NewTraitForm character={character} onNext={onNext} />;
      case "new_bond":
        return <NewBondForm character={character} onNext={onNext} />;
      case "use_skill":
        return <UseSkillForm character={character} onNext={onNext} />;
      case "use_magic":
        return <UseMagicForm character={character} onNext={onNext} />;
      case "charge_magic":
        return <ChargeMagicForm character={character} onNext={onNext} />;
      default:
        return null;
    }
  })();

  return (
    <div className="flex flex-col gap-4">
      {hasFieldErrors && (
        <div
          className="rounded-lg border border-status-rejected/30 bg-status-rejected/10 p-4"
          role="alert"
          aria-label="Validation errors from server"
          data-testid="step2-field-errors"
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle
              className="h-4 w-4 text-status-rejected shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-status-rejected">
              Please fix the following before proceeding:
            </p>
          </div>
          <ul className="space-y-0.5 pl-6">
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field} className="text-sm text-status-rejected">
                <span className="capitalize">{field.replace(/_/g, " ")}</span>:{" "}
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {form}
    </div>
  );
}
