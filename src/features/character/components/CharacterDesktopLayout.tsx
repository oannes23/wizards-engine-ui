"use client";

import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Clock, Zap } from "lucide-react";
import { TraitsSection } from "./TraitItem";
import { BondsSection } from "./BondItem";
import { SkillGrid } from "./SkillGrid";
import { MagicStatGrid } from "./MagicStatGrid";
import { MagicEffectsSection } from "./MagicEffectItem";
import { GAME_CONSTANTS } from "@/lib/constants";
import { FeedList } from "@/features/feeds/components/FeedList";
import type { CharacterDetailResponse } from "@/lib/api/types";

interface CharacterDesktopLayoutProps {
  character: CharacterDetailResponse;
  onRechargeTrait?: (traitId: string) => void;
  rechargingTraitId?: string | null;
  onMaintainBond?: (bondId: string) => void;
  maintainingBondId?: string | null;
  onUseEffect?: (effectId: string) => void;
  usingEffectId?: string | null;
  onRetireEffect?: (effectId: string) => void;
  retiringEffectId?: string | null;
  onFindTime?: () => void;
  isFindingTime?: boolean;
  /** Infinite query result for the character feed. */
  feedData?: Parameters<typeof FeedList>[0]["data"];
  isFeedLoading?: boolean;
  isFeedFetchingNextPage?: boolean;
  hasFeedNextPage?: boolean;
  fetchFeedNextPage?: () => void;
  isFeedError?: boolean;
}

/**
 * CharacterDesktopLayout — 3-column layout for lg+ screens.
 *
 * Layout:
 * LEFT:   Skills grid + Magic stats grid + Feed
 * MIDDLE: Core Traits + Role Traits + Bonds
 * RIGHT:  Magic Effects
 *
 * Hidden on mobile (< lg) — CharacterTabs handles mobile layout.
 */
export function CharacterDesktopLayout({
  character,
  onRechargeTrait,
  rechargingTraitId = null,
  onMaintainBond,
  maintainingBondId = null,
  onUseEffect,
  usingEffectId = null,
  onRetireEffect,
  retiringEffectId = null,
  onFindTime,
  isFindingTime = false,
  feedData,
  isFeedLoading = false,
  isFeedFetchingNextPage = false,
  hasFeedNextPage = false,
  fetchFeedNextPage,
  isFeedError = false,
}: CharacterDesktopLayoutProps) {
  const freeTime = character.free_time ?? 0;
  const plot = character.plot ?? 0;
  const canFindTime = plot >= 3;
  const activeTraits = character.traits?.active ?? [];
  const pastTraits = character.traits?.past ?? [];
  const pastBonds = character.bonds.past;
  const coreTraits = activeTraits.filter((t) => t.slot_type === "core_trait");
  const roleTraits = activeTraits.filter((t) => t.slot_type === "role_trait");
  const activeEffects = character.magic_effects?.active ?? [];
  const pastEffects = character.magic_effects?.past ?? [];

  return (
    <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:p-6">
      {/* LEFT COLUMN: Find Time + Skills + Magic Stats + Feed */}
      <div className="flex flex-col gap-6">
        {/* Find Time action */}
        <div className="bg-bg-surface rounded-lg border border-border-default p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Find Time
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                3 Plot → 1 Free Time
              </p>
            </div>
            <button
              onClick={onFindTime}
              disabled={!canFindTime || isFindingTime}
              aria-label={
                !canFindTime
                  ? "Cannot find time: not enough Plot (need 3)"
                  : "Find Time (costs 3 Plot, gains 1 Free Time)"
              }
              title={!canFindTime ? "Not enough Plot (need 3)" : "Find Time (3 Plot → 1 FT)"}
              className="
                shrink-0 flex items-center gap-1.5 rounded-md px-3 py-2
                text-sm font-medium transition-colors min-h-[36px]
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-meter-plot/20 enabled:text-meter-plot
                enabled:hover:bg-meter-plot/30
              "
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              {isFindingTime ? "Finding…" : "Find Time"}
            </button>
          </div>
        </div>

        {character.skills && <SkillGrid skills={character.skills} />}
        {character.magic_stats && (
          <MagicStatGrid magicStats={character.magic_stats} />
        )}
        <div>
          <FeedList
            data={feedData}
            isLoading={isFeedLoading}
            isFetchingNextPage={isFeedFetchingNextPage}
            hasNextPage={hasFeedNextPage}
            fetchNextPage={fetchFeedNextPage ?? (() => {})}
            isError={isFeedError}
          />
        </div>
      </div>

      {/* MIDDLE COLUMN: Traits + Bonds */}
      <div className="flex flex-col gap-6">
        <TraitsSection
          title="Core Traits"
          traits={coreTraits}
          slotLimit={GAME_CONSTANTS.CORE_TRAIT_LIMIT}
          freeTime={freeTime}
          onRecharge={onRechargeTrait}
          rechargingId={rechargingTraitId}
        />
        <TraitsSection
          title="Role Traits"
          traits={roleTraits}
          slotLimit={GAME_CONSTANTS.ROLE_TRAIT_LIMIT}
          freeTime={freeTime}
          onRecharge={onRechargeTrait}
          rechargingId={rechargingTraitId}
        />
        {pastTraits.length > 0 && (
          <ExpandableSection title={`Past Traits (${pastTraits.length})`}>
            <div className="flex flex-col gap-2 pt-1">
              {pastTraits.map((trait) => (
                <div
                  key={trait.id}
                  className="text-sm text-text-secondary opacity-60 px-1"
                >
                  {trait.name}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        <BondsSection
          bonds={character.bonds.active}
          slotLimit={GAME_CONSTANTS.PC_BOND_LIMIT}
          freeTime={freeTime}
          onMaintain={onMaintainBond}
          maintainingId={maintainingBondId}
        />
        {pastBonds.length > 0 && (
          <ExpandableSection title={`Past Bonds (${pastBonds.length})`}>
            <div className="flex flex-col gap-2 pt-1">
              {pastBonds.map((bond) => (
                <div
                  key={bond.id}
                  className="text-sm text-text-secondary opacity-60 px-1"
                >
                  {bond.target_name} — {bond.label}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}
      </div>

      {/* RIGHT COLUMN: Magic Effects */}
      <div className="flex flex-col gap-4">
        {activeEffects.length === 0 && pastEffects.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-6 w-6" />}
            title="No magic effects"
            description="Effects created via magic proposals appear here."
          />
        ) : (
          <>
            <MagicEffectsSection
              effects={activeEffects}
              onUse={onUseEffect}
              usingId={usingEffectId}
              onRetire={onRetireEffect}
              retiringId={retiringEffectId}
            />

            {pastEffects.length > 0 && (
              <ExpandableSection title={`Past Effects (${pastEffects.length})`}>
                <div className="flex flex-col gap-2 pt-1">
                  {pastEffects.map((effect) => (
                    <div
                      key={effect.id}
                      className="text-sm text-text-secondary opacity-60 px-1"
                    >
                      {effect.name}
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
