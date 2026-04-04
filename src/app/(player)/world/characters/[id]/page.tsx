"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { useAuth } from "@/lib/auth/useAuth";
import { EntityLink } from "@/components/ui/EntityLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeterHeader } from "@/features/character/components/MeterHeader";
import { CharacterTabs } from "@/features/character/components/CharacterTabs";
import { useCharacterFeed } from "@/features/character/hooks/useCharacterFeed";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";

/**
 * Character detail page — /world/characters/[id]
 *
 * Role-aware: GM/viewer sees full detail. Players see full detail within
 * 3 bond hops (bond_distance <= 3), minimal view for bond_distance > 3.
 *
 * Reuses character sheet components (read-only — no direct action buttons).
 */
export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isGm, canViewGmContent } = useAuth();

  const { data: character, isLoading, isError } = useCharacter(id, { polling: false });
  const { data: activeSession } = useActiveSession();
  const isActiveSession = !!activeSession;

  const feedQuery = useCharacterFeed(id, { activeSession: isActiveSession });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4">
          <div className="h-6 w-32 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="px-4 pt-4 space-y-3">
          <div className="h-32 bg-bg-elevated rounded-lg animate-pulse" />
          <div className="h-12 bg-bg-elevated rounded-lg animate-pulse" />
          <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="Character not found"
          description="This character may not exist or you may not have access."
        />
      </div>
    );
  }

  // Bond-distance visibility gating
  // bond_distance: null = GM/viewer (always full), 0 = self, 1-3 = within range, 4+ = unreachable
  const bondDistance = character.bond_distance;
  const showFullDetail =
    canViewGmContent ||
    bondDistance === null ||
    bondDistance <= 3;

  // Minimal view for out-of-range characters
  if (!showFullDetail) {
    return (
      <div className="flex flex-col h-full">
        <BackNav href="/world" label="World" />
        <div className="px-4 pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="font-heading text-xl font-bold text-text-primary">
                {character.name}
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {character.detail_level === "simplified" ? "NPC" : "PC"}
              </p>
            </div>
          </div>
          {character.description && (
            <div className="rounded-lg border border-border-default bg-bg-surface p-3">
              <p className="text-sm text-text-primary leading-relaxed">
                {character.description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <BackNav href="/world" label="World" />

      {/* Meter header (PC only) */}
      {character.detail_level === "full" && character.stress !== null && (
        <MeterHeader character={character} />
      )}

      {/* Character name + description header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {character.name}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {character.detail_level === "simplified" ? "NPC" : "PC"}
            </p>
          </div>
          {isGm && (
            <span className="text-xs text-text-secondary italic">
              GM view
            </span>
          )}
        </div>

        {character.description && (
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {character.description}
          </p>
        )}

        {/* GM notes (visible only to GM/viewer) */}
        {canViewGmContent && character.notes && (
          <div className="mt-2 rounded-md border border-brand-navy-light bg-brand-navy/30 px-3 py-2">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">
              Notes (GM only)
            </p>
            <p className="text-sm text-text-primary">{character.notes}</p>
          </div>
        )}

        {/* Location presence */}
        {(character.locations.common.length > 0 ||
          character.locations.familiar.length > 0 ||
          character.locations.known.length > 0) && (
          <div className="mt-3 space-y-1">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Commonly at
            </h3>
            <div className="flex flex-wrap gap-2">
              {character.locations.common.map((loc) => (
                <EntityLink
                  key={loc.id}
                  type="location"
                  id={loc.id}
                  name={loc.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Character tabs (read-only — no action handlers passed) */}
      <CharacterTabs
        character={character}
        feedData={feedQuery.data}
        isFeedLoading={feedQuery.isLoading}
        isFeedFetchingNextPage={feedQuery.isFetchingNextPage}
        hasFeedNextPage={feedQuery.hasNextPage}
        fetchFeedNextPage={feedQuery.fetchNextPage}
        isFeedError={feedQuery.isError}
      />
    </div>
  );
}

// ── Back navigation ────────────────────────────────────────────────

function BackNav({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-3">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-teal transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}
