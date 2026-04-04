"use client";

import { StarToggle as StarTogglePrimitive } from "@/components/ui/StarToggle";
import { useIsStarred, useStarToggle } from "../hooks/useStarredObjects";
import type { GameObjectType } from "@/lib/api/types";

interface StarToggleProps {
  /** Entity type to star/unstar. */
  type: GameObjectType | "story";
  /** Entity ID. */
  id: string;
  /** Display name (used for optimistic update in cache). */
  name: string;
}

/**
 * StarToggle (connected) — Feature-layer star toggle.
 *
 * Wraps the `StarToggle` UI primitive with mutation logic:
 * - Reads starred state from the ['starred'] TanStack Query cache
 * - Performs optimistic POST /me/starred or DELETE /me/starred/{type}/{id}
 * - Rolls back on error with toast notification
 *
 * Use this component in feeds, entity cards, and detail page headers.
 * Use the primitive directly when you need a standalone toggle without API coupling.
 */
export function StarToggle({ type, id, name }: StarToggleProps) {
  const isStarred = useIsStarred(type, id);
  const { star, unstar } = useStarToggle();

  function handleToggle() {
    if (isStarred) {
      unstar({ type, id });
    } else {
      star({ type, id, name });
    }
  }

  return <StarTogglePrimitive isStarred={isStarred} onToggle={handleToggle} />;
}
