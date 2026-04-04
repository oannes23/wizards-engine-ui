/**
 * Proposals feature module — public exports.
 */

// Components
export { ActionTypeBadge } from "./components/ActionTypeBadge";
export { CalculatedEffectCard } from "./components/CalculatedEffectCard";
export { ReviewStep } from "./components/ReviewStep";
export { ProposalCard } from "./components/ProposalCard";
export { ProposalFilterChips } from "./components/ProposalFilterChips";
export { ActionTypeSelector } from "./components/ActionTypeSelector";
export { ModifierSelector } from "./components/ModifierSelector";
export type { ModifierSelections } from "./components/ModifierSelector";
export { WizardProvider, useWizard, WIZARD_STEPS, clearWizardDraft } from "./components/WizardProvider";
export type { WizardStep, WizardState } from "./components/WizardProvider";
export { SacrificeBuilder, emptySacrificeValue, buildSacrificePayload } from "./components/SacrificeBuilder";
export type { SacrificeBuilderValue, SacrificeAmounts } from "./components/SacrificeBuilder";
export { UseSkillForm } from "./components/forms/UseSkillForm";
export { UseMagicForm } from "./components/forms/UseMagicForm";
export { ChargeMagicForm } from "./components/forms/ChargeMagicForm";

// Hooks
export { useProposals, useAllProposals, useProposal, useDeleteProposal } from "./hooks/useProposals";

// Types
export type { ProposalFilterStatus, ActionCategory } from "./types";
export {
  PROPOSAL_FILTER_CHIPS,
  ACTION_CATEGORIES,
  ACTION_CATEGORY_COLORS,
} from "./types";
