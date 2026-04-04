"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Calendar, Users, Clock, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeDisplay } from "@/components/ui/TimeDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionLifecycleControls } from "./SessionLifecycleControls";
import { ParticipantManagement } from "./ParticipantManagement";
import { SessionTimelineFeed } from "@/features/feeds/components/SessionTimelineFeed";
import { useSession } from "../hooks/useSessions";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { listCharacters } from "@/lib/api/services/characters";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { formatRelativeTime } from "@/lib/utils/time";
import type { CharacterDetailResponse } from "@/lib/api/types";

type SessionDetailTab = "participants" | "timeline";

interface SessionDetailProps {
  id: string;
  isGm?: boolean;
  /** The viewer's own character ID (for player join/leave). */
  playerCharacterId?: string | null;
}

// ── Character list query ──────────────────────────────────────────

function useFullCharacters() {
  return useQuery<CharacterDetailResponse[]>({
    queryKey: queryKeys.characters.list({ detail_level: "full" }),
    queryFn: async () => {
      const res = await listCharacters({ detail_level: "full", limit: 100 });
      return res.items;
    },
    staleTime: 60_000,
  });
}

// ── Main Component ────────────────────────────────────────────────

/**
 * SessionDetail — shared detail page component for sessions.
 *
 * Consumed by both /gm/sessions/[id] and /sessions/[id].
 * Role-aware: isGm shows lifecycle controls, participant management,
 * and edit controls. Players see reduced controls (join/leave self only).
 *
 * spec/domains/sessions.md: "Session Detail Page (/sessions/[id]) — Shared"
 */
export function SessionDetail({
  id,
  isGm = false,
  playerCharacterId,
}: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<SessionDetailTab>("participants");

  const { data: session, isLoading, isError } = useSession(id);
  const { data: activeSession } = useActiveSession();
  const { data: allCharacters = [] } = useFullCharacters();

  const isThisActive = activeSession?.id === id;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-1/3 bg-bg-elevated rounded" />
          <div className="h-5 w-1/4 bg-bg-elevated rounded" />
          <div className="h-24 bg-bg-elevated rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="Session not found"
          description="This session does not exist or you do not have access to it."
        />
      </div>
    );
  }

  const formattedDate = session.date
    ? new Date(session.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`min-h-screen bg-bg-page ${
        isThisActive ? "border-l-2 border-brand-teal/40" : ""
      }`}
    >
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={session.status} />
              {isThisActive && (
                <span className="text-xs text-brand-teal font-medium bg-brand-teal/10 px-2 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            {isGm && <SessionLifecycleControls session={session} />}
          </div>

          {/* Summary */}
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
            {session.summary ?? "(No summary)"}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden="true" />
              {session.participants.length} participant
              {session.participants.length !== 1 ? "s" : ""}
            </span>
            {session.time_now != null && (
              <TimeDisplay timeNow={session.time_now} />
            )}
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Updated {formatRelativeTime(session.updated_at)}
            </span>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mt-3 rounded-md border border-border-default bg-bg-elevated px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Notes
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {session.notes}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SessionDetailTab)}
        >
          <Tabs.List
            className="flex gap-1 mb-4 border-b border-border-default"
            aria-label="Session tabs"
          >
            <Tabs.Trigger
              value="participants"
              className="
                flex items-center gap-1.5 px-3 py-2
                text-sm font-medium text-text-secondary
                border-b-2 border-transparent -mb-px
                hover:text-text-primary transition-colors
                data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
              "
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Participants
            </Tabs.Trigger>

            <Tabs.Trigger
              value="timeline"
              className="
                flex items-center gap-1.5 px-3 py-2
                text-sm font-medium text-text-secondary
                border-b-2 border-transparent -mb-px
                hover:text-text-primary transition-colors
                data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal
              "
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              Timeline
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="participants" className="focus:outline-none">
            <ParticipantManagement
              session={session}
              allCharacters={allCharacters}
              isGm={isGm}
              playerCharacterId={playerCharacterId}
            />
          </Tabs.Content>

          <Tabs.Content value="timeline" className="focus:outline-none">
            <SessionTimelineFeed
              sessionId={id}
              isActiveSession={isThisActive}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
