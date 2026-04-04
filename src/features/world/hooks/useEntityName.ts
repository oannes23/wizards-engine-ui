"use client";

import { useQueryClient, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { getCharacter } from "@/lib/api/services/characters";
import { getGroup } from "@/lib/api/services/groups";
import { getLocation } from "@/lib/api/services/locations";
import type { GameObjectType, CharacterDetailResponse, GroupDetailResponse, LocationDetailResponse } from "@/lib/api/types";

/**
 * useEntityName — Resolves a display name for a polymorphic entity reference.
 *
 * Story owners return { type, id } without a name field. This hook:
 * 1. Checks the TanStack Query cache first (avoids network roundtrip)
 * 2. Falls back to a minimal fetch if not cached
 *
 * Returns { name, isLoading } so callers can show a placeholder while loading.
 */
export function useEntityName(
  type: GameObjectType,
  id: string
): { name: string | null; isLoading: boolean } {
  const queryClient = useQueryClient();

  // Check cache first
  const cached = (() => {
    switch (type) {
      case "character": {
        const data = queryClient.getQueryData<CharacterDetailResponse>(
          queryKeys.characters.detail(id)
        );
        return data?.name ?? null;
      }
      case "group": {
        const data = queryClient.getQueryData<GroupDetailResponse>(
          queryKeys.groups.detail(id)
        );
        return data?.name ?? null;
      }
      case "location": {
        const data = queryClient.getQueryData<LocationDetailResponse>(
          queryKeys.locations.detail(id)
        );
        return data?.name ?? null;
      }
      default:
        return null;
    }
  })();

  // Fetch query — disabled if we already have the name from cache
  const queryFn = () => {
    switch (type) {
      case "character":
        return getCharacter(id).then((r) => r.name);
      case "group":
        return getGroup(id).then((r) => r.name);
      case "location":
        return getLocation(id).then((r) => r.name);
      default:
        return Promise.resolve(id);
    }
  };

  const queryKey =
    type === "character"
      ? queryKeys.characters.detail(id)
      : type === "group"
        ? queryKeys.groups.detail(id)
        : queryKeys.locations.detail(id);

  const { data: fetched, isLoading } = useQuery({
    // Reuse the same query key as the full detail query so we share the cache
    queryKey,
    queryFn,
    enabled: !cached && !!id,
    staleTime: 60_000,
    // Select just the name field from the full response
    select: (data) => {
      if (typeof data === "string") return data;
      return (data as { name?: string }).name ?? id;
    },
  });

  return {
    name: cached ?? (fetched as string | null | undefined) ?? null,
    isLoading: !cached && isLoading,
  };
}
