"use client";

/**
 * ChargeDots — Row of filled/empty/degraded dots.
 *
 * Three states:
 * - Filled: charges remaining (bright)
 * - Empty: spent charges (outline only)
 * - Degraded: permanently lost charges (dimmed/crossed)
 *
 * Accessibility: role="group", aria-label on container
 */

interface ChargeDotsProps {
  /** Current remaining charges */
  charges: number;
  /** Maximum possible charges (usually 5) */
  maxCharges: number;
  /** Number of permanently degraded charge slots (0 by default) */
  degradations?: number;
}

export function ChargeDots({
  charges,
  maxCharges,
  degradations = 0,
}: ChargeDotsProps) {
  const effectiveMax = maxCharges - degradations;

  return (
    <div
      role="group"
      aria-label={`Charges: ${charges} of ${effectiveMax}`}
      className="flex items-center gap-1"
    >
      {Array.from({ length: maxCharges }, (_, i) => {
        const position = i + 1;
        let state: "filled" | "empty" | "degraded";

        if (position > maxCharges - degradations) {
          state = "degraded";
        } else if (position <= charges) {
          state = "filled";
        } else {
          state = "empty";
        }

        return (
          <div
            key={i}
            aria-hidden="true"
            className={`
              h-3 w-3 rounded-full transition-colors duration-150
              ${state === "filled"
                ? "bg-brand-teal"
                : state === "empty"
                  ? "border-2 border-brand-teal/40 bg-transparent"
                  : "border-2 border-text-secondary/20 bg-text-secondary/10 line-through"
              }
            `}
          />
        );
      })}
    </div>
  );
}
