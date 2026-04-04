import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Lucide icon or custom icon */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState — Placeholder for empty lists/feeds.
 * Domain-specific copy is provided by each feature.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-text-secondary/50">{icon}</div>
      )}
      <h3 className="font-heading text-lg font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
