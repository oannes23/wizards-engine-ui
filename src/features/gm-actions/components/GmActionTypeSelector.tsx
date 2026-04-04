"use client";

import { ChevronDown } from "lucide-react";
import { GM_ACTION_GROUPS, GM_ACTION_LABELS } from "../types";
import type { GmActionType } from "../types";

interface GmActionTypeSelectorProps {
  value: GmActionType | "";
  onChange: (type: GmActionType) => void;
}

/**
 * GmActionTypeSelector — grouped dropdown for the 14 GM action types.
 *
 * Groups: Modify (4), Bond (3), Trait (3), Effect (3), XP (1)
 */
export function GmActionTypeSelector({
  value,
  onChange,
}: GmActionTypeSelectorProps) {
  return (
    <div>
      <label
        htmlFor="gm-action-type"
        className="block text-sm font-medium text-text-primary mb-1.5"
      >
        Action Type <span className="text-meter-stress" aria-label="required">*</span>
      </label>
      <div className="relative">
        <select
          id="gm-action-type"
          value={value}
          onChange={(e) => onChange(e.target.value as GmActionType)}
          className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          aria-label="Select GM action type"
        >
          <option value="">Select action type...</option>
          {GM_ACTION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.actions.map((action) => (
                <option key={action} value={action}>
                  {GM_ACTION_LABELS[action]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
