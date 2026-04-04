"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { SessionDetail } from "@/features/sessions/components/SessionDetail";

interface PlayerSessionDetailPageProps {
  params: { id: string };
}

/**
 * PlayerSessionDetailPage — `/sessions/[id]`
 *
 * Player view of session detail. Shows participants and timeline.
 * Player sees join/leave controls for self only.
 * Read-only for ended sessions.
 */
export default function PlayerSessionDetailPage({
  params,
}: PlayerSessionDetailPageProps) {
  const { user } = useAuth();

  return (
    <SessionDetail
      id={params.id}
      isGm={false}
      playerCharacterId={user?.character_id}
    />
  );
}
