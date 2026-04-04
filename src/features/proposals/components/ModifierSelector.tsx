"use client";

/**
 * ModifierSelector — Three-slot modifier picker for proposal forms.
 *
 * Three fixed slots: Core Trait, Role Trait, Bond.
 * Each slot shows available options with current charges.
 * Items with 0 charges are disabled (shown but cannot be selected).
 * Live dice pool preview updates as selections change.
 *
 * Enforces the stacking rule: max 1 core trait + 1 role trait + 1 bond = +3d.
 */

import type { CharacterTraitResponse, BondDisplayResponse } from "@/lib/api/types";

// ── Types ──────────────────────────────────────────────────────────

export interface ModifierSelections {
  core_trait_id?: string;
  role_trait_id?: string;
  bond_id?: string;
}

interface ModifierSelectorProps {
  /** Active traits from character data */
  traits: CharacterTraitResponse[];
  /** Active bonds from character data */
  bonds: BondDisplayResponse[];
  value: ModifierSelections;
  onChange: (value: ModifierSelections) => void;
  /** Base dice pool before modifiers — used for preview */
  baseDice?: number;
}

// ── Slot component ─────────────────────────────────────────────────

interface SlotOption {
  id: string;
  label: string;
  charges: number;
  maxCharges: number;
}

interface SlotSelectProps {
  slotLabel: string;
  slotId: string;
  options: SlotOption[];
  selectedId?: string;
  onChange: (id: string | undefined) => void;
  emptyLabel: string;
}

function SlotSelect({
  slotLabel,
  slotId,
  options,
  selectedId,
  onChange,
  emptyLabel,
}: SlotSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={slotId}
        className="text-xs font-semibold text-text-secondary"
      >
        {slotLabel}
      </label>
      <select
        id={slotId}
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="
          w-full rounded-md border border-border-default bg-bg-elevated
          px-3 py-2 text-sm text-text-primary
          focus:outline-none focus:ring-2 focus:ring-brand-teal
          appearance-none
        "
      >
        <option value="">{emptyLabel}</option>
        {options.map((opt) => {
          const hasCharges = opt.charges > 0;
          return (
            <option
              key={opt.id}
              value={opt.id}
              disabled={!hasCharges}
            >
              {opt.label} ({opt.charges}/{opt.maxCharges} charges)
              {!hasCharges ? " — no charges" : ""}
            </option>
          );
        })}
      </select>
      {selectedId && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-teal">+1d bonus</span>
          {options.find((o) => o.id === selectedId) && (
            <span className="text-xs text-meter-stress">
              −1 charge on approval
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function ModifierSelector({
  traits,
  bonds,
  value,
  onChange,
  baseDice,
}: ModifierSelectorProps) {
  const coreTraits = traits.filter((t) => t.slot_type === "core_trait" && t.is_active);
  const roleTraits = traits.filter((t) => t.slot_type === "role_trait" && t.is_active);
  const activeBonds = bonds.filter((b) => b.is_active && !b.is_trauma);

  const CHARGE_MAX = 5;

  const coreOptions: SlotOption[] = coreTraits.map((t) => ({
    id: t.id,
    label: t.name,
    charges: t.charge,
    maxCharges: CHARGE_MAX,
  }));

  const roleOptions: SlotOption[] = roleTraits.map((t) => ({
    id: t.id,
    label: t.name,
    charges: t.charge,
    maxCharges: CHARGE_MAX,
  }));

  const bondOptions: SlotOption[] = activeBonds.map((b) => ({
    id: b.id,
    label: b.target_name + (b.label ? ` (${b.label})` : ""),
    charges: b.charges ?? 0,
    maxCharges: b.effective_charges_max ?? CHARGE_MAX,
  }));

  // Compute modifier count for dice preview
  const modifierCount =
    (value.core_trait_id ? 1 : 0) +
    (value.role_trait_id ? 1 : 0) +
    (value.bond_id ? 1 : 0);

  const totalDice = baseDice !== undefined ? baseDice + modifierCount : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Modifiers</h3>
        <span className="text-xs text-text-secondary">
          Max +3d (1 core + 1 role + 1 bond)
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <SlotSelect
          slotLabel="Core Trait (+1d)"
          slotId="modifier-core-trait"
          options={coreOptions}
          selectedId={value.core_trait_id}
          onChange={(id) => onChange({ ...value, core_trait_id: id })}
          emptyLabel="No core trait modifier"
        />

        <SlotSelect
          slotLabel="Role Trait (+1d)"
          slotId="modifier-role-trait"
          options={roleOptions}
          selectedId={value.role_trait_id}
          onChange={(id) => onChange({ ...value, role_trait_id: id })}
          emptyLabel="No role trait modifier"
        />

        <SlotSelect
          slotLabel="Bond (+1d)"
          slotId="modifier-bond"
          options={bondOptions}
          selectedId={value.bond_id}
          onChange={(id) => onChange({ ...value, bond_id: id })}
          emptyLabel="No bond modifier"
        />
      </div>

      {/* Live dice preview */}
      {baseDice !== undefined && (
        <div
          aria-live="polite"
          aria-label="Dice pool preview"
          className="
            rounded-md bg-bg-elevated border border-border-default
            px-3 py-2 flex items-center justify-between
          "
        >
          <span className="text-xs text-text-secondary">
            Dice pool
            {modifierCount > 0 && (
              <span className="ml-1 text-brand-teal">
                ({baseDice} base + {modifierCount} modifier{modifierCount !== 1 ? "s" : ""})
              </span>
            )}
          </span>
          <span className="text-lg font-bold tabular-nums text-text-primary">
            {totalDice}d
          </span>
        </div>
      )}
    </div>
  );
}
