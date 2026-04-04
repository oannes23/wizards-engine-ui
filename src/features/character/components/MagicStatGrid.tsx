"use client";

import { GAME_CONSTANTS } from "@/lib/constants";
import {
  MAGIC_STAT_DISPLAY_ORDER,
  MAGIC_STAT_LABELS,
} from "../types";
import type { MagicStatName } from "@/lib/api/types";

interface MagicStatGridProps {
  magicStats: Record<MagicStatName, { level: number; xp: number }>;
}

/**
 * MagicStatGrid — 5 magic stats with level badge and XP progress bar.
 *
 * Pattern: "Being Lv 3 [====─] 4/5 XP"
 * Level is prominent; XP bar is secondary.
 */
export function MagicStatGrid({ magicStats }: MagicStatGridProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Magic</h3>
      <div className="flex flex-col gap-2">
        {MAGIC_STAT_DISPLAY_ORDER.map((statName) => {
          const stat = magicStats[statName] ?? { level: 0, xp: 0 };

          return (
            <div
              key={statName}
              className="flex items-center gap-2"
              aria-label={`${MAGIC_STAT_LABELS[statName]}: level ${stat.level}, ${stat.xp} XP`}
            >
              {/* Stat name */}
              <span className="text-xs text-text-secondary w-20 shrink-0 capitalize">
                {MAGIC_STAT_LABELS[statName]}
              </span>

              {/* Level badge */}
              <span
                className="
                  text-xs font-bold tabular-nums text-brand-teal
                  bg-brand-teal/10 rounded px-1.5 py-0.5 shrink-0
                "
                aria-hidden="true"
              >
                Lv {stat.level}
              </span>

              {/* XP bar — 5 segments */}
              <div
                className="flex gap-0.5 flex-1"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={GAME_CONSTANTS.MAGIC_STAT_XP_PER_LEVEL}
                aria-valuenow={stat.xp}
                aria-label={`${stat.xp} of ${GAME_CONSTANTS.MAGIC_STAT_XP_PER_LEVEL} XP`}
              >
                {Array.from(
                  { length: GAME_CONSTANTS.MAGIC_STAT_XP_PER_LEVEL },
                  (_, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className={`
                        h-1.5 flex-1 rounded-sm transition-colors duration-300
                        ${i < stat.xp
                          ? "bg-brand-teal-muted"
                          : "bg-bg-elevated"
                        }
                      `}
                    />
                  )
                )}
              </div>

              {/* XP numeric */}
              <span className="text-xs text-text-secondary tabular-nums shrink-0 w-8 text-right">
                {stat.xp}/{GAME_CONSTANTS.MAGIC_STAT_XP_PER_LEVEL}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
