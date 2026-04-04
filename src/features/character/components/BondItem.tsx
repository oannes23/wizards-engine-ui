"use client";

import { RefreshCw, AlertTriangle } from "lucide-react";
import { ChargeDots } from "@/components/ui/ChargeDots";
import { EntityLink } from "@/components/ui/EntityLink";
import { GAME_CONSTANTS } from "@/lib/constants";
import { effectiveBondMax, canMaintainBond } from "../types";
import type { BondDisplayResponse } from "@/lib/api/types";

interface BondItemProps {
  bond: BondDisplayResponse;
  /** Current free time — determines if Maintain is available */
  freeTime: number;
  /** Called when user clicks Maintain Bond */
  onMaintain?: (bondId: string) => void;
  /** Whether a maintain mutation is in-flight */
  isMaintaining?: boolean;
}

/**
 * BondItem — displays a single bond with charges, degradation, and maintain button.
 *
 * PC bonds (slot_type === "pc_bond") show:
 * - EntityLink to the bond target
 * - Perspective-normalized label
 * - ChargeDots with degradation
 * - Trauma indicator (red border + badge, no Maintain button)
 * - Maintain button when charges < effective max
 */
export function BondItem({
  bond,
  freeTime,
  onMaintain,
  isMaintaining = false,
}: BondItemProps) {
  const effectiveMax = effectiveBondMax(bond);
  const canMaintain = canMaintainBond(bond, freeTime);
  const isTrauma = bond.is_trauma === true;
  const charges = bond.charges ?? 0;
  const degradations = bond.degradations ?? 0;

  return (
    <div
      className={`
        flex flex-col gap-2 rounded-lg border p-3 transition-colors
        ${isTrauma
          ? "border-meter-stress/60 bg-meter-stress/5 hover:bg-meter-stress/10"
          : "border-border-default bg-bg-surface hover:bg-bg-elevated"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <EntityLink
              type={bond.target_type}
              id={bond.target_id}
              name={bond.target_name}
            />
            {isTrauma && (
              <span
                className="
                  inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium
                  bg-meter-stress/20 text-meter-stress shrink-0
                "
                aria-label="Trauma bond"
              >
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Trauma
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{bond.label}</p>
          {bond.description && (
            <p className="text-text-secondary text-xs mt-1 leading-relaxed">
              {bond.description}
            </p>
          )}
        </div>

        {!isTrauma && (
          <button
            onClick={() => onMaintain?.(bond.id)}
            disabled={!canMaintain || isMaintaining}
            aria-label={
              !canMaintain
                ? `Cannot maintain bond with ${bond.target_name}: ${freeTime < 1 ? "no free time" : "charges are at max"}`
                : `Maintain bond with ${bond.target_name} (costs 1 Free Time)`
            }
            title={
              !canMaintain
                ? freeTime < 1
                  ? "Not enough Free Time"
                  : "Charges are at max"
                : "Maintain (1 FT)"
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
              className={`h-3.5 w-3.5 ${isMaintaining ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Maintain</span>
          </button>
        )}
      </div>

      {/* Charges section — PC bonds only */}
      {bond.slot_type === "pc_bond" && (
        <div className="flex items-center gap-2">
          <ChargeDots
            charges={charges}
            maxCharges={GAME_CONSTANTS.CHARGE_MAX}
            degradations={degradations}
          />
          <span className="text-xs text-text-secondary tabular-nums">
            {charges}/{effectiveMax}
          </span>
          {degradations > 0 && (
            <span className="text-xs text-meter-stress/80">
              ({degradations} degraded)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bonds Section ─────────────────────────────────────────────────

interface BondsSectionProps {
  bonds: BondDisplayResponse[];
  slotLimit: number;
  freeTime: number;
  onMaintain?: (bondId: string) => void;
  maintainingId?: string | null;
}

/**
 * BondsSection — renders bond list with slot count header.
 *
 * Shows "Bonds (5/8)" and lists all active bonds.
 */
export function BondsSection({
  bonds,
  slotLimit,
  freeTime,
  onMaintain,
  maintainingId = null,
}: BondsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Bonds</h3>
        <span className="text-xs text-text-secondary">
          ({bonds.length}/{slotLimit})
        </span>
      </div>

      {bonds.length === 0 ? (
        <p className="text-xs text-text-secondary italic py-2">
          No active bonds yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {bonds.map((bond) => (
            <BondItem
              key={bond.id}
              bond={bond}
              freeTime={freeTime}
              onMaintain={onMaintain}
              isMaintaining={maintainingId === bond.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
