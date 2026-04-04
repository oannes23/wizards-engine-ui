"use client";

import { Check } from "lucide-react";

/**
 * ClockBar — Linear segmented progress bar.
 *
 * Renders N segments with M filled. Completed clock gets
 * a distinct treatment (all filled + checkmark).
 *
 * Accessibility: role="progressbar", aria-valuenow, aria-valuemax, aria-label
 */

interface ClockBarProps {
  /** Clock name for aria-label */
  name?: string;
  /** Total number of segments */
  segments: number;
  /** Number of filled segments */
  progress: number;
  /** Whether the clock is completed */
  isCompleted?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-3",
  md: "h-5",
  lg: "h-7",
} as const;

export function ClockBar({
  name,
  segments,
  progress,
  isCompleted = false,
  size = "md",
}: ClockBarProps) {
  const label = name
    ? `Clock: ${name}. Progress: ${progress} of ${segments}`
    : `Clock progress: ${progress} of ${segments}`;

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={segments}
        aria-label={label}
        className="flex gap-0.5 flex-1"
      >
        {Array.from({ length: segments }, (_, i) => {
          const isFilled = i < progress;
          return (
            <div
              key={i}
              className={`
                ${SIZE_CLASSES[size]} flex-1 rounded-sm transition-colors duration-300
                ${isFilled
                  ? isCompleted
                    ? "bg-meter-ft"
                    : "bg-brand-teal"
                  : "bg-bg-elevated"
                }
              `}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs font-bold tabular-nums text-text-primary">
          {progress}/{segments}
        </span>
        {isCompleted && (
          <Check className="h-4 w-4 text-meter-ft" aria-label="Completed" />
        )}
      </div>
    </div>
  );
}
