"use client";

import Link from "next/link";
import { Users, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeDisplay } from "@/components/ui/TimeDisplay";
import type { SessionResponse } from "@/lib/api/types";

interface SessionCardProps {
  session: SessionResponse;
  /** Character ID of the viewing player (for participation status). */
  playerCharacterId?: string | null;
  /** Base href for session detail link — e.g. "/sessions" or "/gm/sessions" */
  detailHref?: string;
}

/**
 * SessionCard — compact card for a session in a list.
 *
 * Shows: status badge, name/summary, date, participant count, time_now.
 * For players, also shows participation status.
 */
export function SessionCard({
  session,
  playerCharacterId,
  detailHref = "/sessions",
}: SessionCardProps) {
  const isParticipant = playerCharacterId
    ? session.participants.some((p) => p.character_id === playerCharacterId)
    : false;

  const formattedDate = session.date
    ? new Date(session.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`${detailHref}/${session.id}`}
      className="
        block rounded-lg border border-border-default bg-bg-surface p-4
        hover:border-brand-blue/50 hover:bg-bg-elevated transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus
      "
      aria-label={`Session: ${session.summary ?? session.id}, status ${session.status}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={session.status} />
          {playerCharacterId && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isParticipant
                  ? "bg-brand-teal/20 text-brand-teal"
                  : "bg-bg-elevated text-text-secondary"
              }`}
            >
              {isParticipant ? "Joined" : "Not joined"}
            </span>
          )}
        </div>
        {session.time_now != null && (
          <TimeDisplay timeNow={session.time_now} />
        )}
      </div>

      <p className="text-sm font-medium text-text-primary leading-snug mb-2 line-clamp-2">
        {session.summary ?? "(No summary)"}
      </p>

      <div className="flex items-center gap-4 text-xs text-text-secondary">
        {formattedDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formattedDate}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {session.participants.length}{" "}
          {session.participants.length === 1 ? "participant" : "participants"}
        </span>
      </div>
    </Link>
  );
}
