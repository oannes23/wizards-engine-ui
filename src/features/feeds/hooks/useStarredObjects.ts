"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import {
  getStarredObjects,
  starObject,
  unstarObject,
} from "@/lib/api/services/starred";
import { useToast } from "@/lib/toast/useToast";
import type { GameObjectType } from "@/lib/api/types";
import type { StarredObjectsResponse, StarredObject } from "../types";

/**
 * useStarredObjects — Query for GET /me/starred.
 * Aggressive cache (staleTime: Infinity) — changes only on explicit star/unstar.
 */
export function useStarredObjects() {
  return useQuery<StarredObjectsResponse>({
    queryKey: queryKeys.starred.all,
    queryFn: getStarredObjects,
    staleTime: Infinity,
  });
}

/**
 * useStarToggle — Mutation pair (star/unstar) with optimistic updates.
 *
 * - Star/unstar is deterministic — safe for optimism (spec: data-fetching.md)
 * - Optimistically toggles in ['starred'] cache
 * - Rolls back on error
 */
export function useStarToggle() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  const starMutation = useMutation({
    mutationFn: ({ type, id }: { type: GameObjectType | "story"; id: string; name: string }) =>
      starObject(type, id),

    onMutate: async ({ type, id, name }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.starred.all });

      // Snapshot previous value
      const previous = queryClient.getQueryData<StarredObjectsResponse>(
        queryKeys.starred.all
      );

      // Optimistically add to starred list
      queryClient.setQueryData<StarredObjectsResponse>(
        queryKeys.starred.all,
        (old) => {
          if (!old) return { items: [{ type, id, name }] };
          const already = old.items.some((s) => s.type === type && s.id === id);
          if (already) return old;
          return { items: [...old.items, { type, id, name }] };
        }
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Roll back
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.starred.all, context.previous);
      }
      showError("Failed to star — please try again");
    },
  });

  const unstarMutation = useMutation({
    mutationFn: ({ type, id }: { type: GameObjectType | "story"; id: string }) =>
      unstarObject(type, id),

    onMutate: async ({ type, id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.starred.all });

      const previous = queryClient.getQueryData<StarredObjectsResponse>(
        queryKeys.starred.all
      );

      // Optimistically remove from starred list
      queryClient.setQueryData<StarredObjectsResponse>(
        queryKeys.starred.all,
        (old) => {
          if (!old) return { items: [] };
          return {
            items: old.items.filter((s) => !(s.type === type && s.id === id)),
          };
        }
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.starred.all, context.previous);
      }
      showError("Failed to unstar — please try again");
    },
  });

  return {
    star: starMutation.mutate,
    unstar: unstarMutation.mutate,
    isStarring: starMutation.isPending,
    isUnstarring: unstarMutation.isPending,
  };
}

/**
 * useIsStarred — Check if a specific object is starred.
 */
export function useIsStarred(type: GameObjectType | "story", id: string): boolean {
  const { data } = useStarredObjects();
  if (!data) return false;
  return data.items.some((s: StarredObject) => s.type === type && s.id === id);
}
