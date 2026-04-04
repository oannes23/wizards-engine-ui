"use client";

import { X } from "lucide-react";
import type { GameObjectType } from "@/lib/api/types";

// ── Filter state type (exported for page consumption) ─────────────────

export interface GmFeedFilterState {
  type?: "event" | "story_entry";
  target_type?: GameObjectType;
  actor_type?: "player" | "gm" | "system";
  session_id?: string;
  since?: string;
  until?: string;
}

export function hasActiveFilters(state: GmFeedFilterState): boolean {
  return !!(
    state.type ||
    state.target_type ||
    state.actor_type ||
    state.session_id ||
    state.since ||
    state.until
  );
}

// ── Option lists ──────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS: Array<{ value: "event" | "story_entry"; label: string }> = [
  { value: "event", label: "Events only" },
  { value: "story_entry", label: "Story entries only" },
];

const TARGET_TYPE_OPTIONS: Array<{ value: GameObjectType; label: string }> = [
  { value: "character", label: "Character" },
  { value: "group", label: "Group" },
  { value: "location", label: "Location" },
];

const ACTOR_TYPE_OPTIONS: Array<{ value: "player" | "gm" | "system"; label: string }> = [
  { value: "player", label: "Player" },
  { value: "gm", label: "GM" },
  { value: "system", label: "System" },
];

// ── Props ─────────────────────────────────────────────────────────────

interface GmFeedFilterPanelProps {
  filters: GmFeedFilterState;
  onChange: (filters: GmFeedFilterState) => void;
  onReset: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

/**
 * GmFeedFilterPanel — Advanced filter controls for the GM event feed.
 *
 * Controls:
 * - Item type radio group (event / story_entry)
 * - Target type select (character / group / location)
 * - Actor type select (player / gm / system)
 * - Date range inputs (since / until)
 * - Reset button when any filter is active
 */
export function GmFeedFilterPanel({ filters, onChange, onReset }: GmFeedFilterPanelProps) {
  const active = hasActiveFilters(filters);

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4 mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Advanced Filters</h2>
        {active && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Reset all filters"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* Item type */}
      <fieldset>
        <legend className="text-xs font-medium text-text-secondary mb-1.5">Item Type</legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="item-type"
                value={opt.value}
                checked={filters.type === opt.value}
                onChange={() => onChange({ ...filters, type: opt.value })}
                className="accent-brand-teal"
              />
              <span className="text-sm text-text-primary">{opt.label}</span>
            </label>
          ))}
          {filters.type && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="item-type"
                value=""
                checked={!filters.type}
                onChange={() => onChange({ ...filters, type: undefined })}
                className="accent-brand-teal"
              />
              <span className="text-sm text-text-secondary">All</span>
            </label>
          )}
        </div>
      </fieldset>

      {/* Target type */}
      <div>
        <label
          htmlFor="gm-filter-target-type"
          className="text-xs font-medium text-text-secondary block mb-1.5"
        >
          Target Type
        </label>
        <select
          id="gm-filter-target-type"
          value={filters.target_type ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              target_type: (e.target.value as GameObjectType) || undefined,
            })
          }
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-1.5 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-brand-blue
          "
        >
          <option value="">Any target type</option>
          {TARGET_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actor type */}
      <div>
        <label
          htmlFor="gm-filter-actor-type"
          className="text-xs font-medium text-text-secondary block mb-1.5"
        >
          Actor Type
        </label>
        <select
          id="gm-filter-actor-type"
          value={filters.actor_type ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              actor_type: (e.target.value as "player" | "gm" | "system") || undefined,
            })
          }
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-1.5 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-brand-blue
          "
        >
          <option value="">Any actor</option>
          {ACTOR_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="gm-filter-since"
            className="text-xs font-medium text-text-secondary block mb-1.5"
          >
            Since
          </label>
          <input
            id="gm-filter-since"
            type="date"
            value={filters.since ?? ""}
            onChange={(e) =>
              onChange({ ...filters, since: e.target.value || undefined })
            }
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-blue
            "
          />
        </div>
        <div>
          <label
            htmlFor="gm-filter-until"
            className="text-xs font-medium text-text-secondary block mb-1.5"
          >
            Until
          </label>
          <input
            id="gm-filter-until"
            type="date"
            value={filters.until ?? ""}
            onChange={(e) =>
              onChange({ ...filters, until: e.target.value || undefined })
            }
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-1.5 text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-blue
            "
          />
        </div>
      </div>

      {active && (
        <p className="text-xs text-brand-teal font-medium">
          Filters active — feed results are filtered
        </p>
      )}
    </div>
  );
}
