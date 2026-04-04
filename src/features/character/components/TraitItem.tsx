"use client";

import { RefreshCw } from "lucide-react";
import { ChargeDots } from "@/components/ui/ChargeDots";
import { GAME_CONSTANTS } from "@/lib/constants";
import { canRechargeTrait } from "../types";
import type { CharacterTraitResponse } from "@/lib/api/types";

interface TraitItemProps {
  trait: CharacterTraitResponse;
  /** Current free time — used to determine if Recharge is available */
  freeTime: number;
  /** Called when user clicks Recharge */
  onRecharge?: (traitId: string) => void;
  /** Whether a recharge mutation is in-flight */
  isRecharging?: boolean;
}

/**
 * TraitItem — displays a single trait with charge dots and recharge button.
 *
 * Shows trait name, description, ChargeDots (0–5 charges), and a Recharge
 * button that is disabled when FT < 1 or charges are already at 5.
 */
export function TraitItem({
  trait,
  freeTime,
  onRecharge,
  isRecharging = false,
}: TraitItemProps) {
  const canRecharge = canRechargeTrait(trait, freeTime);
  const slotLabel =
    trait.slot_type === "core_trait" ? "Core" : "Role";

  return (
    <div
      className="
        flex flex-col gap-2 rounded-lg border border-border-default
        bg-bg-surface p-3 transition-colors hover:bg-bg-elevated
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-text-primary text-sm">
              {trait.name}
            </span>
            <span
              className="
                text-xs px-1.5 py-0.5 rounded-full font-medium
                bg-brand-navy-light text-text-secondary shrink-0
              "
              aria-label={`${slotLabel} trait`}
            >
              {slotLabel}
            </span>
          </div>
          {trait.description && (
            <p className="text-text-secondary text-xs mt-1 leading-relaxed">
              {trait.description}
            </p>
          )}
        </div>

        <button
          onClick={() => onRecharge?.(trait.id)}
          disabled={!canRecharge || isRecharging}
          aria-label={
            !canRecharge
              ? `Cannot recharge ${trait.name}: ${freeTime < 1 ? "no free time" : "charges are full"}`
              : `Recharge ${trait.name} (costs 1 Free Time)`
          }
          title={
            !canRecharge
              ? freeTime < 1
                ? "Not enough Free Time"
                : "Charges are already full"
              : "Recharge (1 FT)"
          }
          className="
            shrink-0 flex items-center gap-1 rounded-md px-2 py-1.5
            text-xs font-medium transition-colors min-h-[36px]
            disabled:opacity-40 disabled:cursor-not-allowed
            enabled:bg-brand-navy-light enabled:text-text-secondary
            enabled:hover:bg-brand-blue enabled:hover:text-white
          "
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRecharging ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Recharge</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <ChargeDots
          charges={trait.charge}
          maxCharges={GAME_CONSTANTS.CHARGE_MAX}
        />
        <span className="text-xs text-text-secondary tabular-nums">
          {trait.charge}/{GAME_CONSTANTS.CHARGE_MAX}
        </span>
      </div>
    </div>
  );
}

// ── Grouped Traits Section ─────────────────────────────────────────

interface TraitsSectionProps {
  title: string;
  traits: CharacterTraitResponse[];
  slotLimit: number;
  freeTime: number;
  onRecharge?: (traitId: string) => void;
  rechargingId?: string | null;
}

/**
 * TraitsSection — renders a labeled group of traits with slot count.
 *
 * Shown as "Core Traits (1/2)" with a list of TraitItems below.
 */
export function TraitsSection({
  title,
  traits,
  slotLimit,
  freeTime,
  onRecharge,
  rechargingId = null,
}: TraitsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-secondary">
          ({traits.length}/{slotLimit})
        </span>
      </div>

      {traits.length === 0 ? (
        <p className="text-xs text-text-secondary italic py-2">
          No {title.toLowerCase()} yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {traits.map((trait) => (
            <TraitItem
              key={trait.id}
              trait={trait}
              freeTime={freeTime}
              onRecharge={onRecharge}
              isRecharging={rechargingId === trait.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
