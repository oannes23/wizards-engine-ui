"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getCharacter,
  findTime,
  rechargeTrait,
  maintainBond,
  useEffect as useEffectApi,
  retireEffect,
  type RechargeTraitRequest,
  type MaintainBondRequest,
} from "@/lib/api/services/characters";
import type { CharacterDetailResponse } from "@/lib/api/types";
import { POLLING_INTERVALS } from "@/lib/constants";

// ── Main character detail hook ────────────────────────────────────

interface UseCharacterOptions {
  /** Whether to poll for updates */
  polling?: boolean;
  /** Whether an active session is ongoing (triggers faster polling) */
  activeSession?: boolean;
}

/**
 * TanStack Query hook for character detail.
 *
 * Polls at 15s normally, 5s during active session.
 * Poll pauses when tab is hidden (TanStack Query default).
 */
export function useCharacter(
  characterId: string | null | undefined,
  options: UseCharacterOptions = {}
): UseQueryResult<CharacterDetailResponse> {
  const { polling = true, activeSession = false } = options;

  const refetchInterval = !polling
    ? false
    : activeSession
      ? POLLING_INTERVALS.ACTIVE_SESSION
      : POLLING_INTERVALS.NORMAL;

  return useQuery<CharacterDetailResponse>({
    queryKey: queryKeys.characters.detail(characterId ?? ""),
    queryFn: () => getCharacter(characterId!),
    enabled: !!characterId,
    staleTime: 10_000,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

// ── Direct action mutations ────────────────────────────────────────

/** POST /characters/{id}/find-time — 3 Plot → 1 FT */
export function useFindTime(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => findTime(characterId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.characters.detail(characterId),
        data
      );
    },
  });
}

/** POST /characters/{id}/recharge-trait — restore trait to 5 charges (1 FT) */
export function useRechargeTrait(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RechargeTraitRequest) => rechargeTrait(characterId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.characters.detail(characterId),
        data
      );
    },
  });
}

/** POST /characters/{id}/maintain-bond — restore bond to effective max charges (1 FT) */
export function useMaintainBond(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MaintainBondRequest) => maintainBond(characterId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.characters.detail(characterId),
        data
      );
    },
  });
}

/** POST /characters/{id}/effects/{effect_id}/use */
export function useUseEffect(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (effectId: string) => useEffectApi(characterId, effectId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.characters.detail(characterId),
        data
      );
    },
  });
}

/** POST /characters/{id}/effects/{effect_id}/retire */
export function useRetireEffect(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (effectId: string) => retireEffect(characterId, effectId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.characters.detail(characterId),
        data
      );
    },
  });
}
