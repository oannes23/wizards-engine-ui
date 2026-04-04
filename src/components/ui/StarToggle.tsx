"use client";

import { Star } from "lucide-react";

interface StarToggleProps {
  /** Whether the entity is currently starred */
  isStarred: boolean;
  /** Toggle callback */
  onToggle: () => void;
}

/**
 * StarToggle — Star/unstar toggle for bookmarking entities.
 */
export function StarToggle({ isStarred, onToggle }: StarToggleProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="
        p-1 rounded-md transition-colors
        hover:bg-bg-elevated
        min-w-[44px] min-h-[44px] flex items-center justify-center
      "
      aria-label={isStarred ? "Remove from starred" : "Add to starred"}
      aria-pressed={isStarred}
    >
      <Star
        className={`h-5 w-5 transition-colors ${
          isStarred
            ? "fill-meter-plot text-meter-plot"
            : "text-text-secondary hover:text-meter-plot"
        }`}
      />
    </button>
  );
}
