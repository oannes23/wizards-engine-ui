"use client";

import { useMemo } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateSessionForm } from "@/features/sessions/components/CreateSessionForm";
import { SessionCard } from "@/features/sessions/components/SessionCard";
import { useAllSessions } from "@/features/sessions/hooks/useSessions";
import type { SessionResponse } from "@/lib/api/types";

// ── Section helpers ────────────────────────────────────────────────

interface SessionSectionProps {
  title: string;
  sessions: SessionResponse[];
  collapsible?: boolean;
}

function SessionSection({
  title,
  sessions,
  collapsible = false,
}: SessionSectionProps) {
  if (sessions.length === 0) return null;

  const content = (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          detailHref="/sessions"
        />
      ))}
    </div>
  );

  if (collapsible) {
    return (
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3 list-none py-1 hover:text-text-primary transition-colors">
          <span>{title}</span>
          <span className="text-xs font-normal normal-case tracking-normal text-text-secondary ml-1">
            ({sessions.length})
          </span>
        </summary>
        {content}
      </details>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        {title}
      </h2>
      {content}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmSessionsPage — `/gm/sessions`
 *
 * Status-sectioned session list with inline create form at top.
 * Sections: Active (pinned, max 1), Draft, Ended (collapsed).
 * spec/domains/sessions.md: "GM Sessions Page (/gm/sessions)"
 */
export default function GmSessionsPage() {
  const { data, isLoading, isError } = useAllSessions();

  const { active, draft, ended } = useMemo(() => {
    const all = data?.items ?? [];
    return {
      active: all.filter((s) => s.status === "active"),
      draft: all
        .filter((s) => s.status === "draft")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      ended: all
        .filter((s) => s.status === "ended")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    };
  }, [data?.items]);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-brand-teal" aria-hidden="true" />
            Sessions
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage game sessions and participant distribution.
          </p>
        </div>

        {/* Inline create form */}
        <CreateSessionForm />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
                aria-hidden="true"
              >
                <div className="h-5 w-1/3 bg-bg-elevated rounded mb-3" />
                <div className="h-4 w-2/3 bg-bg-elevated rounded mb-2" />
                <div className="h-4 w-1/2 bg-bg-elevated rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8" />}
            title="Could not load sessions"
            description="An error occurred. Try refreshing the page."
          />
        ) : active.length === 0 && draft.length === 0 && ended.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="No sessions yet"
            description='Create the first session using the "New Session" form above.'
          />
        ) : (
          <div className="space-y-6">
            {/* Active — always visible at top */}
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-teal mb-3">
                  Active
                </h2>
                <div className="space-y-2">
                  {active.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      detailHref="/sessions"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Draft */}
            <SessionSection title="Draft" sessions={draft} />

            {/* Ended — collapsed by default */}
            <SessionSection title="Ended" sessions={ended} collapsible />
          </div>
        )}
      </div>
    </div>
  );
}
