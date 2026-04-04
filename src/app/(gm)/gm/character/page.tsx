"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
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
import { createMyCharacter } from "@/lib/api/services/players";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { MeResponse } from "@/lib/api/types";

// ── Create Character Form ─────────────────────────────────────────

interface CreateCharacterFormProps {
  onCreated: (user: MeResponse) => void;
}

function CreateCharacterForm({ onCreated }: CreateCharacterFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createMyCharacter({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (updatedUser) => {
      // Sync auth cache so characterId becomes available
      queryClient.setQueryData(queryKeys.auth.me, updatedUser);
      onCreated(updatedUser);
    },
    onError: () => {
      toast.error("Failed to create character — please try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/10 border border-brand-teal/30">
            <User className="h-8 w-8 text-brand-teal" aria-hidden="true" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Create Your Character
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            As GM you can have a character in the game. Fill in the details
            below to create yours.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="char-name"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Character Name <span className="text-meter-stress">*</span>
            </label>
            <input
              id="char-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
              required
              maxLength={100}
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          <div>
            <label
              htmlFor="char-description"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Description{" "}
              <span className="text-xs text-text-secondary font-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="char-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your character..."
              rows={3}
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || mutation.isPending}
            className="w-full rounded-md bg-brand-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Creating..." : "Create Character"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Character Sheet (reuses player sheet) ─────────────────────────

function GmCharacterSheet({ characterId }: { characterId: string }) {
  const { success: toastSuccess, error: toastError } = useToast();

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

  const {
    data: feedData,
    isLoading: isFeedLoading,
    isFetchingNextPage: isFeedFetchingNextPage,
    hasNextPage: hasFeedNextPage,
    fetchNextPage: fetchFeedNextPage,
    isError: isFeedError,
  } = useCharacterFeed(characterId, { activeSession: hasActiveSession });

  const [rechargingTraitId, setRechargingTraitId] = useState<string | null>(null);
  const [maintainingBondId, setMaintainingBondId] = useState<string | null>(null);
  const [usingEffectId, setUsingEffectId] = useState<string | null>(null);
  const [retiringEffectId, setRetiringEffectId] = useState<string | null>(null);
  const [isFindingTime, setIsFindingTime] = useState(false);

  const rechargeMutation = useRechargeTrait(characterId);
  const maintainMutation = useMaintainBond(characterId);
  const findTimeMutation = useFindTime(characterId);
  const useEffectMutation = useUseEffect(characterId);
  const retireEffectMutation = useRetireEffect(characterId);

  function handleRechargeTrait(traitId: string) {
    setRechargingTraitId(traitId);
    rechargeMutation.mutate(
      { trait_instance_id: traitId },
      {
        onSuccess: () => toastSuccess("Trait recharged"),
        onError: () => toastError("Failed to recharge trait"),
        onSettled: () => setRechargingTraitId(null),
      }
    );
  }

  function handleMaintainBond(bondId: string) {
    setMaintainingBondId(bondId);
    maintainMutation.mutate(
      { bond_instance_id: bondId },
      {
        onSuccess: () => toastSuccess("Bond maintained"),
        onError: () => toastError("Failed to maintain bond"),
        onSettled: () => setMaintainingBondId(null),
      }
    );
  }

  function handleFindTime() {
    setIsFindingTime(true);
    findTimeMutation.mutate(undefined, {
      onSuccess: () => toastSuccess("Found time — 3 Plot spent, 1 Free Time gained"),
      onError: () => toastError("Failed to find time — not enough Plot"),
      onSettled: () => setIsFindingTime(false),
    });
  }

  function handleUseEffect(effectId: string) {
    setUsingEffectId(effectId);
    useEffectMutation.mutate(effectId, {
      onSuccess: () => toastSuccess("Effect used"),
      onError: () => toastError("Failed to use effect"),
      onSettled: () => setUsingEffectId(null),
    });
  }

  function handleRetireEffect(effectId: string) {
    setRetiringEffectId(effectId);
    retireEffectMutation.mutate(effectId, {
      onSuccess: () => toastSuccess("Effect retired"),
      onError: () => toastError("Failed to retire effect"),
      onSettled: () => setRetiringEffectId(null),
    });
  }

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
            {error?.message ?? "Character not found."}
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
      <MeterHeader character={character} sticky />
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

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmCharacterPage — GM's own character at /gm/character.
 *
 * - No character_id on user: show CreateCharacterForm (POST /me/character)
 * - Has character_id: render the same character sheet as the player view
 */
export default function GmCharacterPage() {
  const { characterId } = useAuth();
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(null);

  // Use locally created character ID immediately after creation
  const resolvedCharacterId = createdCharacterId ?? characterId;

  if (!resolvedCharacterId) {
    return (
      <CreateCharacterForm
        onCreated={(user) => {
          if (user.character_id) {
            setCreatedCharacterId(user.character_id);
          }
        }}
      />
    );
  }

  return <GmCharacterSheet characterId={resolvedCharacterId} />;
}
