"use client";

import { MeterBar } from "@/components/ui/MeterBar";
import { GAME_CONSTANTS, METER_CONFIG } from "@/lib/constants";
import type { CharacterDetailResponse } from "@/lib/api/types";
import { isAtStressCap } from "../types";

interface MeterHeaderProps {
  character: CharacterDetailResponse;
  /** Optional: whether to show as sticky header */
  sticky?: boolean;
}

/**
 * MeterHeader — sticky bar displaying all 4 character resource meters.
 *
 * Renders the character name and 4 MeterBars (Stress, Free Time, Plot, Gnosis).
 * Stress meter uses effectiveMax (9 − trauma_count) and shows warning at cap.
 * Only meaningful for full (PC) characters — renders null for simplified (NPC).
 */
export function MeterHeader({ character, sticky = true }: MeterHeaderProps) {
  // Only render for full characters
  if (
    character.detail_level === "simplified" ||
    character.stress === null ||
    character.free_time === null ||
    character.plot === null ||
    character.gnosis === null
  ) {
    return null;
  }

  const effectiveStressMax =
    character.effective_stress_max ?? GAME_CONSTANTS.STRESS_MAX;
  const atStressCap = isAtStressCap(character);

  return (
    <div
      className={`
        bg-bg-surface border-b border-border-default
        ${sticky ? "sticky top-0 z-10" : ""}
      `}
      aria-label="Character meters"
    >
      <div className="px-4 pt-3 pb-1">
        <h1 className="font-heading text-xl font-bold text-text-primary mb-3">
          {character.name}
        </h1>
        <div className="flex flex-col gap-2 pb-3">
          <MeterBar
            label={METER_CONFIG.stress.label}
            value={character.stress}
            max={GAME_CONSTANTS.STRESS_MAX}
            effectiveMax={effectiveStressMax}
            color={METER_CONFIG.stress.tailwindColor}
            showWarning={atStressCap}
          />
          <MeterBar
            label={METER_CONFIG.free_time.label}
            value={character.free_time}
            max={GAME_CONSTANTS.FREE_TIME_MAX}
            color={METER_CONFIG.free_time.tailwindColor}
          />
          <MeterBar
            label={METER_CONFIG.plot.label}
            value={character.plot}
            max={GAME_CONSTANTS.PLOT_MAX}
            color={METER_CONFIG.plot.tailwindColor}
          />
          <MeterBar
            label={METER_CONFIG.gnosis.label}
            value={character.gnosis}
            max={GAME_CONSTANTS.GNOSIS_MAX}
            color={METER_CONFIG.gnosis.tailwindColor}
          />
        </div>
      </div>
    </div>
  );
}
