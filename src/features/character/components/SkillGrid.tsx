"use client";

import { GAME_CONSTANTS } from "@/lib/constants";
import {
  SKILL_DISPLAY_ORDER,
  SKILL_LABELS,
} from "../types";
import type { SkillName } from "@/lib/api/types";

interface SkillGridProps {
  skills: Record<SkillName, number>;
}

/**
 * SkillGrid — 8 skills in a compact 2x4 grid with level dot indicators.
 *
 * Each cell: skill name + dots (filled/empty) up to SKILL_MAX (3).
 * Pattern: "Awareness ●●○"
 */
export function SkillGrid({ skills }: SkillGridProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Skills</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {SKILL_DISPLAY_ORDER.map((skillName) => {
          const level = skills[skillName] ?? 0;
          return (
            <div
              key={skillName}
              className="flex items-center justify-between gap-2"
              aria-label={`${SKILL_LABELS[skillName]}: level ${level}`}
            >
              <span className="text-xs text-text-secondary capitalize">
                {SKILL_LABELS[skillName]}
              </span>
              <div
                className="flex gap-0.5"
                role="group"
                aria-label={`${level} of ${GAME_CONSTANTS.SKILL_MAX}`}
              >
                {Array.from({ length: GAME_CONSTANTS.SKILL_MAX }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className={`
                      h-2.5 w-2.5 rounded-full transition-colors duration-150
                      ${i < level
                        ? "bg-brand-teal"
                        : "border border-brand-teal/30 bg-transparent"
                      }
                    `}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
