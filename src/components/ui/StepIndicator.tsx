"use client";

/**
 * StepIndicator — Multi-step progress circles.
 * Used in the proposal wizard.
 *
 * Accessibility: aria-current="step" on the active step.
 */

interface StepIndicatorProps {
  /** Step labels */
  steps: string[];
  /** Zero-based index of the current step */
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="flex items-center justify-center gap-2">
      {steps.map((label, index) => {
        const state =
          index < currentStep
            ? "completed"
            : index === currentStep
              ? "current"
              : "upcoming";

        return (
          <div
            key={index}
            className="flex items-center gap-2"
          >
            {index > 0 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  index <= currentStep ? "bg-brand-teal" : "bg-border-default"
                }`}
              />
            )}
            <div
              className="flex items-center gap-1.5"
              aria-current={state === "current" ? "step" : undefined}
            >
              <div
                className={`
                  flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                  transition-colors duration-200
                  ${state === "completed"
                    ? "bg-brand-teal text-bg-page"
                    : state === "current"
                      ? "bg-brand-teal text-bg-page ring-2 ring-brand-teal/30"
                      : "bg-bg-elevated text-text-secondary"
                  }
                `}
              >
                {state === "completed" ? "✓" : index + 1}
              </div>
              <span
                className={`
                  text-xs font-medium hidden sm:inline
                  ${state === "current"
                    ? "text-brand-teal"
                    : state === "completed"
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }
                `}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
