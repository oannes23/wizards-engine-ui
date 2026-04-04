"use client";

import { useMemo } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionCard } from "@/features/sessions/components/SessionCard";
import { useAllSessions } from "@/features/sessions/hooks/useSessions";
import { useAuth } from "@/lib/auth/useAuth";

/**
 * PlayerSessionsPage — `/sessions`
 *
 * Reverse-chronological list of all sessions visible to the player.
 * Cards show: status badge, date, participant count, participation status.
 * Join/Leave/Contribution toggle inline (via SessionCard links to detail page).
 *
 * spec/ui/player-views.md: "Sessions List (/sessions)"
 * spec/domains/sessions.md: "Player Sessions List: All Sessions Visible"
 */
export default function PlayerSessionsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useAllSessions();

  const sorted = useMemo(() => {
    const all = data?.items ?? [];
    return [...all].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
            Campaign session history.
          </p>
        </div>

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
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="No sessions yet"
            description="Sessions will appear here once the GM creates them."
          />
        ) : (
          <div className="space-y-2">
            {sorted.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                playerCharacterId={user?.character_id}
                detailHref="/sessions"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
