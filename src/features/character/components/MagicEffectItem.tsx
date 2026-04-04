"use client";

import { useState } from "react";
import { Zap, X } from "lucide-react";
import { ChargeDots } from "@/components/ui/ChargeDots";
import { ConfirmModal } from "@/components/ui/Modal";
import { GAME_CONSTANTS } from "@/lib/constants";
import type { MagicEffectResponse } from "@/lib/api/types";

// ── Helpers ────────────────────────────────────────────────────────

/** True when a charged effect can be used (has at least 1 charge). */
function canUseEffect(effect: MagicEffectResponse): boolean {
  if (effect.effect_type !== "charged") return false;
  return (effect.charges_current ?? 0) > 0;
}

// ── Effect Type Badge ──────────────────────────────────────────────

const EFFECT_TYPE_STYLES: Record<
  MagicEffectResponse["effect_type"],
  string
> = {
  instant: "bg-brand-blue/20 text-brand-blue",
  charged: "bg-meter-gnosis/20 text-meter-gnosis",
  permanent: "bg-meter-ft/20 text-meter-ft",
};

// ── MagicEffectItem ────────────────────────────────────────────────

interface MagicEffectItemProps {
  effect: MagicEffectResponse;
  /** Called when user clicks Use (charged effects only). */
  onUse?: (effectId: string) => void;
  /** Whether a Use mutation is in-flight for this effect. */
  isUsing?: boolean;
  /** Called when user confirms Retire. */
  onRetire?: (effectId: string) => void;
  /** Whether a Retire mutation is in-flight for this effect. */
  isRetiring?: boolean;
}

/**
 * MagicEffectItem — displays a single magic effect with type badge,
 * charges, and action buttons.
 *
 * - instant: power level + Retire button
 * - charged: ChargeDots + Use button (disabled when charges = 0) + Retire button
 * - permanent: power level + Retire button only
 *
 * Retire requires a ConfirmModal (permanent, destructive action).
 */
export function MagicEffectItem({
  effect,
  onUse,
  isUsing = false,
  onRetire,
  isRetiring = false,
}: MagicEffectItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const canUse = canUseEffect(effect);
  const isCharged = effect.effect_type === "charged";
  const hasChargeData =
    isCharged &&
    effect.charges_current !== null &&
    effect.charges_max !== null;

  return (
    <>
      <div
        className="
          flex flex-col gap-2 rounded-lg border border-border-default
          bg-bg-surface p-3 transition-colors hover:bg-bg-elevated
        "
      >
        {/* Header row: name + type badge + level + actions */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-text-primary">
                {effect.name}
              </span>
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 capitalize
                  ${EFFECT_TYPE_STYLES[effect.effect_type]}
                `}
                aria-label={`${effect.effect_type} effect`}
              >
                {effect.effect_type}
              </span>
              <span className="text-xs text-text-secondary ml-auto shrink-0">
                Lv {effect.power_level}
              </span>
            </div>
          </div>
        </div>

        {/* Charges row — charged effects only */}
        {hasChargeData && (
          <div className="flex items-center gap-2">
            <ChargeDots
              charges={effect.charges_current!}
              maxCharges={effect.charges_max!}
            />
            <span className="text-xs text-text-secondary tabular-nums">
              {effect.charges_current}/{effect.charges_max} charges
            </span>
          </div>
        )}

        {/* Action buttons — instant effects have no interactive actions */}
        {effect.effect_type !== "instant" && (
        <div className="flex items-center gap-2 mt-0.5">
          {/* Use button — charged effects only */}
          {isCharged && (
            <button
              onClick={() => onUse?.(effect.id)}
              disabled={!canUse || isUsing}
              aria-label={
                !canUse
                  ? `Cannot use ${effect.name}: no charges remaining`
                  : `Use ${effect.name} (costs 1 charge)`
              }
              title={
                !canUse ? "No charges remaining" : "Use (costs 1 charge)"
              }
              className="
                flex items-center gap-1 rounded-md px-2 py-1.5
                text-xs font-medium transition-colors min-h-[32px]
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-meter-gnosis/20 enabled:text-meter-gnosis
                enabled:hover:bg-meter-gnosis/30
              "
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              {isUsing ? "Using…" : "Use"}
            </button>
          )}

          {/* Retire button — all effect types */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isRetiring}
            aria-label={`Retire ${effect.name}`}
            title="Retire this effect permanently"
            className="
              flex items-center gap-1 rounded-md px-2 py-1.5
              text-xs font-medium transition-colors min-h-[32px]
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-transparent text-text-secondary border border-border-default
              hover:border-meter-stress/50 hover:text-meter-stress
              hover:bg-meter-stress/5
            "
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {isRetiring ? "Retiring…" : "Retire"}
          </button>
        </div>
        )}
      </div>

      {/* Retire confirmation dialog */}
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={`Retire ${effect.name}?`}
        message="This will permanently deactivate this effect. You will lose access to its abilities."
        confirmLabel="Retire Effect"
        variant="danger"
        onConfirm={() => onRetire?.(effect.id)}
      />
    </>
  );
}

// ── Magic Effects Section ──────────────────────────────────────────

interface MagicEffectsSectionProps {
  effects: MagicEffectResponse[];
  onUse?: (effectId: string) => void;
  usingId?: string | null;
  onRetire?: (effectId: string) => void;
  retiringId?: string | null;
}

/**
 * MagicEffectsSection — renders active effects with slot count header.
 *
 * Shows "Magic Effects (7/9)" and lists all active MagicEffectItems.
 */
export function MagicEffectsSection({
  effects,
  onUse,
  usingId = null,
  onRetire,
  retiringId = null,
}: MagicEffectsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-text-primary">
          Magic Effects
        </h3>
        <span className="text-xs text-text-secondary">
          ({effects.length}/{GAME_CONSTANTS.MAX_ACTIVE_EFFECTS})
        </span>
      </div>

      {effects.length === 0 ? (
        <p className="text-xs text-text-secondary italic py-2">
          No active magic effects
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {effects.map((effect) => (
            <MagicEffectItem
              key={effect.id}
              effect={effect}
              onUse={onUse}
              isUsing={usingId === effect.id}
              onRetire={onRetire}
              isRetiring={retiringId === effect.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
