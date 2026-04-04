"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { listTraitTemplates } from "@/lib/api/services/traitTemplates";
import { queryKeys } from "@/lib/hooks/query-keys";
import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest, GameObjectType, SlotType, MeterChange } from "../types";

// ── Create Trait ───────────────────────────────────────────────────

export interface CreateTraitFormState {
  target_type: GameObjectType;
  target_id: string;
  slot_type: SlotType;
  template_id: string;
  name: string;
  description: string;
  charges: number;
  narrative: string;
}

interface CreateTraitFormProps {
  state: CreateTraitFormState;
  onChange: (state: CreateTraitFormState) => void;
}

export function CreateTraitForm({ state, onChange }: CreateTraitFormProps) {
  const { data } = useQuery({
    queryKey: queryKeys.traitTemplates.list(),
    queryFn: () => listTraitTemplates({ limit: 100 }),
  });

  const templates = data?.items ?? [];

  const slotOptions: Array<{ value: SlotType; label: string }> = [
    { value: "core_trait", label: "Core Trait (Character)" },
    { value: "role_trait", label: "Role Trait (Character)" },
    { value: "group_trait", label: "Group Trait" },
    { value: "feature_trait", label: "Feature Trait (Location)" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ct-target-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Target Type <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <div className="relative">
            <select
              id="ct-target-type"
              value={state.target_type}
              onChange={(e) =>
                onChange({ ...state, target_type: e.target.value as GameObjectType, target_id: "" })
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
          entityType={state.target_type}
          value={state.target_id}
          onChange={(id) => onChange({ ...state, target_id: id })}
          label="Target"
          required
          id="ct-target-entity"
        />
      </div>

      <div>
        <label htmlFor="ct-slot-type" className="block text-sm font-medium text-text-primary mb-1.5">
          Slot Type <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <div className="relative">
          <select
            id="ct-slot-type"
            value={state.slot_type}
            onChange={(e) => onChange({ ...state, slot_type: e.target.value as SlotType })}
            className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {slotOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
        </div>
      </div>

      <div>
        <label htmlFor="ct-template" className="block text-sm font-medium text-text-primary mb-1.5">
          Template (optional)
        </label>
        <div className="relative">
          <select
            id="ct-template"
            value={state.template_id}
            onChange={(e) => onChange({ ...state, template_id: e.target.value })}
            className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <option value="">No template (custom)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.type}] {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
        </div>
      </div>

      <div>
        <label htmlFor="ct-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Name
        </label>
        <input
          id="ct-name"
          type="text"
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder="Trait name (overrides template)"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="ct-description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description
        </label>
        <textarea
          id="ct-description"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          rows={2}
          placeholder="Trait description..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div>
        <label htmlFor="ct-charges" className="block text-sm font-medium text-text-primary mb-1.5">
          Starting Charges
        </label>
        <input
          id="ct-charges"
          type="number"
          min={0}
          max={5}
          value={state.charges}
          onChange={(e) => onChange({ ...state, charges: Number(e.target.value) })}
          className="w-24 rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="ct-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="ct-narrative"
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

export function buildCreateTraitRequest(
  state: CreateTraitFormState
): GmActionRequest | null {
  if (!state.target_id) return null;
  return {
    action_type: "create_trait",
    targets: [{ target_type: state.target_type, target_id: state.target_id, is_primary: true }],
    changes: {
      slot_type: state.slot_type,
      template_id: state.template_id || undefined,
      name: state.name || undefined,
      description: state.description || undefined,
      charge: state.charges,
    },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultCreateTraitState(): CreateTraitFormState {
  return {
    target_type: "character",
    target_id: "",
    slot_type: "core_trait",
    template_id: "",
    name: "",
    description: "",
    charges: 5,
    narrative: "",
  };
}

// ── Modify Trait ───────────────────────────────────────────────────

export interface ModifyTraitFormState {
  target_type: GameObjectType;
  target_id: string;
  trait_id: string;
  charge_op: "delta" | "set";
  charge_value: number;
  modify_charge: boolean;
  description: string;
  narrative: string;
}

interface ModifyTraitFormProps {
  state: ModifyTraitFormState;
  onChange: (state: ModifyTraitFormState) => void;
}

export function ModifyTraitForm({ state, onChange }: ModifyTraitFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="mt-target-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Target Type
          </label>
          <div className="relative">
            <select
              id="mt-target-type"
              value={state.target_type}
              onChange={(e) =>
                onChange({ ...state, target_type: e.target.value as GameObjectType, target_id: "" })
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
          entityType={state.target_type}
          value={state.target_id}
          onChange={(id) => onChange({ ...state, target_id: id })}
          label="Entity"
          required
          id="mt-target-entity"
        />
      </div>

      <div>
        <label htmlFor="mt-trait-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Trait ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="mt-trait-id"
          type="text"
          value={state.trait_id}
          onChange={(e) => onChange({ ...state, trait_id: e.target.value })}
          placeholder="Trait ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.modify_charge}
            onChange={(e) => onChange({ ...state, modify_charge: e.target.checked })}
            className="rounded border-border-default"
          />
          Modify charge
        </label>
        {state.modify_charge && (
          <div className="flex items-center gap-2 ml-6">
            <div className="relative">
              <select
                value={state.charge_op}
                onChange={(e) => onChange({ ...state, charge_op: e.target.value as "delta" | "set" })}
                aria-label="Charge operation"
                className="appearance-none rounded-md border border-border-default bg-bg-page pl-2 pr-6 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                <option value="delta">+/−</option>
                <option value="set">Set</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary" aria-hidden="true" />
            </div>
            <input
              type="number"
              min={0}
              max={5}
              value={state.charge_value}
              onChange={(e) => onChange({ ...state, charge_value: Number(e.target.value) })}
              aria-label="Charge value"
              className="w-20 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="mt-description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description
        </label>
        <textarea
          id="mt-description"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          rows={2}
          placeholder="Update description (leave blank to keep existing)..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div>
        <label htmlFor="mt-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="mt-narrative"
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

export function buildModifyTraitRequest(
  state: ModifyTraitFormState
): GmActionRequest | null {
  if (!state.target_id || !state.trait_id) return null;
  const changes: Record<string, unknown> = { trait_id: state.trait_id };
  if (state.modify_charge) {
    const ch: MeterChange = { op: state.charge_op, value: state.charge_value };
    changes.charge = ch;
  }
  if (state.description) changes.description = state.description;
  return {
    action_type: "modify_trait",
    targets: [{ target_type: state.target_type, target_id: state.target_id, is_primary: true }],
    changes,
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyTraitState(): ModifyTraitFormState {
  return {
    target_type: "character",
    target_id: "",
    trait_id: "",
    charge_op: "delta",
    charge_value: 0,
    modify_charge: false,
    description: "",
    narrative: "",
  };
}

// ── Retire Trait ───────────────────────────────────────────────────

export interface RetireTraitFormState {
  target_type: GameObjectType;
  target_id: string;
  trait_id: string;
  narrative: string;
}

interface RetireTraitFormProps {
  state: RetireTraitFormState;
  onChange: (state: RetireTraitFormState) => void;
}

export function RetireTraitForm({ state, onChange }: RetireTraitFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rt-target-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Target Type
          </label>
          <div className="relative">
            <select
              id="rt-target-type"
              value={state.target_type}
              onChange={(e) =>
                onChange({ ...state, target_type: e.target.value as GameObjectType, target_id: "" })
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
          entityType={state.target_type}
          value={state.target_id}
          onChange={(id) => onChange({ ...state, target_id: id })}
          label="Entity"
          required
          id="rt-target-entity"
        />
      </div>

      <div>
        <label htmlFor="rt-trait-id" className="block text-sm font-medium text-text-primary mb-1.5">
          Trait ID <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="rt-trait-id"
          type="text"
          value={state.trait_id}
          onChange={(e) => onChange({ ...state, trait_id: e.target.value })}
          placeholder="Trait ULID"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-400">
        Retiring a trait moves it to the Past section.
      </div>

      <div>
        <label htmlFor="rt-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="rt-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Why is this trait retiring?"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildRetireTraitRequest(
  state: RetireTraitFormState
): GmActionRequest | null {
  if (!state.target_id || !state.trait_id) return null;
  return {
    action_type: "retire_trait",
    targets: [{ target_type: state.target_type, target_id: state.target_id, is_primary: true }],
    changes: { trait_id: state.trait_id },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultRetireTraitState(): RetireTraitFormState {
  return { target_type: "character", target_id: "", trait_id: "", narrative: "" };
}
