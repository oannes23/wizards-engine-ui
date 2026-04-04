"use client";

import { useState } from "react";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Zap, Clock } from "lucide-react";
import { TraitsSection } from "./TraitItem";
import { BondsSection } from "./BondItem";
import { SkillGrid } from "./SkillGrid";
import { MagicStatGrid } from "./MagicStatGrid";
import { MagicEffectsSection } from "./MagicEffectItem";
import { CHARACTER_TABS, SKILL_DISPLAY_ORDER } from "../types";
import { GAME_CONSTANTS } from "@/lib/constants";
import { FeedList } from "@/features/feeds/components/FeedList";
import type { CharacterDetailResponse, SkillName } from "@/lib/api/types";
import type { CharacterTabId } from "../types";

interface CharacterTabsProps {
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
 * CharacterTabs — mobile tab navigation for character sheet sections.
 *
 * Rendered only on mobile (hidden on lg+ screens where 3-column layout is used).
 * Tabs: Overview, Traits, Bonds, Magic, Skills & Stats, Feed
 */
export function CharacterTabs({
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
}: CharacterTabsProps) {
  const [activeTab, setActiveTab] = useState<CharacterTabId>("overview");

  const freeTime = character.free_time ?? 0;
  const plot = character.plot ?? 0;
  const activeTraits = character.traits?.active ?? [];
  const pastTraits = character.traits?.past ?? [];
  const activeBonds = character.bonds.active;
  const pastBonds = character.bonds.past;
  const coreTraits = activeTraits.filter(
    (t) => t.slot_type === "core_trait"
  );
  const roleTraits = activeTraits.filter(
    (t) => t.slot_type === "role_trait"
  );

  return (
    <div className="lg:hidden">
      {/* Tab bar */}
      <div
        className="flex border-b border-border-default bg-bg-surface overflow-x-auto"
        role="tablist"
        aria-label="Character sheet sections"
      >
        {CHARACTER_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              shrink-0 px-3 py-3 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-brand-teal text-brand-teal"
                : "border-transparent text-text-secondary hover:text-text-primary"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="p-4">
        {/* Overview tab */}
        <div
          id="tab-panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          hidden={activeTab !== "overview"}
        >
          <OverviewTab
            character={character}
            plot={plot}
            onFindTime={onFindTime}
            isFindingTime={isFindingTime}
          />
        </div>

        {/* Traits tab */}
        <div
          id="tab-panel-traits"
          role="tabpanel"
          aria-labelledby="tab-traits"
          hidden={activeTab !== "traits"}
        >
          <div className="flex flex-col gap-4">
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
          </div>
        </div>

        {/* Bonds tab */}
        <div
          id="tab-panel-bonds"
          role="tabpanel"
          aria-labelledby="tab-bonds"
          hidden={activeTab !== "bonds"}
        >
          <div className="flex flex-col gap-4">
            <BondsSection
              bonds={activeBonds}
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
        </div>

        {/* Magic tab */}
        <div
          id="tab-panel-magic"
          role="tabpanel"
          aria-labelledby="tab-magic"
          hidden={activeTab !== "magic"}
        >
          <MagicTab
            character={character}
            onUseEffect={onUseEffect}
            usingEffectId={usingEffectId}
            onRetireEffect={onRetireEffect}
            retiringEffectId={retiringEffectId}
          />
        </div>

        {/* Skills & Stats tab */}
        <div
          id="tab-panel-skills"
          role="tabpanel"
          aria-labelledby="tab-skills"
          hidden={activeTab !== "skills"}
        >
          <div className="flex flex-col gap-6">
            {character.skills && <SkillGrid skills={character.skills} />}
            {character.magic_stats && (
              <MagicStatGrid magicStats={character.magic_stats} />
            )}
          </div>
        </div>

        {/* Feed tab */}
        <div
          id="tab-panel-feed"
          role="tabpanel"
          aria-labelledby="tab-feed"
          hidden={activeTab !== "feed"}
        >
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
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────

interface OverviewTabProps {
  character: CharacterDetailResponse;
  plot: number;
  onFindTime?: () => void;
  isFindingTime?: boolean;
}

function OverviewTab({
  character,
  plot,
  onFindTime,
  isFindingTime = false,
}: OverviewTabProps) {
  const traitCount = character.active_trait_count ?? 0;
  const bondCount = character.active_bond_count ?? 0;
  const effectCount = character.active_magic_effects_count ?? 0;
  const canFindTime = plot >= 3;

  return (
    <div className="flex flex-col gap-4">
      {character.description && (
        <div className="bg-bg-surface rounded-lg border border-border-default p-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm text-text-primary leading-relaxed">
            {character.description}
          </p>
        </div>
      )}

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

      <div className="grid grid-cols-3 gap-3">
        <StatSummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Traits"
          value={traitCount}
          max={GAME_CONSTANTS.CORE_TRAIT_LIMIT + GAME_CONSTANTS.ROLE_TRAIT_LIMIT}
        />
        <StatSummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Bonds"
          value={bondCount}
          max={GAME_CONSTANTS.PC_BOND_LIMIT}
        />
        <StatSummaryCard
          icon={<Zap className="h-4 w-4" />}
          label="Effects"
          value={effectCount}
          max={GAME_CONSTANTS.MAX_ACTIVE_EFFECTS}
        />
      </div>

      {/* Skills snapshot */}
      {character.skills && (
        <div className="bg-bg-surface rounded-lg border border-border-default p-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Skills
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {SKILL_DISPLAY_ORDER.map((skillName) => {
              const level = character.skills![skillName as SkillName] ?? 0;
              if (level === 0) return null;
              return (
                <div
                  key={skillName}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-text-secondary capitalize">
                    {skillName}
                  </span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatSummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
}

function StatSummaryCard({ icon, label, value, max }: StatSummaryCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 bg-bg-surface rounded-lg border border-border-default p-3">
      <div className="text-text-secondary">{icon}</div>
      <span className="text-lg font-bold tabular-nums text-text-primary">
        {value}
      </span>
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs text-text-secondary opacity-60">/{max}</span>
    </div>
  );
}

// ── Magic Effects Tab ─────────────────────────────────────────────

interface MagicTabProps {
  character: CharacterDetailResponse;
  onUseEffect?: (effectId: string) => void;
  usingEffectId?: string | null;
  onRetireEffect?: (effectId: string) => void;
  retiringEffectId?: string | null;
}

function MagicTab({
  character,
  onUseEffect,
  usingEffectId = null,
  onRetireEffect,
  retiringEffectId = null,
}: MagicTabProps) {
  const activeEffects = character.magic_effects?.active ?? [];
  const pastEffects = character.magic_effects?.past ?? [];

  if (activeEffects.length === 0 && pastEffects.length === 0) {
    return (
      <EmptyState
        icon={<Zap className="h-8 w-8" />}
        title="No magic effects"
        description="Magic effects will appear here when created via proposals."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
