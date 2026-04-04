"use client";

import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest } from "../types";

interface ModifyLocationFormState {
  target_id: string;
  new_parent_id: string;
  narrative: string;
}

interface ModifyLocationFormProps {
  state: ModifyLocationFormState;
  onChange: (state: ModifyLocationFormState) => void;
}

/** ModifyLocationForm — fields for modify_location GM action (parent change). */
export function ModifyLocationForm({
  state,
  onChange,
}: ModifyLocationFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="location"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id })}
        label="Target Location"
        required
        id="modify-loc-target"
      />

      <EntityPicker
        entityType="location"
        value={state.new_parent_id}
        onChange={(id) => onChange({ ...state, new_parent_id: id })}
        label="New Parent Location"
        placeholder="None (top-level)"
        id="modify-loc-parent"
      />

      <div>
        <label
          htmlFor="modify-loc-narrative"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Narrative
        </label>
        <textarea
          id="modify-loc-narrative"
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

export function buildModifyLocationRequest(
  state: ModifyLocationFormState
): GmActionRequest | null {
  if (!state.target_id) return null;
  return {
    action_type: "modify_location",
    targets: [{ target_type: "location", target_id: state.target_id, is_primary: true }],
    changes: { parent_id: state.new_parent_id || null },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyLocationState(): ModifyLocationFormState {
  return { target_id: "", new_parent_id: "", narrative: "" };
}
