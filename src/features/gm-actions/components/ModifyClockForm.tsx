"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { listClocks } from "@/lib/api/services/clocks";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { GmActionRequest, MeterChange } from "../types";

interface ModifyClockFormState {
  clock_id: string;
  op: "delta" | "set";
  value: number;
  narrative: string;
}

interface ModifyClockFormProps {
  state: ModifyClockFormState;
  onChange: (state: ModifyClockFormState) => void;
}

/** ModifyClockForm — fields for modify_clock GM action (progress). */
export function ModifyClockForm({ state, onChange }: ModifyClockFormProps) {
  const { data } = useQuery({
    queryKey: queryKeys.clocks.list(),
    queryFn: () => listClocks({ limit: 100 }),
  });

  const clocks = (data?.items ?? []).filter((c) => !c.is_completed);

  return (
    <div className="space-y-4">
      {/* Clock picker */}
      <div>
        <label
          htmlFor="modify-clock-id"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Clock <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <div className="relative">
          <select
            id="modify-clock-id"
            value={state.clock_id}
            onChange={(e) => onChange({ ...state, clock_id: e.target.value })}
            className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <option value="">Select clock...</option>
            {clocks.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.progress}/{c.segments})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Progress change */}
      <div className="flex items-center gap-3">
        <div>
          <label
            htmlFor="modify-clock-op"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Operation
          </label>
          <div className="relative">
            <select
              id="modify-clock-op"
              value={state.op}
              onChange={(e) => onChange({ ...state, op: e.target.value as "delta" | "set" })}
              className="appearance-none rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="delta">Advance (+/-)</option>
              <option value="set">Set to</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
              aria-hidden="true"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="modify-clock-value"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Value
          </label>
          <input
            id="modify-clock-value"
            type="number"
            value={state.value}
            onChange={(e) => onChange({ ...state, value: Number(e.target.value) })}
            className="w-24 rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="modify-clock-narrative"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Narrative
        </label>
        <textarea
          id="modify-clock-narrative"
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

export function buildModifyClockRequest(
  state: ModifyClockFormState
): GmActionRequest | null {
  if (!state.clock_id) return null;
  const change: MeterChange = { op: state.op, value: state.value };
  return {
    action_type: "modify_clock",
    targets: [{ target_type: "character", target_id: state.clock_id, is_primary: true }],
    changes: { progress: change, clock_id: state.clock_id },
    narrative: state.narrative || undefined,
    visibility: "bonded",
  };
}

export function defaultModifyClockState(): ModifyClockFormState {
  return { clock_id: "", op: "delta", value: 1, narrative: "" };
}
