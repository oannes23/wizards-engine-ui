"use client";

/**
 * SacrificeBuilder — Inline sacrifice selection sub-form for magic proposals.
 *
 * Used in: use_magic, charge_magic wizard forms.
 *
 * Spec: spec/domains/magic.md (Sacrifice System + Sacrifice Builder)
 *
 * Sacrifice sources:
 *   Gnosis stepper (0 → current gnosis), 1:1 exchange rate
 *   Stress stepper (0 → available stress capacity), 1:2 exchange rate
 *   FT stepper (0 → current FT), 1:(3+lowest_magic_stat) exchange rate
 *   Bond toggles (binary, confirmation dialog), flat 10 equiv each
 *   Trait toggles (binary, confirmation dialog), flat 10 equiv each
 *   Creative sacrifice (hidden link, freeform text, 0 equiv until GM-assigned)
 *
 * Running total displayed as "Total: X equiv → N dice"
 *
 * Bond/trait can also be used as modifiers in the same proposal (no constraint).
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import type {
  CharacterDetailResponse,
  BondDisplayResponse,
  CharacterTraitResponse,
  MagicStatName,
} from "@/lib/api/types";
import {
  computeTotalEquiv,
  equivToDice,
  ftRate,
  stressRate,
  BOND_SACRIFICE_EQUIV,
  TRAIT_SACRIFICE_EQUIV,
  buildSacrificePayload,
  type SacrificeAmounts,
} from "../lib/sacrificeMath";

// ── Types ──────────────────────────────────────────────────────────

export type { SacrificeAmounts };
export { buildSacrificePayload };

export interface SacrificeBuilderValue {
  amounts: SacrificeAmounts;
  creativeDescription?: string;
}

interface SacrificeBuilderProps {
  character: CharacterDetailResponse;
  value: SacrificeBuilderValue;
  onChange: (value: SacrificeBuilderValue) => void;
}

// ── Stepper component ──────────────────────────────────────────────

interface StepperProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  equiv: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Optional visual warning when value is high (for stress) */
  warningFraction?: number;
}

function Stepper({
  id,
  label,
  value,
  min = 0,
  max,
  equiv,
  onIncrement,
  onDecrement,
  warningFraction,
}: StepperProps) {
  const isWarning = warningFraction !== undefined && warningFraction >= 0.6;
  const isDanger = warningFraction !== undefined && warningFraction >= 0.85;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">
          {equiv > 0 ? `${equiv} equiv` : "0 equiv"}
          {" · "}
          {max - value} remaining
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={onDecrement}
          className="
            h-8 w-8 rounded-md border border-border-default bg-bg-elevated
            text-text-primary text-lg font-bold flex items-center justify-center
            hover:bg-brand-navy-light transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          −
        </button>
        <span
          aria-live="polite"
          aria-label={`${label} amount`}
          className={`
            w-6 text-center text-base font-semibold tabular-nums
            ${isDanger ? "text-meter-stress" : isWarning ? "text-orange-400" : "text-text-primary"}
          `}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={onIncrement}
          className="
            h-8 w-8 rounded-md border border-border-default bg-bg-elevated
            text-text-primary text-lg font-bold flex items-center justify-center
            hover:bg-brand-navy-light transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Bond/Trait sacrifice toggle row ───────────────────────────────

interface SacrificeToggleProps {
  id: string;
  label: string;
  sacrificeType: "bond" | "trait";
  isSelected: boolean;
  onToggleOn: () => void;
  onToggleOff: () => void;
}

function SacrificeToggle({
  id,
  label,
  sacrificeType,
  isSelected,
  onToggleOn,
  onToggleOff,
}: SacrificeToggleProps) {
  const [pendingConfirm, setPendingConfirm] = useState(false);

  function handleClick() {
    if (isSelected) {
      onToggleOff();
    } else {
      setPendingConfirm(true);
    }
  }

  function handleConfirm() {
    onToggleOn();
    setPendingConfirm(false);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span
            className={`text-sm font-medium ${isSelected ? "text-meter-stress line-through" : "text-text-primary"}`}
          >
            {label}
          </span>
          <span className="text-xs text-text-secondary">
            {isSelected ? "10 equiv · will be permanently retired" : "10 equiv"}
          </span>
        </div>
        <button
          type="button"
          aria-label={`${isSelected ? "Remove" : "Sacrifice"} ${label}`}
          aria-pressed={isSelected}
          onClick={handleClick}
          id={id}
          className={`
            shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors min-h-[32px]
            ${isSelected
              ? "bg-meter-stress/20 text-meter-stress border border-meter-stress/40 hover:bg-meter-stress/30"
              : "bg-bg-elevated text-text-secondary border border-border-default hover:bg-brand-navy-light"
            }
          `}
        >
          {isSelected ? "Undo" : "Sacrifice"}
        </button>
      </div>

      <ConfirmModal
        open={pendingConfirm}
        onClose={() => setPendingConfirm(false)}
        title={`Sacrifice ${label}?`}
        message={`This ${sacrificeType} will be permanently retired. You will lose access to its benefits. This action cannot be undone.`}
        confirmLabel="Sacrifice"
        onConfirm={handleConfirm}
        variant="danger"
      />
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function SacrificeBuilder({ character, value, onChange }: SacrificeBuilderProps) {
  const [showCreative, setShowCreative] = useState(
    value.amounts.hasCreative
  );

  const { amounts, creativeDescription } = value;
  const magicStats = character.magic_stats ?? null;

  // Resource caps
  const maxGnosis = character.gnosis ?? 0;
  const effectiveStressMax = character.effective_stress_max ?? 9;
  const currentStress = character.stress ?? 0;
  // Stress capacity = effective_stress_max - current_stress (how much more stress can be taken)
  const availableStressCap = Math.max(0, effectiveStressMax - currentStress);
  const maxFT = character.free_time ?? 0;

  // Exchange rates
  const ftEquivRate = ftRate(magicStats);
  const stressEquivRate = stressRate();

  // Per-source equiv values
  const gnosisEquiv = amounts.gnosis;
  const stressEquiv = amounts.stress * stressEquivRate;
  const ftEquiv = amounts.freeTime * ftEquivRate;

  // Total equiv & dice
  const totalEquiv = computeTotalEquiv(amounts, magicStats);
  const sacrificeDice = equivToDice(totalEquiv);

  // Active bonds and traits (filter trauma bonds out — they're already retired)
  const activeBonds: BondDisplayResponse[] = (character.bonds?.active ?? []).filter(
    (b) => b.is_active && !b.is_trauma
  );
  const activeTraits: CharacterTraitResponse[] = (character.traits?.active ?? []).filter(
    (t) => t.is_active
  );

  // ── Stepper updaters ───────────────────────────────────────────

  function setGnosis(val: number) {
    onChange({
      ...value,
      amounts: { ...amounts, gnosis: Math.max(0, Math.min(maxGnosis, val)) },
    });
  }

  function setStress(val: number) {
    onChange({
      ...value,
      amounts: { ...amounts, stress: Math.max(0, Math.min(availableStressCap, val)) },
    });
  }

  function setFreeTime(val: number) {
    onChange({
      ...value,
      amounts: { ...amounts, freeTime: Math.max(0, Math.min(maxFT, val)) },
    });
  }

  // ── Bond/Trait toggler ─────────────────────────────────────────

  function toggleBond(id: string, add: boolean) {
    const next = add
      ? [...amounts.bondIds.filter((x) => x !== id), id]
      : amounts.bondIds.filter((x) => x !== id);
    onChange({ ...value, amounts: { ...amounts, bondIds: next } });
  }

  function toggleTrait(id: string, add: boolean) {
    const next = add
      ? [...amounts.traitIds.filter((x) => x !== id), id]
      : amounts.traitIds.filter((x) => x !== id);
    onChange({ ...value, amounts: { ...amounts, traitIds: next } });
  }

  // ── Creative sacrifice ─────────────────────────────────────────

  function handleCreativeToggle() {
    if (showCreative) {
      setShowCreative(false);
      onChange({
        ...value,
        amounts: { ...amounts, hasCreative: false },
        creativeDescription: undefined,
      });
    } else {
      setShowCreative(true);
      onChange({ ...value, amounts: { ...amounts, hasCreative: true } });
    }
  }

  // Stress warning fraction: how full the stress meter is approaching effective max
  const stressWarningFraction = amounts.stress / Math.max(availableStressCap, 1);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Sacrifices</h3>

      {/* Gnosis stepper */}
      <Stepper
        id="sacrifice-gnosis"
        label={`Gnosis (${amounts.gnosis}/${maxGnosis})`}
        value={amounts.gnosis}
        max={maxGnosis}
        equiv={gnosisEquiv}
        onIncrement={() => setGnosis(amounts.gnosis + 1)}
        onDecrement={() => setGnosis(amounts.gnosis - 1)}
      />

      <div className="border-t border-border-default/40" />

      {/* Stress stepper */}
      <Stepper
        id="sacrifice-stress"
        label={`Stress (${currentStress + amounts.stress}/${effectiveStressMax})`}
        value={amounts.stress}
        max={availableStressCap}
        equiv={stressEquiv}
        onIncrement={() => setStress(amounts.stress + 1)}
        onDecrement={() => setStress(amounts.stress - 1)}
        warningFraction={stressWarningFraction}
      />
      {amounts.stress > 0 && (
        <p className="text-xs text-meter-stress -mt-1">
          Each stress = {stressEquivRate} equiv. Taking stress brings you closer to trauma.
        </p>
      )}

      <div className="border-t border-border-default/40" />

      {/* Free Time stepper */}
      <Stepper
        id="sacrifice-ft"
        label={`Free Time (${amounts.freeTime}/${maxFT})`}
        value={amounts.freeTime}
        max={maxFT}
        equiv={ftEquiv}
        onIncrement={() => setFreeTime(amounts.freeTime + 1)}
        onDecrement={() => setFreeTime(amounts.freeTime - 1)}
      />
      <p className="text-xs text-text-secondary -mt-1">
        Rate: {ftEquivRate} equiv per FT (3 + lowest magic stat)
      </p>

      {/* Bonds section */}
      {activeBonds.length > 0 && (
        <>
          <div className="border-t border-border-default/40 mt-1" />
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mt-1">
            Bond Sacrifice
          </p>
          {activeBonds.map((bond) => (
            <SacrificeToggle
              key={bond.id}
              id={`sacrifice-bond-${bond.id}`}
              label={bond.target_name + (bond.label ? ` (${bond.label})` : "")}
              sacrificeType="bond"
              isSelected={amounts.bondIds.includes(bond.id)}
              onToggleOn={() => toggleBond(bond.id, true)}
              onToggleOff={() => toggleBond(bond.id, false)}
            />
          ))}
        </>
      )}

      {/* Traits section */}
      {activeTraits.length > 0 && (
        <>
          <div className="border-t border-border-default/40 mt-1" />
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mt-1">
            Trait Sacrifice
          </p>
          {activeTraits.map((trait) => (
            <SacrificeToggle
              key={trait.id}
              id={`sacrifice-trait-${trait.id}`}
              label={trait.name}
              sacrificeType="trait"
              isSelected={amounts.traitIds.includes(trait.id)}
              onToggleOn={() => toggleTrait(trait.id, true)}
              onToggleOff={() => toggleTrait(trait.id, false)}
            />
          ))}
        </>
      )}

      {/* Creative sacrifice */}
      <div className="border-t border-border-default/40 mt-1" />
      {!showCreative ? (
        <button
          type="button"
          onClick={handleCreativeToggle}
          className="
            flex items-center gap-1.5 text-xs text-text-secondary
            hover:text-text-primary transition-colors mt-1 w-fit
          "
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          Add creative sacrifice…
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Creative Sacrifice
            </span>
            <button
              type="button"
              onClick={handleCreativeToggle}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Remove
            </button>
          </div>
          <textarea
            rows={2}
            placeholder="Describe your creative sacrifice…"
            value={creativeDescription ?? ""}
            onChange={(e) =>
              onChange({ ...value, creativeDescription: e.target.value })
            }
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-brand-teal
              resize-y min-h-[60px]
            "
            aria-label="Creative sacrifice description"
          />
          <p className="text-xs text-text-secondary">
            The GM will assign a Gnosis value. Shows as 0 equiv until approved.
          </p>
        </div>
      )}

      {/* Running total */}
      <div
        aria-live="polite"
        aria-label="Sacrifice total"
        className="
          mt-3 rounded-md bg-bg-elevated border border-border-default
          px-4 py-3 flex items-center justify-between
        "
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">Sacrifice total</span>
          <span className="text-xs text-text-secondary">
            {[
              amounts.gnosis > 0 && `${amounts.gnosis} gnosis`,
              amounts.stress > 0 && `${amounts.stress} stress`,
              amounts.freeTime > 0 && `${amounts.freeTime} FT`,
              amounts.bondIds.length > 0 && `${amounts.bondIds.length} bond${amounts.bondIds.length !== 1 ? "s" : ""}`,
              amounts.traitIds.length > 0 && `${amounts.traitIds.length} trait${amounts.traitIds.length !== 1 ? "s" : ""}`,
              amounts.hasCreative && "creative",
            ]
              .filter(Boolean)
              .join(" + ") || "Nothing sacrificed yet"}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-secondary">{totalEquiv} equiv</div>
          <div className="text-xl font-bold tabular-nums text-brand-teal">
            {sacrificeDice}d
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Initial value helper ───────────────────────────────────────────

export function emptySacrificeValue(): SacrificeBuilderValue {
  return {
    amounts: {
      gnosis: 0,
      stress: 0,
      freeTime: 0,
      bondIds: [],
      traitIds: [],
      hasCreative: false,
    },
  };
}
