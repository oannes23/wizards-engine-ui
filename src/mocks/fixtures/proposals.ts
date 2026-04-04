import type { ProposalResponse } from "@/lib/api/types";

/**
 * Factory for ProposalResponse test fixtures.
 */
export function makeProposal(
  overrides?: Partial<ProposalResponse>
): ProposalResponse {
  return {
    id: "01PROPOSAL_DEFAULT000000",
    character_id: "01CH_A0000000000000000000",
    action_type: "use_skill",
    status: "pending",
    origin: "player",
    narrative: "I attempt to pickpocket the merchant while he is distracted.",
    selections: {
      skill: "finesse",
      modifiers: {},
    },
    calculated_effect: null,
    gm_notes: null,
    gm_overrides: null,
    revision_count: 0,
    event_id: null,
    rider_event_id: null,
    clock_id: null,
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

export function makeApprovedProposal(
  overrides?: Partial<ProposalResponse>
): ProposalResponse {
  return makeProposal({
    id: "01PROPOSAL_APPROVED00000",
    status: "approved",
    gm_notes: "Great attempt! The merchant never noticed.",
    event_id: "01EVENT_PROPOSAL0000000",
    calculated_effect: {
      dice_pool: 4,
      skill: "finesse",
      skill_level: 3,
      modifiers: [],
      plot_spend: 0,
      costs: {
        trait_charges: [],
        plot: 0,
      },
    },
    ...overrides,
  });
}

export function makeRejectedProposal(
  overrides?: Partial<ProposalResponse>
): ProposalResponse {
  return makeProposal({
    id: "01PROPOSAL_REJECTED00000",
    status: "rejected",
    gm_notes: "This is out of scope for the current scene.",
    ...overrides,
  });
}

/**
 * Factory for a calculated_effect payload — returned by POST /proposals/calculate
 * and embedded in approved proposals.
 */
export function makeCalculatedEffect(
  overrides?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return {
    dice_pool: 4,
    skill: "finesse",
    skill_level: 3,
    modifiers: [],
    plot_spend: 0,
    costs: {
      trait_charges: [],
      plot: 0,
    },
    ...overrides,
  };
}

/**
 * System-generated proposal (e.g. resolve_trauma on stress max).
 * origin: "system" distinguishes it from player-submitted proposals.
 */
export function makeSystemProposal(
  overrides?: Partial<ProposalResponse>
): ProposalResponse {
  return makeProposal({
    id: "01PROPOSAL_SYSTEM0000000",
    action_type: "resolve_trauma",
    status: "pending",
    origin: "system",
    narrative:
      "Stress has reached its maximum. A trauma must be resolved.",
    selections: {},
    ...overrides,
  });
}

export function makePendingMagicProposal(
  overrides?: Partial<ProposalResponse>
): ProposalResponse {
  return makeProposal({
    id: "01PROPOSAL_MAGIC000000000",
    action_type: "use_magic",
    status: "pending",
    narrative: "I reach into the dreaming to find a path through the shadows.",
    selections: {
      magic_stat: "dreaming",
      intention: "Find a hidden route",
      symbolism: "Silver threads of moonlight",
      sacrifice: [{ type: "gnosis", amount: 3 }],
      modifiers: {},
    },
    ...overrides,
  });
}
