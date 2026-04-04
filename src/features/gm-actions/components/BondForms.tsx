"use client";

import { ChevronDown } from "lucide-react";
import { EntityPicker } from "./EntityPicker";
import type { GmActionType, GmActionRequest, GameObjectType, MeterChange } from "../types";

// ── Create Bond ────────────────────────────────────────────────────

export interface CreateBondFormState {
  source_type: GameObjectType;
  source_id: string;
  target_type: GameObjectType;
  target_id: string;
  name: string;
  description: string;
  narrative: string;
}

interface CreateBondFormProps {
  state: CreateBondFormState;
  onChange: (state: CreateBondFormState) => void;
}

export function CreateBondForm({ state, onChange }: CreateBondFormProps) {
  const objectTypes: Array<{ value: GameObjectType; label: string }> = [
    { value: "character", label: "Character" },
    { value: "group", label: "Group" },
    { value: "location", label: "Location" },
  ];

  return (
    <div className="space-y-4">
      {/* Source */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bond-source-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Source Type <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <div className="relative">
            <select
              id="bond-source-type"
              value={state.source_type}
              onChange={(e) =>
                onChange({ ...state, source_type: e.target.value as GameObjectType, source_id: "" })
              }
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              {objectTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
        <EntityPicker
          entityType={state.source_type}
          value={state.source_id}
          onChange={(id) => onChange({ ...state, source_id: id })}
          label="Source"
          required
          id="bond-source-entity"
        />
      </div>

      {/* Target */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bond-target-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Target Type <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <div className="relative">
            <select
              id="bond-target-type"
              value={state.target_type}
              onChange={(e) =>
                onChange({ ...state, target_type: e.target.value as GameObjectType, target_id: "" })
              }
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              {objectTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
        <EntityPicker
          entityType={state.target_type}
          value={state.target_id}
          onChange={(id) => onChange({ ...state, target_id: id })}
          label="Target"
          required
          id="bond-target-entity"
        />
      </div>

      <div>
        <label htmlFor="bond-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Bond Name
        </label>
        <input
          id="bond-name"
          type="text"
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder="e.g. Sibling, Rival, Mentor..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="bond-description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description
        </label>
        <textarea
          id="bond-description"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          rows={2}
          placeholder="Nature of this bond..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div>
        <label htmlFor="bond-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="bond-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Context for this bond creation..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildCreateBondRequest(
  state: CreateBondFormState
): GmActionRequest | null {
  if (!state.source_id || !state.target_id) return null;
  return {
    action_type: "create_bond",
    targets: [
      { target_type: state.source_type, target_id: state.source_id, is_primary: true },
      { target_type: state.target_type, target_id: state.target_id, is_primary: false },
    ],
    changes: {
      name: state.name || undefined,
      description: state.description || undefined,
    },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultCreateBondState(): CreateBondFormState {
  return {
    source_type: "character",
    source_id: "",
    target_type: "character",
    target_id: "",
    name: "",
    description: "",
    narrative: "",
  };
}

// ── Modify Bond ────────────────────────────────────────────────────

export interface ModifyBondFormState {
  source_type: GameObjectType;
  source_id: string;
  bond_id: string;
  charges_op: "delta" | "set";
  charges_value: number;
  modify_charges: boolean;
  degradations_op: "delta" | "set";
  degradations_value: number;
  modify_degradations: boolean;
  narrative: string;
}

interface ModifyBondFormProps {
  state: ModifyBondFormState;
  onChange: (state: ModifyBondFormState) => void;
}

export function ModifyBondForm({ state, onChange }: ModifyBondFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="mb-source-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Source Type
          </label>
          <div className="relative">
            <select
              id="mb-source-type"
              value={state.source_type}
              onChange={(e) =>
                onChange({ ...state, source_type: e.target.value as GameObjectType, source_id: "", bond_id: "" })
              }
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="character">Character</option>
              <option value="group">Group</option>
              <option value="location">Location</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
        <EntityPicker
          entityType={state.source_type}
          value={state.source_id}
          onChange={(id) => onChange({ ...state, source_id: id, bond_id: "" })}
          label="Entity"
          required
          id="mb-source-entity"
        />
      </div>

      <div>
        <label htmlFor="mb-bond-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Bond ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="mb-bond-id"
          type="text"
          value={state.bond_id}
          onChange={(e) => onChange({ ...state, bond_id: e.target.value })}
          placeholder="Bond ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus font-mono"
        />
        <p className="text-xs text-text-secondary mt-1">Copy bond ID from the character sheet.</p>
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

      {/* Degradations */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.modify_degradations}
            onChange={(e) => onChange({ ...state, modify_degradations: e.target.checked })}
            className="rounded border-border-default"
          />
          Modify degradations
        </label>
        {state.modify_degradations && (
          <div className="flex items-center gap-2 ml-6">
            <div className="relative">
              <select
                value={state.degradations_op}
                onChange={(e) => onChange({ ...state, degradations_op: e.target.value as "delta" | "set" })}
                aria-label="Degradations operation"
                className="appearance-none rounded-md border border-border-default bg-bg-page pl-2 pr-6 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                <option value="delta">+/−</option>
                <option value="set">Set</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary" aria-hidden="true" />
            </div>
            <input
              type="number"
              value={state.degradations_value}
              onChange={(e) => onChange({ ...state, degradations_value: Number(e.target.value) })}
              aria-label="Degradations value"
              className="w-20 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="mb-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="mb-narrative"
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

export function buildModifyBondRequest(
  state: ModifyBondFormState
): GmActionRequest | null {
  if (!state.source_id || !state.bond_id) return null;
  const changes: Record<string, unknown> = {};
  if (state.modify_charges) {
    const ch: MeterChange = { op: state.charges_op, value: state.charges_value };
    changes.charges = ch;
  }
  if (state.modify_degradations) {
    const dg: MeterChange = { op: state.degradations_op, value: state.degradations_value };
    changes.degradations = dg;
  }
  if (Object.keys(changes).length === 0) return null;
  return {
    action_type: "modify_bond",
    targets: [
      { target_type: state.source_type, target_id: state.source_id, is_primary: true },
      { target_type: "character", target_id: state.bond_id, is_primary: false },
    ],
    changes,
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyBondState(): ModifyBondFormState {
  return {
    source_type: "character",
    source_id: "",
    bond_id: "",
    charges_op: "delta",
    charges_value: 0,
    modify_charges: false,
    degradations_op: "delta",
    degradations_value: 0,
    modify_degradations: false,
    narrative: "",
  };
}

// ── Retire Bond ────────────────────────────────────────────────────

export interface RetireBondFormState {
  source_type: GameObjectType;
  source_id: string;
  bond_id: string;
  narrative: string;
}

interface RetireBondFormProps {
  state: RetireBondFormState;
  onChange: (state: RetireBondFormState) => void;
}

export function RetireBondForm({ state, onChange }: RetireBondFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rb-source-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Source Type
          </label>
          <div className="relative">
            <select
              id="rb-source-type"
              value={state.source_type}
              onChange={(e) =>
                onChange({ ...state, source_type: e.target.value as GameObjectType, source_id: "" })
              }
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="character">Character</option>
              <option value="group">Group</option>
              <option value="location">Location</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
        <EntityPicker
          entityType={state.source_type}
          value={state.source_id}
          onChange={(id) => onChange({ ...state, source_id: id })}
          label="Entity"
          required
          id="rb-source-entity"
        />
      </div>

      <div>
        <label htmlFor="rb-bond-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Bond ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="rb-bond-id"
          type="text"
          value={state.bond_id}
          onChange={(e) => onChange({ ...state, bond_id: e.target.value })}
          placeholder="Bond ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus font-mono"
        />
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
        Retiring a bond moves it to the Past section. This cannot be undone via the UI.
      </div>

      <div>
        <label htmlFor="rb-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="rb-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Why is this bond ending?"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildRetireBondRequest(
  state: RetireBondFormState
): GmActionRequest | null {
  if (!state.source_id || !state.bond_id) return null;
  return {
    action_type: "retire_bond",
    targets: [
      { target_type: state.source_type, target_id: state.source_id, is_primary: true },
      { target_type: "character", target_id: state.bond_id, is_primary: false },
    ],
    changes: {},
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultRetireBondState(): RetireBondFormState {
  return { source_type: "character", source_id: "", bond_id: "", narrative: "" };
}

// ── Bond form discriminator ────────────────────────────────────────

export type BondActionState =
  | { action: "create_bond"; form: CreateBondFormState }
  | { action: "modify_bond"; form: ModifyBondFormState }
  | { action: "retire_bond"; form: RetireBondFormState };

export function buildBondRequest(state: BondActionState): GmActionRequest | null {
  switch (state.action) {
    case "create_bond": return buildCreateBondRequest(state.form);
    case "modify_bond": return buildModifyBondRequest(state.form);
    case "retire_bond": return buildRetireBondRequest(state.form);
  }
}

// needed for switch exhaustiveness
const _: GmActionType = "create_bond";
void _;
