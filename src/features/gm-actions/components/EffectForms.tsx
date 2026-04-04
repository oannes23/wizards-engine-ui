"use client";

import { ChevronDown } from "lucide-react";
import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest, MagicEffectType, MeterChange } from "../types";

// ── Create Effect ──────────────────────────────────────────────────

export interface CreateEffectFormState {
  target_id: string;
  name: string;
  effect_type: MagicEffectType;
  power_level: number;
  charges_current: number;
  charges_max: number;
  description: string;
  narrative: string;
}

interface CreateEffectFormProps {
  state: CreateEffectFormState;
  onChange: (state: CreateEffectFormState) => void;
}

export function CreateEffectForm({ state, onChange }: CreateEffectFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="character"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id })}
        label="Target Character"
        required
        id="ce-target"
      />

      <div>
        <label htmlFor="ce-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Effect Name <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="ce-name"
          type="text"
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder="Effect name"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ce-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Type <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <div className="relative">
            <select
              id="ce-type"
              value={state.effect_type}
              onChange={(e) => onChange({ ...state, effect_type: e.target.value as MagicEffectType })}
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="instant">Instant</option>
              <option value="charged">Charged</option>
              <option value="permanent">Permanent</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label htmlFor="ce-power" className="block text-sm font-medium text-text-primary mb-1.5">
            Power Level (1–5)
          </label>
          <input
            id="ce-power"
            type="number"
            min={1}
            max={5}
            value={state.power_level}
            onChange={(e) => onChange({ ...state, power_level: Number(e.target.value) })}
            className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </div>
      </div>

      {/* Charges (only for 'charged' type) */}
      {state.effect_type === "charged" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ce-charges-current" className="block text-sm font-medium text-text-primary mb-1.5">
              Charges (Current)
            </label>
            <input
              id="ce-charges-current"
              type="number"
              min={0}
              value={state.charges_current}
              onChange={(e) => onChange({ ...state, charges_current: Number(e.target.value) })}
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
          <div>
            <label htmlFor="ce-charges-max" className="block text-sm font-medium text-text-primary mb-1.5">
              Charges (Max)
            </label>
            <input
              id="ce-charges-max"
              type="number"
              min={1}
              value={state.charges_max}
              onChange={(e) => onChange({ ...state, charges_max: Number(e.target.value) })}
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="ce-description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description
        </label>
        <textarea
          id="ce-description"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          rows={2}
          placeholder="Effect description..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div>
        <label htmlFor="ce-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="ce-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Context..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildCreateEffectRequest(
  state: CreateEffectFormState
): GmActionRequest | null {
  if (!state.target_id || !state.name) return null;
  const changes: Record<string, unknown> = {
    name: state.name,
    effect_type: state.effect_type,
    power_level: state.power_level,
    description: state.description || undefined,
  };
  if (state.effect_type === "charged") {
    changes.charges_current = state.charges_current;
    changes.charges_max = state.charges_max;
  }
  return {
    action_type: "create_effect",
    targets: [{ target_type: "character", target_id: state.target_id, is_primary: true }],
    changes,
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultCreateEffectState(): CreateEffectFormState {
  return {
    target_id: "",
    name: "",
    effect_type: "permanent",
    power_level: 1,
    charges_current: 3,
    charges_max: 3,
    description: "",
    narrative: "",
  };
}

// ── Modify Effect ──────────────────────────────────────────────────

export interface ModifyEffectFormState {
  target_id: string;
  effect_id: string;
  charges_op: "delta" | "set";
  charges_value: number;
  modify_charges: boolean;
  power_level: number;
  modify_power: boolean;
  narrative: string;
}

interface ModifyEffectFormProps {
  state: ModifyEffectFormState;
  onChange: (state: ModifyEffectFormState) => void;
}

export function ModifyEffectForm({ state, onChange }: ModifyEffectFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="character"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id, effect_id: "" })}
        label="Target Character"
        required
        id="me-target"
      />

      <div>
        <label htmlFor="me-effect-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Effect ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="me-effect-id"
          type="text"
          value={state.effect_id}
          onChange={(e) => onChange({ ...state, effect_id: e.target.value })}
          placeholder="Effect ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      {/* Charges */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.modify_charges}
            onChange={(e) => onChange({ ...state, modify_charges: e.target.checked })}
            className="rounded border-border-default"
          />
          Modify charges
        </label>
        {state.modify_charges && (
          <div className="flex items-center gap-2 ml-6">
            <div className="relative">
              <select
                value={state.charges_op}
                onChange={(e) => onChange({ ...state, charges_op: e.target.value as "delta" | "set" })}
                aria-label="Charges operation"
                className="appearance-none rounded-md border border-border-default bg-bg-page pl-2 pr-6 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                <option value="delta">+/−</option>
                <option value="set">Set</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary" aria-hidden="true" />
            </div>
            <input
              type="number"
              value={state.charges_value}
              onChange={(e) => onChange({ ...state, charges_value: Number(e.target.value) })}
              aria-label="Charges value"
              className="w-20 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
        )}
      </div>

      {/* Power level */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.modify_power}
            onChange={(e) => onChange({ ...state, modify_power: e.target.checked })}
            className="rounded border-border-default"
          />
          Modify power level
        </label>
        {state.modify_power && (
          <input
            type="number"
            min={1}
            max={5}
            value={state.power_level}
            onChange={(e) => onChange({ ...state, power_level: Number(e.target.value) })}
            aria-label="Power level"
            className="ml-6 w-20 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        )}
      </div>

      <div>
        <label htmlFor="me-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="me-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Context..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildModifyEffectRequest(
  state: ModifyEffectFormState
): GmActionRequest | null {
  if (!state.target_id || !state.effect_id) return null;
  const changes: Record<string, unknown> = { effect_id: state.effect_id };
  if (state.modify_charges) {
    const ch: MeterChange = { op: state.charges_op, value: state.charges_value };
    changes.charges_current = ch;
  }
  if (state.modify_power) {
    changes.power_level = state.power_level;
  }
  if (Object.keys(changes).length <= 1) return null;  // only effect_id = no real change
  return {
    action_type: "modify_effect",
    targets: [{ target_type: "character", target_id: state.target_id, is_primary: true }],
    changes,
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyEffectState(): ModifyEffectFormState {
  return {
    target_id: "",
    effect_id: "",
    charges_op: "delta",
    charges_value: 0,
    modify_charges: false,
    power_level: 1,
    modify_power: false,
    narrative: "",
  };
}

// ── Retire Effect ──────────────────────────────────────────────────

export interface RetireEffectFormState {
  target_id: string;
  effect_id: string;
  narrative: string;
}

interface RetireEffectFormProps {
  state: RetireEffectFormState;
  onChange: (state: RetireEffectFormState) => void;
}

export function RetireEffectForm({ state, onChange }: RetireEffectFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="character"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id, effect_id: "" })}
        label="Target Character"
        required
        id="re-target"
      />

      <div>
        <label htmlFor="re-effect-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Effect ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="re-effect-id"
          type="text"
          value={state.effect_id}
          onChange={(e) => onChange({ ...state, effect_id: e.target.value })}
          placeholder="Effect ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="re-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="re-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Why is this effect ending?"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildRetireEffectRequest(
  state: RetireEffectFormState
): GmActionRequest | null {
  if (!state.target_id || !state.effect_id) return null;
  return {
    action_type: "retire_effect",
    targets: [{ target_type: "character", target_id: state.target_id, is_primary: true }],
    changes: { effect_id: state.effect_id },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultRetireEffectState(): RetireEffectFormState {
  return { target_id: "", effect_id: "", narrative: "" };
}
