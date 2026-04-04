/**
 * Proposals feature — local types and helpers.
 *
 * Domain response shapes live in src/lib/api/types.ts.
 * This file holds UI-specific types and computed helpers.
 */

import type { ProposalStatus, ActionType } from "@/lib/api/types";

// ── Status filter chips ───────────────────────────────────────────

export type ProposalFilterStatus = "all" | ProposalStatus;

export interface ProposalFilterChip {
  id: ProposalFilterStatus;
  label: string;
}

export const PROPOSAL_FILTER_CHIPS: ProposalFilterChip[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

// ── Action type groupings ─────────────────────────────────────────

export type ActionCategory = "session" | "downtime" | "system";

export const ACTION_CATEGORIES: Record<ActionType, ActionCategory> = {
  use_skill: "session",
  use_magic: "session",
  charge_magic: "session",
  regain_gnosis: "downtime",
  work_on_project: "downtime",
  rest: "downtime",
  new_trait: "downtime",
  new_bond: "downtime",
  resolve_clock: "system",
  resolve_trauma: "system",
};

// ── Action type color coding ──────────────────────────────────────

/**
 * Color classes for action type badges, keyed by category.
 */
export const ACTION_CATEGORY_COLORS: Record<ActionCategory, string> = {
  session: "bg-brand-blue/20 text-brand-blue",
  downtime: "bg-meter-ft/20 text-meter-ft",
  system: "bg-meter-stress/20 text-meter-stress",
};
