"use client";

/**
 * ActionTypeSelector — Wizard Step 1.
 *
 * Groups action types into "Session Actions" and "Downtime Actions".
 * Session actions disabled when no active session.
 * Downtime actions disabled when FT = 0.
 * Disabled cards show a tooltip explaining why.
 */

import { Zap, Sparkles, Battery, RefreshCw, Wrench, BedDouble, Star, Link2 } from "lucide-react";
import type { ActionType } from "@/lib/api/types";
import { useWizard } from "./WizardProvider";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";

// ── Action type metadata ────────────────────────────────────────────

interface ActionTypeInfo {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SESSION_ACTIONS: ActionTypeInfo[] = [
  {
    type: "use_skill",
    label: "Use Skill",
    description: "Roll skill dice with optional modifiers and plot spend.",
    icon: <Zap className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "use_magic",
    label: "Use Magic",
    description: "Sacrifice resources for magic dice to create an effect.",
    icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "charge_magic",
    label: "Charge Magic",
    description: "Sacrifice resources to recharge or boost an active magic effect.",
    icon: <Battery className="h-5 w-5" aria-hidden="true" />,
  },
];

const DOWNTIME_ACTIONS: ActionTypeInfo[] = [
  {
    type: "regain_gnosis",
    label: "Regain Gnosis",
    description: "Restore gnosis using base formula plus optional modifiers.",
    icon: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "rest",
    label: "Rest",
    description: "Heal stress using base formula plus optional modifiers.",
    icon: <BedDouble className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "work_on_project",
    label: "Work on Project",
    description: "Progress a story or clock with a narrative of your work.",
    icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "new_trait",
    label: "New Trait",
    description: "Propose a new core or role trait, from a template or custom.",
    icon: <Star className="h-5 w-5" aria-hidden="true" />,
  },
  {
    type: "new_bond",
    label: "New Bond",
    description: "Create a bond with a character, group, or location.",
    icon: <Link2 className="h-5 w-5" aria-hidden="true" />,
  },
];

// ── Sub-components ─────────────────────────────────────────────────

interface ActionCardProps {
  info: ActionTypeInfo;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
}

function ActionCard({ info, disabled, disabledReason, onClick }: ActionCardProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        type="button"
        aria-label={`Select ${info.label}`}
        aria-disabled={disabled}
        className={`
          w-full text-left rounded-lg border p-4 flex items-start gap-3
          transition-colors duration-150 min-h-[72px]
          ${disabled
            ? "border-border-default bg-bg-surface opacity-50 cursor-not-allowed"
            : "border-border-default bg-bg-surface hover:border-brand-teal hover:bg-brand-navy-light cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
          }
        `}
      >
        <span
          className={`
            mt-0.5 shrink-0
            ${disabled ? "text-text-secondary" : "text-brand-teal"}
          `}
        >
          {info.icon}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${disabled ? "text-text-secondary" : "text-text-primary"}`}>
            {info.label}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
            {info.description}
          </p>
        </div>
      </button>

      {/* Tooltip for disabled reason */}
      {disabled && disabledReason && (
        <div
          role="tooltip"
          className="
            absolute left-0 bottom-full mb-1.5 z-10
            hidden group-hover:block
            px-2.5 py-1.5 rounded-md
            bg-bg-elevated border border-border-default
            text-xs text-text-secondary
            pointer-events-none max-w-[240px] shadow-lg
          "
        >
          {disabledReason}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

interface ActionTypeSelectorProps {
  /** Free Time value from character data — downtime disabled if 0 */
  freeTime: number | null;
}

export function ActionTypeSelector({ freeTime }: ActionTypeSelectorProps) {
  const { selectActionType } = useWizard();
  const { data: activeSession } = useActiveSession();

  const hasActiveSession = !!activeSession;
  const hasFreeTime = (freeTime ?? 0) > 0;

  const sessionDisabledReason = !hasActiveSession
    ? "Session actions require an active session."
    : undefined;

  const downtimeDisabledReason = !hasFreeTime
    ? "Downtime actions cost 1 Free Time — you have none remaining."
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Session Actions */}
      <section aria-labelledby="session-actions-heading">
        <h2
          id="session-actions-heading"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3"
        >
          Session Actions
        </h2>
        <div className="flex flex-col gap-2">
          {SESSION_ACTIONS.map((info) => (
            <ActionCard
              key={info.type}
              info={info}
              disabled={!hasActiveSession}
              disabledReason={sessionDisabledReason}
              onClick={() => selectActionType(info.type)}
            />
          ))}
        </div>
      </section>

      {/* Downtime Actions */}
      <section aria-labelledby="downtime-actions-heading">
        <h2
          id="downtime-actions-heading"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3"
        >
          Downtime Actions
          <span className="ml-2 normal-case font-normal text-text-secondary/70">
            — cost 1 Free Time
          </span>
        </h2>
        <div className="flex flex-col gap-2">
          {DOWNTIME_ACTIONS.map((info) => (
            <ActionCard
              key={info.type}
              info={info}
              disabled={!hasFreeTime}
              disabledReason={downtimeDisabledReason}
              onClick={() => selectActionType(info.type)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
