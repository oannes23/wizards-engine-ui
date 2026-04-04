"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import type {
  ProposalResponse,
  ActionType,
  BondDisplayResponse,
} from "@/lib/api/types";
import type { ApproveProposalRequest } from "@/lib/api/services/proposals";

// ── Types ─────────────────────────────────────────────────────────

interface ApproveFormProps {
  proposal: ProposalResponse;
  /** Called with the assembled approval payload */
  onApprove: (payload: ApproveProposalRequest) => void;
  isSubmitting?: boolean;
  /** Active bonds for the affected character — required for resolve_trauma */
  characterBonds?: BondDisplayResponse[];
}

// ── Helpers ───────────────────────────────────────────────────────

const MAGIC_TYPES: ActionType[] = ["use_magic", "charge_magic"];
const SYSTEM_TYPES: ActionType[] = ["resolve_trauma", "resolve_clock"];

function isMagicProposal(actionType: ActionType): boolean {
  return MAGIC_TYPES.includes(actionType);
}

function isSystemProposal(actionType: ActionType): boolean {
  return SYSTEM_TYPES.includes(actionType);
}

// ── Resolve Trauma form ───────────────────────────────────────────

interface ResolveTraumaFormProps {
  characterBonds: BondDisplayResponse[];
  onResolve: (payload: ApproveProposalRequest) => void;
  isSubmitting?: boolean;
}

function ResolveTraumaForm({
  characterBonds,
  onResolve,
  isSubmitting,
}: ResolveTraumaFormProps) {
  const [traumaBondId, setTraumaBondId] = useState("");
  const [traumaName, setTraumaName] = useState("");
  const [traumaDescription, setTraumaDescription] = useState("");
  const [riderNarrative, setRiderNarrative] = useState("");
  const [showRider, setShowRider] = useState(false);

  const canSubmit = traumaBondId && traumaName && traumaDescription;

  function handleResolve() {
    const payload: ApproveProposalRequest = {
      gm_overrides: {
        trauma_bond_id: traumaBondId,
        trauma_name: traumaName,
        trauma_description: traumaDescription,
      },
    };
    if (showRider && riderNarrative) {
      payload.rider_event = {
        type: "character.trauma_resolved",
        narrative: riderNarrative,
        visibility: "bonded",
      };
    }
    onResolve(payload);
  }

  const activeBonds = characterBonds.filter((b) => b.is_active && !b.is_trauma);

  return (
    <div className="space-y-4">
      {/* Bond selector */}
      <div>
        <label
          htmlFor="trauma-bond-select"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Bond becomes Trauma <span className="text-meter-stress">*</span>
        </label>
        <select
          id="trauma-bond-select"
          value={traumaBondId}
          onChange={(e) => setTraumaBondId(e.target.value)}
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
          aria-required="true"
        >
          <option value="">Select a bond…</option>
          {activeBonds.map((bond) => (
            <option key={bond.id} value={bond.id}>
              {bond.target_name} — {bond.label}
            </option>
          ))}
        </select>
      </div>

      {/* Trauma name */}
      <div>
        <label
          htmlFor="trauma-name"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Trauma name <span className="text-meter-stress">*</span>
        </label>
        <input
          id="trauma-name"
          type="text"
          value={traumaName}
          onChange={(e) => setTraumaName(e.target.value)}
          placeholder="e.g. The Night of Broken Mirrors"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
          aria-required="true"
        />
      </div>

      {/* Trauma description */}
      <div>
        <label
          htmlFor="trauma-description"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Trauma description <span className="text-meter-stress">*</span>
        </label>
        <textarea
          id="trauma-description"
          value={traumaDescription}
          onChange={(e) => setTraumaDescription(e.target.value)}
          placeholder="Describe the nature of this trauma…"
          rows={3}
          className="
            w-full resize-none rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
          aria-required="true"
        />
      </div>

      {/* Optional rider event */}
      {!showRider ? (
        <button
          type="button"
          onClick={() => setShowRider(true)}
          className="
            inline-flex items-center gap-1.5 text-sm text-text-secondary
            hover:text-text-primary transition-colors
          "
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add rider event
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="trauma-rider-narrative"
              className="block text-sm font-medium text-text-primary"
            >
              Rider narrative
            </label>
            <button
              type="button"
              onClick={() => { setShowRider(false); setRiderNarrative(""); }}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Remove rider event"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <textarea
            id="trauma-rider-narrative"
            value={riderNarrative}
            onChange={(e) => setRiderNarrative(e.target.value)}
            placeholder="Rider event narrative…"
            rows={2}
            className="
              w-full resize-none rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
          />
        </div>
      )}

      {/* Resolve button */}
      <button
        type="button"
        onClick={handleResolve}
        disabled={!canSubmit || isSubmitting}
        className="
          w-full rounded-md bg-meter-stress/90 px-4 py-2.5
          text-sm font-semibold text-white
          hover:bg-meter-stress transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        "
        aria-label="Resolve trauma"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Resolving…" : "Resolve Trauma"}
      </button>
    </div>
  );
}

// ── Resolve Clock form ────────────────────────────────────────────

interface ResolveClockFormProps {
  onResolve: (payload: ApproveProposalRequest) => void;
  isSubmitting?: boolean;
}

function ResolveClockForm({ onResolve, isSubmitting }: ResolveClockFormProps) {
  const [narrative, setNarrative] = useState("");
  const [riderNarrative, setRiderNarrative] = useState("");
  const [showRider, setShowRider] = useState(false);

  function handleResolve() {
    const payload: ApproveProposalRequest = {
      narrative: narrative || undefined,
    };
    if (showRider && riderNarrative) {
      payload.rider_event = {
        type: "clock.resolved",
        narrative: riderNarrative,
        visibility: "bonded",
      };
    }
    onResolve(payload);
  }

  return (
    <div className="space-y-4">
      {/* Outcome narrative */}
      <div>
        <label
          htmlFor="clock-narrative"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Outcome narrative
        </label>
        <textarea
          id="clock-narrative"
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="What happens when the clock completes?"
          rows={3}
          className="
            w-full resize-none rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
        />
      </div>

      {/* Optional rider event */}
      {!showRider ? (
        <button
          type="button"
          onClick={() => setShowRider(true)}
          className="
            inline-flex items-center gap-1.5 text-sm text-text-secondary
            hover:text-text-primary transition-colors
          "
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add rider event
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="clock-rider-narrative"
              className="block text-sm font-medium text-text-primary"
            >
              Rider narrative
            </label>
            <button
              type="button"
              onClick={() => { setShowRider(false); setRiderNarrative(""); }}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Remove rider event"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <textarea
            id="clock-rider-narrative"
            value={riderNarrative}
            onChange={(e) => setRiderNarrative(e.target.value)}
            placeholder="Rider event narrative…"
            rows={2}
            className="
              w-full resize-none rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
          />
        </div>
      )}

      {/* Resolve button */}
      <button
        type="button"
        onClick={handleResolve}
        disabled={isSubmitting}
        className="
          w-full rounded-md bg-brand-blue px-4 py-2.5
          text-sm font-semibold text-white
          hover:bg-brand-blue/90 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        "
        aria-label="Resolve clock"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Resolving…" : "Resolve Clock"}
      </button>
    </div>
  );
}

// ── Magic Overrides sub-panel ─────────────────────────────────────

interface MagicOverridesState {
  actual_stat?: string;
  style_bonus?: number;
  effect_name?: string;
  effect_description?: string;
  effect_type?: string;
  effect_power_level?: number;
  effect_charges_current?: number;
  effect_charges_max?: number;
  charges_added?: number;
  power_boost?: number;
}

interface MagicOverridesPanelProps {
  actionType: ActionType;
  value: MagicOverridesState;
  onChange: (v: MagicOverridesState) => void;
}

const MAGIC_STAT_OPTIONS = [
  "being",
  "wyrding",
  "summoning",
  "enchanting",
  "dreaming",
] as const;

const EFFECT_TYPE_OPTIONS = ["instant", "charged", "permanent"] as const;

function MagicOverridesPanel({ actionType, value, onChange }: MagicOverridesPanelProps) {
  const isCharge = actionType === "charge_magic";

  function set(key: keyof MagicOverridesState, v: string | number | undefined) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-3 pt-2">
      {/* actual_stat override */}
      <div>
        <label
          htmlFor="magic-actual-stat"
          className="block text-xs font-medium text-text-secondary mb-1"
        >
          Override stat
        </label>
        <select
          id="magic-actual-stat"
          value={value.actual_stat ?? ""}
          onChange={(e) => set("actual_stat", e.target.value || undefined)}
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-1.5 text-sm text-text-primary
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
        >
          <option value="">Use player suggestion</option>
          {MAGIC_STAT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* style_bonus */}
      <div>
        <label
          htmlFor="magic-style-bonus"
          className="block text-xs font-medium text-text-secondary mb-1"
        >
          Style bonus (hidden gnosis)
        </label>
        <input
          id="magic-style-bonus"
          type="number"
          min={0}
          value={value.style_bonus ?? ""}
          onChange={(e) =>
            set("style_bonus", e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="0"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
          "
        />
      </div>

      {/* charge_magic specific */}
      {isCharge && (
        <>
          <div>
            <label
              htmlFor="magic-charges-added"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Charges added
            </label>
            <input
              id="magic-charges-added"
              type="number"
              min={0}
              value={value.charges_added ?? ""}
              onChange={(e) =>
                set("charges_added", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Auto"
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
              "
            />
          </div>
          <div>
            <label
              htmlFor="magic-power-boost"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Power boost
            </label>
            <input
              id="magic-power-boost"
              type="number"
              min={0}
              value={value.power_boost ?? ""}
              onChange={(e) =>
                set("power_boost", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0"
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
              "
            />
          </div>
        </>
      )}

      {/* use_magic: effect_details */}
      {!isCharge && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium text-text-secondary">
            Effect details (overrides auto-creation)
          </p>
          <input
            type="text"
            value={value.effect_name ?? ""}
            onChange={(e) => set("effect_name", e.target.value || undefined)}
            placeholder="Effect name"
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
            aria-label="Effect name"
          />
          <textarea
            value={value.effect_description ?? ""}
            onChange={(e) => set("effect_description", e.target.value || undefined)}
            placeholder="Effect description"
            rows={2}
            className="
              w-full resize-none rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
            aria-label="Effect description"
          />
          <select
            value={value.effect_type ?? ""}
            onChange={(e) => set("effect_type", e.target.value || undefined)}
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
            aria-label="Effect type"
          >
            <option value="">Type…</option>
            {EFFECT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={5}
            value={value.effect_power_level ?? ""}
            onChange={(e) =>
              set("effect_power_level", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="Power level (1–5)"
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
            "
            aria-label="Effect power level"
          />
          {value.effect_type === "charged" && (
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={value.effect_charges_current ?? ""}
                onChange={(e) =>
                  set("effect_charges_current", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Charges current"
                className="
                  flex-1 rounded-md border border-border-default bg-bg-elevated
                  px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
                  focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
                "
                aria-label="Charges current"
              />
              <input
                type="number"
                min={1}
                value={value.effect_charges_max ?? ""}
                onChange={(e) =>
                  set("effect_charges_max", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Charges max"
                className="
                  flex-1 rounded-md border border-border-default bg-bg-elevated
                  px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
                  focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
                "
                aria-label="Charges max"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rider Event mini-form ─────────────────────────────────────────

interface RiderEventState {
  type: string;
  narrative: string;
}

interface RiderEventFormProps {
  value: RiderEventState | null;
  onChange: (v: RiderEventState | null) => void;
}

function RiderEventForm({ value, onChange }: RiderEventFormProps) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => onChange({ type: "", narrative: "" })}
        className="
          inline-flex items-center gap-1.5 text-sm text-text-secondary
          hover:text-text-primary transition-colors
        "
        aria-label="Add rider event"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add rider event
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border-default bg-bg-elevated p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Rider Event
        </p>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-text-secondary hover:text-text-primary"
          aria-label="Remove rider event"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <input
        type="text"
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
        placeholder="Event type (e.g. clock.advanced)"
        className="
          w-full rounded-md border border-border-default bg-bg-surface
          px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
          focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
        "
        aria-label="Rider event type"
      />
      <textarea
        value={value.narrative}
        onChange={(e) => onChange({ ...value, narrative: e.target.value })}
        placeholder="Rider narrative (optional)"
        rows={2}
        className="
          w-full resize-none rounded-md border border-border-default bg-bg-surface
          px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50
          focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
        "
        aria-label="Rider event narrative"
      />
    </div>
  );
}

// ── Main ApproveForm ──────────────────────────────────────────────

/**
 * ApproveForm — contextual approval UI for a GM queue proposal card.
 *
 * - System proposals (resolve_trauma, resolve_clock): inline required-input form
 *   with a [Resolve] button instead of the standard approve flow.
 * - Player proposals: [Approve] quick button + expandable "Options" section
 *   with narrative override, gm_overrides flags, rider event, and (for magic)
 *   a Magic Overrides sub-panel.
 */
export function ApproveForm({
  proposal,
  onApprove,
  isSubmitting = false,
  characterBonds = [],
}: ApproveFormProps) {
  const { action_type } = proposal;

  // ── System proposal: resolve_trauma ──────────────────────────────
  if (action_type === "resolve_trauma") {
    return (
      <div aria-label="Resolve trauma form">
        <ResolveTraumaForm
          characterBonds={characterBonds}
          onResolve={onApprove}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // ── System proposal: resolve_clock ───────────────────────────────
  if (action_type === "resolve_clock") {
    return (
      <div aria-label="Resolve clock form">
        <ResolveClockForm onResolve={onApprove} isSubmitting={isSubmitting} />
      </div>
    );
  }

  // ── Player proposal: quick approve + optional overrides ───────────
  return (
    <PlayerApproveForm
      proposal={proposal}
      onApprove={onApprove}
      isSubmitting={isSubmitting}
    />
  );
}

// ── Player proposal approve form ──────────────────────────────────

interface PlayerApproveFormProps {
  proposal: ProposalResponse;
  onApprove: (payload: ApproveProposalRequest) => void;
  isSubmitting: boolean;
}

function PlayerApproveForm({
  proposal,
  onApprove,
  isSubmitting,
}: PlayerApproveFormProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [narrativeOverride, setNarrativeOverride] = useState("");
  const [forceFlag, setForceFlag] = useState(false);
  const [bondStrainedFlag, setBondStrainedFlag] = useState(false);
  const [magicOverrides, setMagicOverrides] = useState<MagicOverridesState>({});
  const [rider, setRider] = useState<RiderEventState | null>(null);

  const isMagic = isMagicProposal(proposal.action_type);

  // Pre-fill rider for work_on_project with clock_id
  const shouldPreFillRider =
    proposal.action_type === "work_on_project" && proposal.clock_id && !rider;

  if (shouldPreFillRider && !showOptions) {
    // Hint: the rider will appear when options opens
  }

  function handleQuickApprove() {
    onApprove({});
  }

  function handleApproveWithOptions() {
    const payload: ApproveProposalRequest = {};

    if (narrativeOverride.trim()) {
      payload.narrative = narrativeOverride.trim();
    }

    const overrides: Record<string, unknown> = {};
    if (forceFlag) overrides.force = true;
    if (bondStrainedFlag) overrides.bond_strained = true;

    // Magic overrides
    if (isMagic) {
      if (magicOverrides.actual_stat) overrides.actual_stat = magicOverrides.actual_stat;
      if (magicOverrides.style_bonus != null) overrides.style_bonus = magicOverrides.style_bonus;

      if (proposal.action_type === "use_magic" && magicOverrides.effect_name) {
        overrides.effect_details = {
          name: magicOverrides.effect_name,
          description: magicOverrides.effect_description ?? "",
          effect_type: magicOverrides.effect_type ?? "instant",
          power_level: magicOverrides.effect_power_level ?? 1,
          ...(magicOverrides.effect_type === "charged" && {
            charges_current: magicOverrides.effect_charges_current ?? 0,
            charges_max: magicOverrides.effect_charges_max ?? 5,
          }),
        };
      }

      if (proposal.action_type === "charge_magic") {
        if (magicOverrides.charges_added != null)
          overrides.charges_added = magicOverrides.charges_added;
        if (magicOverrides.power_boost != null)
          overrides.power_boost = magicOverrides.power_boost;
      }
    }

    if (Object.keys(overrides).length > 0) {
      payload.gm_overrides = overrides;
    }

    if (rider?.type) {
      payload.rider_event = {
        type: rider.type,
        narrative: rider.narrative || undefined,
        visibility: "bonded",
      };
    }

    onApprove(payload);
  }

  function handleToggleOptions() {
    const opening = !showOptions;
    setShowOptions(opening);

    // Pre-fill rider for work_on_project + clock_id on first open
    if (
      opening &&
      proposal.action_type === "work_on_project" &&
      proposal.clock_id &&
      !rider
    ) {
      setRider({
        type: "clock.advanced",
        narrative: "",
      });
    }
  }

  return (
    <div className="space-y-3" aria-label="Approve form">
      {/* Quick approve button */}
      <button
        type="button"
        onClick={handleQuickApprove}
        disabled={isSubmitting}
        className="
          w-full rounded-md bg-status-approved px-4 py-2.5
          text-sm font-semibold text-white
          hover:bg-status-approved/90 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        "
        aria-label="Approve proposal"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Approving…" : "Approve"}
      </button>

      {/* Options toggle */}
      <button
        type="button"
        onClick={handleToggleOptions}
        className="
          flex w-full items-center justify-between
          text-sm text-text-secondary hover:text-text-primary transition-colors
          py-1
        "
        aria-expanded={showOptions}
        aria-controls="approve-options-panel"
      >
        <span>Options</span>
        {showOptions ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* Options panel */}
      {showOptions && (
        <div
          id="approve-options-panel"
          className="space-y-4 rounded-md border border-border-default bg-bg-elevated p-4"
        >
          {/* Narrative override */}
          <div>
            <label
              htmlFor="narrative-override"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Narrative override
              <span className="ml-1 text-xs text-text-secondary font-normal">(optional)</span>
            </label>
            <textarea
              id="narrative-override"
              value={narrativeOverride}
              onChange={(e) => setNarrativeOverride(e.target.value)}
              placeholder="Override the player's narrative…"
              rows={3}
              className="
                w-full resize-none rounded-md border border-border-default bg-bg-surface
                px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue
              "
            />
          </div>

          {/* GM Override flags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">GM flags</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceFlag}
                onChange={(e) => setForceFlag(e.target.checked)}
                className="rounded border-border-default accent-brand-blue"
                aria-label="Force approval despite insufficient resources"
              />
              <span className="text-sm text-text-primary">Force</span>
              <span className="text-xs text-text-secondary">
                (approve despite insufficient resources)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bondStrainedFlag}
                onChange={(e) => setBondStrainedFlag(e.target.checked)}
                className="rounded border-border-default accent-brand-blue"
                aria-label="Bond strained flag"
              />
              <span className="text-sm text-text-primary">Bond strained</span>
              <span className="text-xs text-text-secondary">
                (+1 stress to bond modifier's character)
              </span>
            </label>
          </div>

          {/* Magic overrides (magic proposals only) */}
          {isMagic && (
            <ExpandableSection title="Magic Overrides" defaultOpen={false}>
              <MagicOverridesPanel
                actionType={proposal.action_type}
                value={magicOverrides}
                onChange={setMagicOverrides}
              />
            </ExpandableSection>
          )}

          {/* Rider event */}
          <RiderEventForm value={rider} onChange={setRider} />

          {/* Approve with options button */}
          <button
            type="button"
            onClick={handleApproveWithOptions}
            disabled={isSubmitting}
            className="
              w-full rounded-md bg-status-approved px-4 py-2.5
              text-sm font-semibold text-white
              hover:bg-status-approved/90 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
            aria-label="Approve with options"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Approving…" : "Approve with options"}
          </button>
        </div>
      )}
    </div>
  );
}

// Re-export helper for consumers that need to detect system proposals
export { isSystemProposal, isMagicProposal };
