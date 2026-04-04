"use client";

/**
 * WizardStep2 — Dynamic form dispatcher for Wizard Step 2.
 *
 * Routes to the correct form component based on the selected action type.
 */

import type { CharacterDetailResponse, ActionType } from "@/lib/api/types";
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
}

export function WizardStep2({ character, onNext }: WizardStep2Props) {
  const { state } = useWizard();
  const { actionType } = state;

  if (!actionType) return null;

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
}
