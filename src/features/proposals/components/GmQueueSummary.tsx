"use client";

import { User, AlertTriangle } from "lucide-react";
import { MeterBar } from "@/components/ui/MeterBar";
import { GAME_CONSTANTS, METER_CONFIG } from "@/lib/constants";
import type { GmDashboardResponse } from "@/lib/api/types";

// ── Types ─────────────────────────────────────────────────────────

interface GmQueueSummaryProps {
  dashboard: GmDashboardResponse;
  /** Called when a PC card is clicked */
  onPcClick?: (characterId: string) => void;
}

// ── PC Summary Card ───────────────────────────────────────────────

interface PcSummaryCardProps {
  pc: GmDashboardResponse["pc_summaries"][number];
  isNearStressMax?: boolean;
  onClick?: () => void;
}

function PcSummaryCard({ pc, isNearStressMax, onClick }: PcSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border p-3 transition-colors
        ${isNearStressMax
          ? "border-meter-stress/40 bg-meter-stress/5"
          : "border-border-default bg-bg-elevated"
        }
        hover:border-brand-blue/50 hover:bg-bg-elevated
      `}
      aria-label={`View ${pc.name} character sheet`}
    >
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-text-secondary shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-text-primary truncate">
          {pc.name}
        </span>
        {isNearStressMax && (
          <AlertTriangle
            className="h-3.5 w-3.5 text-meter-stress shrink-0 ml-auto"
            aria-label="Near stress maximum"
          />
        )}
      </div>

      {/* Mini meter bars */}
      <div className="space-y-1.5">
        <MeterBar
          label="Str"
          value={pc.stress}
          max={GAME_CONSTANTS.STRESS_MAX}
          color={METER_CONFIG.stress.tailwindColor}
        />
        <MeterBar
          label="FT"
          value={pc.free_time}
          max={GAME_CONSTANTS.FREE_TIME_MAX}
          color={METER_CONFIG.free_time.tailwindColor}
        />
        <MeterBar
          label="Plt"
          value={pc.plot}
          max={GAME_CONSTANTS.PLOT_MAX}
          color={METER_CONFIG.plot.tailwindColor}
        />
        <MeterBar
          label="Gns"
          value={pc.gnosis}
          max={GAME_CONSTANTS.GNOSIS_MAX}
          color={METER_CONFIG.gnosis.tailwindColor}
        />
      </div>
    </button>
  );
}

// ── Main GmQueueSummary ───────────────────────────────────────────

/**
 * GmQueueSummary — right sidebar for the GM Queue page.
 *
 * Shows:
 * - Pending proposal count
 * - PC summary cards with mini meter bars and stress alerts
 * - Near-completion clocks (if any)
 */
export function GmQueueSummary({ dashboard, onPcClick }: GmQueueSummaryProps) {
  const stressWarningIds = new Set(
    dashboard.stress_proximity.map((s) => s.id)
  );

  return (
    <aside aria-label="GM queue summary" className="space-y-4">
      {/* Pending proposals count */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Pending
        </p>
        <p className="text-2xl font-bold text-text-primary tabular-nums">
          {dashboard.pending_proposals}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {dashboard.pending_proposals === 1 ? "proposal" : "proposals"} in queue
        </p>
      </div>

      {/* PC summaries */}
      {dashboard.pc_summaries.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 px-0.5">
            Characters
          </p>
          <div className="space-y-2">
            {dashboard.pc_summaries.map((pc) => (
              <PcSummaryCard
                key={pc.id}
                pc={pc}
                isNearStressMax={stressWarningIds.has(pc.id)}
                onClick={() => onPcClick?.(pc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Near-completion clocks */}
      {dashboard.near_completion_clocks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 px-0.5">
            Near-completion clocks
          </p>
          <div className="space-y-2">
            {dashboard.near_completion_clocks.map((clock) => (
              <div
                key={clock.id}
                className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2"
              >
                <p className="text-sm font-medium text-text-primary truncate">
                  {clock.name}
                </p>
                <p className="text-xs text-text-secondary tabular-nums">
                  {clock.progress}/{clock.segments} segments
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
