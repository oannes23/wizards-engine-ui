"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  Inbox,
  AlertTriangle,
  Radio,
  AlertCircle,
} from "lucide-react";
import { MeterBar } from "@/components/ui/MeterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeDisplay } from "@/components/ui/TimeDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGmDashboard } from "@/features/proposals/hooks/useGmQueue";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { GAME_CONSTANTS, METER_CONFIG } from "@/lib/constants";
import type { GmDashboardResponse } from "@/lib/api/types";

// ── Active Session Card ────────────────────────────────────────────

function ActiveSessionCard() {
  const { data: activeSession, isLoading } = useActiveSession();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse">
        <div className="h-5 w-1/2 bg-bg-elevated rounded mb-2" />
        <div className="h-4 w-1/3 bg-bg-elevated rounded" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-surface p-4 text-sm text-text-secondary">
        No session currently active.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-brand-teal shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal">
            Active Session
          </p>
        </div>
        <StatusBadge status="active" />
      </div>

      <p className="text-sm font-medium text-text-primary mb-2">
        {activeSession.summary ?? "(No summary)"}
      </p>

      <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {activeSession.participants.length} participant
          {activeSession.participants.length !== 1 ? "s" : ""}
        </span>
        {activeSession.time_now != null && (
          <TimeDisplay timeNow={activeSession.time_now} />
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/gm/sessions/${activeSession.id}`}
          className="flex-1 text-center rounded-md px-3 py-1.5 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors"
        >
          View Session
        </Link>
        <Link
          href="/gm"
          className="flex-1 text-center rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-elevated hover:text-text-primary hover:bg-brand-navy-light transition-colors"
        >
          Proposal Queue
        </Link>
      </div>
    </div>
  );
}

// ── PC Summary Card ────────────────────────────────────────────────

interface PcCardProps {
  pc: GmDashboardResponse["pc_summaries"][number];
  isNearStressMax: boolean;
  onClick: () => void;
}

function PcCard({ pc, isNearStressMax, onClick }: PcCardProps) {
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
        hover:border-brand-blue/50
      `}
      aria-label={`View ${pc.name} character sheet`}
    >
      <div className="flex items-center gap-2 mb-2">
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

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmDashboardPage — `/gm/dashboard`
 *
 * Overview dashboard for the GM with:
 * - Active session card (prominent, teal accent)
 * - Pending proposals count with queue link
 * - PC summary cards with meters and stress warnings
 * - Near-completion clocks
 *
 * spec/ui/gm-views.md: "GM Dashboard: Queue + PC Sidebar"
 * spec/domains/sessions.md: "GM Dashboard Active Session Card"
 */
export default function GmDashboardPage() {
  const { data: dashboard, isLoading, isError } = useGmDashboard();
  const router = useRouter();

  if (isError) {
    return (
      <div className="min-h-screen bg-bg-page">
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <EmptyState
            icon={<AlertCircle className="h-8 w-8" />}
            title="Could not load dashboard"
            description="An error occurred loading GM data. Try refreshing."
          />
        </div>
      </div>
    );
  }

  const stressWarningIds = new Set(
    (dashboard?.stress_proximity ?? []).map((s) => s.id)
  );

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Game state at a glance.
          </p>
        </div>

        {/* Desktop: 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — session + proposals */}
          <div className="lg:col-span-1 space-y-4">
            {/* Active session card */}
            <section aria-label="Active session">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Session
              </h2>
              <ActiveSessionCard />
            </section>

            {/* Pending proposals */}
            <section aria-label="Proposal queue">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Queue
              </h2>
              <Link
                href="/gm"
                className="block rounded-lg border border-border-default bg-bg-surface p-4 hover:border-brand-blue/50 hover:bg-bg-elevated transition-colors"
                aria-label="Go to proposal queue"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-blue/10">
                    <Inbox className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                  </div>
                  <div>
                    {isLoading ? (
                      <div className="h-8 w-12 bg-bg-elevated rounded animate-pulse" />
                    ) : (
                      <p className="text-2xl font-bold text-text-primary tabular-nums">
                        {dashboard?.pending_proposals ?? 0}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary">
                      pending proposal
                      {(dashboard?.pending_proposals ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </section>

            {/* Near-completion clocks */}
            {dashboard?.near_completion_clocks &&
              dashboard.near_completion_clocks.length > 0 && (
                <section aria-label="Near-completion clocks">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Clocks
                  </h2>
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
                </section>
              )}
          </div>

          {/* Right column — PC summaries */}
          <div className="lg:col-span-2">
            <section aria-label="Character status">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Characters
              </h2>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border-default bg-bg-elevated p-4 animate-pulse"
                      aria-hidden="true"
                    >
                      <div className="h-4 w-1/2 bg-bg-page rounded mb-3" />
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-3 bg-bg-page rounded" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboard?.pc_summaries.length === 0 ? (
                <div className="rounded-lg border border-border-default bg-bg-surface p-6 text-center text-sm text-text-secondary">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 text-text-secondary/50" aria-hidden="true" />
                  No player characters yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(dashboard?.pc_summaries ?? []).map((pc) => (
                    <PcCard
                      key={pc.id}
                      pc={pc}
                      isNearStressMax={stressWarningIds.has(pc.id)}
                      onClick={() => router.push(`/gm/world/characters/${pc.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
