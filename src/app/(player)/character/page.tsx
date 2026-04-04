"use client";

import { useAuth } from "@/lib/auth/useAuth";
import {
  useCharacter,
  useRechargeTrait,
  useMaintainBond,
  useFindTime,
  useUseEffect,
  useRetireEffect,
} from "@/lib/hooks/useCharacter";
import { useToast } from "@/lib/toast/useToast";
import { MeterHeader } from "@/features/character";
import { CharacterTabs } from "@/features/character";
import { CharacterDesktopLayout } from "@/features/character";
import { useCharacterFeed } from "@/features/character/hooks/useCharacterFeed";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { POLLING_INTERVALS } from "@/lib/constants";
import { useState } from "react";

/**
 * CharacterSheetPage — player's own character sheet.
 *
 * Layout:
 * - Sticky MeterHeader (always visible)
 * - Mobile: tabbed sections (CharacterTabs)
 * - Desktop (lg+): 3-column layout (CharacterDesktopLayout)
 *
 * Polling: 15s normal, 5s during active session.
 */
export default function CharacterSheetPage() {
  const { characterId } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Detect active session for polling interval
  const { data: activeSessionData } = useActiveSession();
  const hasActiveSession = !!activeSessionData;

  const {
    data: character,
    isLoading,
    error,
  } = useCharacter(characterId, {
    polling: true,
    activeSession: hasActiveSession,
  });

  // Character feed
  const {
    data: feedData,
    isLoading: isFeedLoading,
    isFetchingNextPage: isFeedFetchingNextPage,
    hasNextPage: hasFeedNextPage,
    fetchNextPage: fetchFeedNextPage,
    isError: isFeedError,
  } = useCharacterFeed(characterId, { activeSession: hasActiveSession });

  // ── Mutations ────────────────────────────────────────────────────

  const [rechargingTraitId, setRechargingTraitId] = useState<string | null>(null);
  const [maintainingBondId, setMaintainingBondId] = useState<string | null>(null);
  const [usingEffectId, setUsingEffectId] = useState<string | null>(null);
  const [retiringEffectId, setRetiringEffectId] = useState<string | null>(null);
  const [isFindingTime, setIsFindingTime] = useState(false);

  const rechargeMutation = useRechargeTrait(characterId ?? "");
  const maintainMutation = useMaintainBond(characterId ?? "");
  const findTimeMutation = useFindTime(characterId ?? "");
  const useEffectMutation = useUseEffect(characterId ?? "");
  const retireEffectMutation = useRetireEffect(characterId ?? "");

  function handleRechargeTrait(traitId: string) {
    setRechargingTraitId(traitId);
    rechargeMutation.mutate(
      { trait_instance_id: traitId },
      {
        onSuccess: () => {
          toastSuccess("Trait recharged");
        },
        onError: () => {
          toastError("Failed to recharge trait");
        },
        onSettled: () => {
          setRechargingTraitId(null);
        },
      }
    );
  }

  function handleMaintainBond(bondId: string) {
    setMaintainingBondId(bondId);
    maintainMutation.mutate(
      { bond_instance_id: bondId },
      {
        onSuccess: () => {
          toastSuccess("Bond maintained");
        },
        onError: () => {
          toastError("Failed to maintain bond");
        },
        onSettled: () => {
          setMaintainingBondId(null);
        },
      }
    );
  }

  function handleFindTime() {
    setIsFindingTime(true);
    findTimeMutation.mutate(undefined, {
      onSuccess: () => {
        toastSuccess("Found time — 3 Plot spent, 1 Free Time gained");
      },
      onError: () => {
        toastError("Failed to find time — not enough Plot");
      },
      onSettled: () => {
        setIsFindingTime(false);
      },
    });
  }

  function handleUseEffect(effectId: string) {
    setUsingEffectId(effectId);
    useEffectMutation.mutate(effectId, {
      onSuccess: () => {
        toastSuccess("Effect used");
      },
      onError: () => {
        toastError("Failed to use effect");
      },
      onSettled: () => {
        setUsingEffectId(null);
      },
    });
  }

  function handleRetireEffect(effectId: string) {
    setRetiringEffectId(effectId);
    retireEffectMutation.mutate(effectId, {
      onSuccess: () => {
        toastSuccess("Effect retired");
      },
      onError: () => {
        toastError("Failed to retire effect");
      },
      onSettled: () => {
        setRetiringEffectId(null);
      },
    });
  }

  // ── Render ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-page">
        <div className="bg-bg-surface border-b border-border-default px-4 py-3">
          <div className="h-6 w-40 bg-bg-elevated rounded animate-pulse mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-bg-elevated rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
            Could not load character
          </h2>
          <p className="text-text-secondary text-sm">
            {error?.message ?? "No character found. Please contact the GM."}
          </p>
        </div>
      </div>
    );
  }

  const sharedFeedProps = {
    feedData,
    isFeedLoading,
    isFeedFetchingNextPage,
    hasFeedNextPage,
    fetchFeedNextPage,
    isFeedError,
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-page">
      {/* Sticky meter header — always visible */}
      <MeterHeader character={character} sticky />

      {/* Mobile: tabbed sections */}
      <CharacterTabs
        character={character}
        onRechargeTrait={handleRechargeTrait}
        rechargingTraitId={rechargingTraitId}
        onMaintainBond={handleMaintainBond}
        maintainingBondId={maintainingBondId}
        onUseEffect={handleUseEffect}
        usingEffectId={usingEffectId}
        onRetireEffect={handleRetireEffect}
        retiringEffectId={retiringEffectId}
        onFindTime={handleFindTime}
        isFindingTime={isFindingTime}
        {...sharedFeedProps}
      />

      {/* Desktop: 3-column layout */}
      <CharacterDesktopLayout
        character={character}
        onRechargeTrait={handleRechargeTrait}
        rechargingTraitId={rechargingTraitId}
        onMaintainBond={handleMaintainBond}
        maintainingBondId={maintainingBondId}
        onUseEffect={handleUseEffect}
        usingEffectId={usingEffectId}
        onRetireEffect={handleRetireEffect}
        retiringEffectId={retiringEffectId}
        onFindTime={handleFindTime}
        isFindingTime={isFindingTime}
        {...sharedFeedProps}
      />
    </div>
  );
}
