"use client";

import Link from "next/link";
import { Radio, UserPlus, UserMinus } from "lucide-react";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { useAddParticipant, useRemoveParticipant } from "../hooks/useSessions";
import { useToast } from "@/lib/toast/useToast";

interface ActiveSessionBannerProps {
  /** The player's own character ID for join/leave status. */
  playerCharacterId?: string | null;
}

/**
 * ActiveSessionBanner — persistent teal banner shown in player layout when any
 * session is active.
 *
 * Shows: session summary, participation status, join/leave button.
 * Links to /sessions list and /sessions/{id} detail.
 *
 * spec/domains/sessions.md: "Active Session Visual Emphasis"
 */
export function ActiveSessionBanner({ playerCharacterId }: ActiveSessionBannerProps) {
  const { data: activeSession } = useActiveSession();
  const addMutation = useAddParticipant(activeSession?.id ?? "");
  const removeMutation = useRemoveParticipant(activeSession?.id ?? "");
  const toast = useToast();

  if (!activeSession) return null;

  const isParticipant = playerCharacterId
    ? activeSession.participants.some(
        (p) => p.character_id === playerCharacterId
      )
    : false;

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    if (!playerCharacterId) return;
    try {
      await addMutation.mutateAsync({ character_id: playerCharacterId });
      toast.success("Joined session.");
    } catch {
      toast.error("Failed to join session.");
    }
  }

  async function handleLeave(e: React.MouseEvent) {
    e.preventDefault();
    if (!playerCharacterId) return;
    try {
      await removeMutation.mutateAsync(playerCharacterId);
      toast.success("Left session.");
    } catch {
      toast.error("Failed to leave session.");
    }
  }

  return (
    <div
      className="w-full bg-brand-teal/10 border-b border-brand-teal/30 px-4 py-2"
      role="banner"
      aria-label="Active session banner"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Radio className="h-4 w-4 text-brand-teal shrink-0" aria-hidden="true" />
          <Link
            href={`/sessions/${activeSession.id}`}
            className="text-sm font-medium text-brand-teal hover:text-brand-teal/80 transition-colors truncate"
          >
            {activeSession.summary ?? "Active Session"}
          </Link>
          <span className="text-xs text-text-secondary hidden sm:inline shrink-0">
            — active
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {playerCharacterId && (
            <>
              {isParticipant ? (
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={removeMutation.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-meter-stress transition-colors disabled:opacity-50"
                  aria-label="Leave active session"
                >
                  <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={addMutation.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-brand-teal hover:text-brand-teal/80 transition-colors disabled:opacity-50"
                  aria-label="Join active session"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Join</span>
                </button>
              )}
            </>
          )}

          <Link
            href="/sessions"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            aria-label="View all sessions"
          >
            All sessions
          </Link>
        </div>
      </div>
    </div>
  );
}
