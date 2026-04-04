"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { listProposals } from "@/lib/api/services/proposals";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { POLLING_INTERVALS } from "@/lib/constants";
import type { PaginatedResponse, ProposalResponse } from "@/lib/api/types";

// ── Storage key ───────────────────────────────────────────────────

const LAST_SEEN_KEY = "proposals_last_seen_at";

function getLastSeenAt(): string | null {
  try {
    return sessionStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markProposalsSeen() {
  try {
    sessionStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  } catch {
    // sessionStorage unavailable — no-op
  }
}

// ── Hook ──────────────────────────────────────────────────────────

/**
 * useProposalBadge — returns a count of newly approved or rejected proposals
 * that the player has not yet seen (i.e., were resolved after last visit to
 * the proposals page).
 *
 * Count is derived by comparing proposal `updated_at` against the
 * `proposals_last_seen_at` timestamp stored in sessionStorage.
 *
 * Resets to 0 when the player visits /proposals (call `markProposalsSeen()`).
 */
export function useProposalBadge(characterId: string | null | undefined) {
  const { data: activeSession } = useActiveSession();
  const isActive = !!activeSession;

  const [count, setCount] = useState(0);
  const lastSeenRef = useRef(getLastSeenAt());

  const filters = {
    limit: 50,
    ...(characterId ? { character_id: characterId } : {}),
  };

  const query = useQuery<PaginatedResponse<ProposalResponse>>({
    queryKey: queryKeys.proposals.list({
      ...filters,
      _badge: true, // unique key to avoid interfering with list queries
    }),
    queryFn: () => listProposals(filters),
    enabled: !!characterId,
    staleTime: 10_000,
    refetchInterval: isActive ? POLLING_INTERVALS.ACTIVE_SESSION : POLLING_INTERVALS.NORMAL,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!query.data) return;

    const lastSeen = lastSeenRef.current;

    const newCount = query.data.items.filter((p) => {
      if (p.status !== "approved" && p.status !== "rejected") return false;
      if (!lastSeen) return true; // first visit — show all resolved
      return new Date(p.updated_at) > new Date(lastSeen);
    }).length;

    setCount(newCount);
  }, [query.data]);

  return count;
}
