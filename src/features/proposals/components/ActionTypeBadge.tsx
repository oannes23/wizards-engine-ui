import { ACTION_CATEGORIES, ACTION_CATEGORY_COLORS } from "../types";
import { ACTION_TYPE_LABELS } from "@/lib/constants";
import type { ActionType } from "@/lib/api/types";

interface ActionTypeBadgeProps {
  actionType: ActionType;
  className?: string;
}

/**
 * ActionTypeBadge — colored pill showing the human-readable action type.
 *
 * Color is derived from the action's category:
 *   - Session actions → blue
 *   - Downtime actions → emerald
 *   - System proposals → red
 */
export function ActionTypeBadge({ actionType, className = "" }: ActionTypeBadgeProps) {
  const category = ACTION_CATEGORIES[actionType] ?? "session";
  const colorClasses = ACTION_CATEGORY_COLORS[category];
  const label = ACTION_TYPE_LABELS[actionType] ?? actionType;

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-medium whitespace-nowrap
        ${colorClasses} ${className}
      `}
      aria-label={`Action type: ${label}`}
    >
      {label}
    </span>
  );
}
