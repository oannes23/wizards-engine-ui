"use client";

import { ChevronDown } from "lucide-react";
import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest } from "../types";

interface ModifyGroupFormState {
  target_id: string;
  tier: number;
  narrative: string;
}

interface ModifyGroupFormProps {
  state: ModifyGroupFormState;
  onChange: (state: ModifyGroupFormState) => void;
}

/** ModifyGroupForm — fields for modify_group GM action (tier change). */
export function ModifyGroupForm({ state, onChange }: ModifyGroupFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="group"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id })}
        label="Target Group"
        required
        id="modify-group-target"
      />

      <div>
        <label
          htmlFor="modify-group-tier"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          New Tier <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <div className="relative max-w-xs">
          <select
            id="modify-group-tier"
            value={state.tier}
            onChange={(e) => onChange({ ...state, tier: Number(e.target.value) })}
            className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {[1, 2, 3, 4, 5].map((t) => (
              <option key={t} value={t}>
                Tier {t}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="modify-group-narrative"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Narrative
        </label>
        <textarea
          id="modify-group-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Optional context..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildModifyGroupRequest(
  state: ModifyGroupFormState
): GmActionRequest | null {
  if (!state.target_id) return null;
  return {
    action_type: "modify_group",
    targets: [{ target_type: "group", target_id: state.target_id, is_primary: true }],
    changes: { tier: state.tier },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyGroupState(): ModifyGroupFormState {
  return { target_id: "", tier: 1, narrative: "" };
}
