"use client";

import { ChevronDown } from "lucide-react";
import { EntityPicker } from "./EntityPicker";
import type { GmActionRequest, MagicStatName } from "../types";

const MAGIC_STAT_OPTIONS: Array<{ value: MagicStatName; label: string }> = [
  { value: "being", label: "Being" },
  { value: "wyrding", label: "Wyrding" },
  { value: "summoning", label: "Summoning" },
  { value: "enchanting", label: "Enchanting" },
  { value: "dreaming", label: "Dreaming" },
];

export interface AwardXpFormState {
  target_id: string;
  stat: MagicStatName;
  amount: number;
  narrative: string;
}

interface AwardXpFormProps {
  state: AwardXpFormState;
  onChange: (state: AwardXpFormState) => void;
}

/**
 * AwardXpForm — fields for award_xp GM action.
 *
 * Grants magic stat XP to a character.
 */
export function AwardXpForm({ state, onChange }: AwardXpFormProps) {
  return (
    <div className="space-y-4">
      <EntityPicker
        entityType="character"
        value={state.target_id}
        onChange={(id) => onChange({ ...state, target_id: id })}
        label="Target Character"
        required
        id="award-xp-target"
      />

      <div>
        <label htmlFor="award-xp-stat" className="block text-sm font-medium text-text-primary mb-1.5">
          Magic Stat <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <div className="relative">
          <select
            id="award-xp-stat"
            value={state.stat}
            onChange={(e) => onChange({ ...state, stat: e.target.value as MagicStatName })}
            className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {MAGIC_STAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
        <label htmlFor="award-xp-amount" className="block text-sm font-medium text-text-primary mb-1.5">
          XP Amount <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="award-xp-amount"
          type="number"
          min={1}
          value={state.amount}
          onChange={(e) => onChange({ ...state, amount: Number(e.target.value) })}
          className="w-24 rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
        <p className="text-xs text-text-secondary mt-1">5 XP = 1 level (max level 5).</p>
      </div>

      <div>
        <label htmlFor="award-xp-narrative" className="block text-sm font-medium text-text-primary mb-1.5">
          Narrative
        </label>
        <textarea
          id="award-xp-narrative"
          value={state.narrative}
          onChange={(e) => onChange({ ...state, narrative: e.target.value })}
          rows={2}
          placeholder="Context for the XP award..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>
    </div>
  );
}

export function buildAwardXpRequest(
  state: AwardXpFormState
): GmActionRequest | null {
  if (!state.target_id || state.amount <= 0) return null;
  return {
    action_type: "award_xp",
    targets: [{ target_type: "character", target_id: state.target_id, is_primary: true }],
    changes: { stat: state.stat, amount: state.amount },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultAwardXpState(): AwardXpFormState {
  return { target_id: "", stat: "being", amount: 1, narrative: "" };
}
