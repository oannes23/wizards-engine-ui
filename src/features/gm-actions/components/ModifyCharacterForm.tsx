"use client";

import { ChevronDown } from "lucide-react";
import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest, MeterChange } from "../types";

interface MeterFieldProps {
  label: string;
  meterKey: string;
  change: MeterChange | undefined;
  onChangeOp: (key: string, op: "delta" | "set") => void;
  onChangeValue: (key: string, value: number) => void;
}

function MeterField({
  label,
  meterKey,
  change,
  onChangeOp,
  onChangeValue,
}: MeterFieldProps) {
  const op = change?.op ?? "delta";
  const value = change?.value ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary w-20 shrink-0">{label}</span>
      <div className="relative shrink-0">
        <select
          value={op}
          onChange={(e) => onChangeOp(meterKey, e.target.value as "delta" | "set")}
          aria-label={`${label} operation`}
          className="appearance-none rounded-md border border-border-default bg-bg-page pl-2 pr-6 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        >
          <option value="delta">+/−</option>
          <option value="set">Set</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary"
          aria-hidden="true"
        />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChangeValue(meterKey, Number(e.target.value))}
        aria-label={`${label} value`}
        className="w-20 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
      />
    </div>
  );
}

interface ModifyCharacterFormState {
  target_id: string;
  meters: Partial<Record<"stress" | "free_time" | "plot" | "gnosis", MeterChange>>;
  narrative: string;
  visibility: string;
}

interface ModifyCharacterFormProps {
  state: ModifyCharacterFormState;
  onChange: (state: ModifyCharacterFormState) => void;
}

/**
 * ModifyCharacterForm — fields for modify_character GM action.
 *
 * Allows delta/set operations on all four character meters.
 */
export function ModifyCharacterForm({
  state,
  onChange,
}: ModifyCharacterFormProps) {
  type MeterKey = "stress" | "free_time" | "plot" | "gnosis";

  function setMeterOp(key: string, op: "delta" | "set") {
    const mKey = key as MeterKey;
    onChange({
      ...state,
      meters: {
        ...state.meters,
        [mKey]: { op, value: state.meters[mKey]?.value ?? 0 },
      },
    });
  }

  function setMeterValue(key: string, value: number) {
    const mKey = key as MeterKey;
    onChange({
      ...state,
      meters: {
        ...state.meters,
        [mKey]: { op: state.meters[mKey]?.op ?? "delta", value },
      },
    });
  }

  const meters: Array<{ label: string; key: MeterKey }> = [
    { label: "Stress", key: "stress" },
    { label: "Free Time", key: "free_time" },
    { label: "Plot", key: "plot" },
    { label: "Gnosis", key: "gnosis" },
  ];

  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="character"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id })}
        label="Target Character"
        required
        id="modify-char-target"
      />

      <fieldset>
        <legend className="text-sm font-medium text-text-primary mb-2">
          Meter Changes
        </legend>
        <div className="space-y-2">
          {meters.map(({ label, key }) => (
            <MeterField
              key={key}
              label={label}
              meterKey={key}
              change={state.meters[key]}
              onChangeOp={setMeterOp}
              onChangeValue={setMeterValue}
            />
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="modify-char-narrative"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Narrative
        </label>
        <textarea
          id="modify-char-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Optional context for this change..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

/**
 * Build a GmActionRequest from ModifyCharacterForm state.
 */
export function buildModifyCharacterRequest(
  state: ModifyCharacterFormState
): GmActionRequest | null {
  if (!state.target_id) return null;

  const changes: Record<string, MeterChange> = {};
  for (const [key, change] of Object.entries(state.meters)) {
    if (change && (change.op === "set" || change.value !== 0)) {
      changes[key] = change;
    }
  }

  if (Object.keys(changes).length === 0) return null;

  return {
    action_type: "modify_character",
    targets: [{ target_type: "character", target_id: state.target_id, is_primary: true }],
    changes,
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyCharacterState(): ModifyCharacterFormState {
  return {
    target_id: "",
    meters: {},
    narrative: "",
    visibility: "bonded",
  };
}
