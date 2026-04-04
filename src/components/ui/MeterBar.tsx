"use client";

/**
 * MeterBar — Segmented horizontal bar with filled/empty/unavailable segments.
 *
 * Three segment states:
 * - Filled: within current value (colored)
 * - Empty: between current value and effective max (muted)
 * - Unavailable: between effective max and absolute max (darker/hatched)
 *
 * Accessibility: role="meter", aria-valuenow, aria-valuemin, aria-valuemax, aria-label
 */

interface MeterBarProps {
  /** Display label (e.g., "Stress") */
  label: string;
  /** Current value */
  value: number;
  /** Absolute maximum */
  max: number;
  /** Effective maximum (e.g., stress max reduced by trauma). Defaults to max. */
  effectiveMax?: number;
  /** Tailwind color class name for filled segments (e.g., "meter-stress") */
  color: string;
  /** Optional: show pulsing warning when value is near effective max */
  showWarning?: boolean;
}

export function MeterBar({
  label,
  value,
  max,
  effectiveMax,
  color,
  showWarning = false,
}: MeterBarProps) {
  const resolvedEffectiveMax = effectiveMax ?? max;
  const nearMax = showWarning && value >= resolvedEffectiveMax - 1 && value > 0;

  return (
    <div
      className="flex items-center gap-2"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={resolvedEffectiveMax}
      aria-label={`${label}: ${value} of ${resolvedEffectiveMax}`}
    >
      <span className="text-xs font-medium text-text-secondary w-16 shrink-0">
        {label}
      </span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: max }, (_, i) => {
          const segmentIndex = i + 1;
          let state: "filled" | "empty" | "unavailable";

          if (segmentIndex <= value) {
            state = "filled";
          } else if (segmentIndex <= resolvedEffectiveMax) {
            state = "empty";
          } else {
            state = "unavailable";
          }

          return (
            <div
              key={i}
              className={`
                h-4 flex-1 rounded-sm transition-colors duration-300
                ${state === "filled"
                  ? `bg-${color} ${nearMax ? "animate-pulse" : ""}`
                  : state === "empty"
                    ? "bg-bg-elevated"
                    : "bg-bg-muted opacity-40"
                }
              `}
            />
          );
        })}
      </div>
      <span className="text-xs font-bold tabular-nums text-text-primary w-10 text-right shrink-0">
        {value}/{resolvedEffectiveMax}
      </span>
    </div>
  );
}
