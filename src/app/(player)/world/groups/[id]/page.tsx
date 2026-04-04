"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGroup, useGroupFeed } from "@/features/world/hooks/useGroups";
import { useAuth } from "@/lib/auth/useAuth";
import { EntityLink } from "@/components/ui/EntityLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedList } from "@/features/feeds/components/FeedList";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { ClockBar } from "@/components/ui/ClockBar";
import { GAME_CONSTANTS } from "@/lib/constants";
import type { BondDisplayResponse } from "@/lib/api/types";

/**
 * Group detail page — /world/groups/[id]
 *
 * Sections: Header → Members → Traits → Bonds (Relations + Holdings) → Clocks → Feed
 * Role-aware: GM/viewer sees notes; bond-distance gating for players.
 */
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canViewGmContent } = useAuth();

  const { data: group, isLoading, isError } = useGroup(id);
  const { data: activeSession } = useActiveSession();

  const feedQuery = useGroupFeed(id, { activeSession: !!activeSession });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 space-y-3">
          <div className="h-6 w-32 bg-bg-elevated rounded animate-pulse" />
          <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
          <div className="h-16 bg-bg-elevated rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="Group not found"
          description="This group may not exist or you may not have access."
        />
      </div>
    );
  }

  // Bond-distance gating: null or <= 3 = full detail
  const bondDistance = group.bond_distance;
  const showFullDetail = canViewGmContent || bondDistance === null || bondDistance <= 3;

  if (!showFullDetail) {
    return (
      <div className="flex flex-col h-full">
        <BackNav href="/world" label="World" />
        <div className="px-4 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {group.name}
            </h1>
            <TierBadge tier={group.tier} />
          </div>
          {group.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {group.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Split bonds into relations and holdings
  const relations = group.bonds.filter((b) => b.slot_type === "group_relation");
  const holdings = group.bonds.filter((b) => b.slot_type === "group_holding");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <BackNav href="/world" label="World" />

      <div className="px-4 pt-3 pb-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {group.name}
            </h1>
            <TierBadge tier={group.tier} />
          </div>

          {group.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {group.description}
            </p>
          )}

          {canViewGmContent && group.notes && (
            <div className="mt-2 rounded-md border border-brand-navy-light bg-brand-navy/30 px-3 py-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">
                Notes (GM only)
              </p>
              <p className="text-sm text-text-primary">{group.notes}</p>
            </div>
          )}
        </div>

        {/* Members */}
        <SectionHeader
          title="Members"
          count={group.members.length}
        />
        {group.members.length === 0 ? (
          <p className="text-sm text-text-secondary italic">No members.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <EntityLink
                key={member.id}
                type="character"
                id={member.id}
                name={member.name}
              />
            ))}
          </div>
        )}

        {/* Traits */}
        <div>
          <SectionHeader
            title="Traits"
            count={group.traits.length}
            limit={GAME_CONSTANTS.GROUP_TRAIT_LIMIT}
          />
          {group.traits.length === 0 ? (
            <p className="text-sm text-text-secondary italic">No traits.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {group.traits.map((trait) => (
                <div
                  key={trait.id}
                  className="rounded-lg border border-border-default bg-bg-surface px-3 py-2"
                >
                  <p className="text-sm font-medium text-text-primary">{trait.name}</p>
                  {trait.description && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {trait.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonds — Relations */}
        <div>
          <SectionHeader
            title="Relations"
            count={relations.length}
            limit={GAME_CONSTANTS.GROUP_RELATION_LIMIT}
          />
          <BondList bonds={relations} emptyText="No relations." />
        </div>

        {/* Bonds — Holdings */}
        <div>
          <SectionHeader title="Holdings" count={holdings.length} />
          <BondList bonds={holdings} emptyText="No holdings." />
        </div>

        {/* Feed */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Activity</h2>
          <FeedList
            data={feedQuery.data}
            isLoading={feedQuery.isLoading}
            isFetchingNextPage={feedQuery.isFetchingNextPage}
            hasNextPage={feedQuery.hasNextPage}
            fetchNextPage={feedQuery.fetchNextPage}
            isError={feedQuery.isError}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

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

function TierBadge({ tier }: { tier: number }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy-light text-text-secondary font-medium">
      Tier {tier}
    </span>
  );
}

interface SectionHeaderProps {
  title: string;
  count?: number;
  limit?: number;
}

function SectionHeader({ title, count, limit }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline gap-2 mb-2">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-text-secondary">
          ({count}{limit !== undefined ? `/${limit}` : ""})
        </span>
      )}
    </div>
  );
}

function BondList({ bonds, emptyText }: { bonds: BondDisplayResponse[]; emptyText: string }) {
  if (bonds.length === 0) {
    return <p className="text-sm text-text-secondary italic">{emptyText}</p>;
  }

  return (
    <div className="space-y-2 mt-2">
      {bonds.map((bond) => (
        <div
          key={bond.id}
          className="rounded-lg border border-border-default bg-bg-surface px-3 py-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <EntityLink
              type={bond.target_type}
              id={bond.target_id}
              name={bond.target_name}
            />
            <span className="text-xs text-text-secondary">{bond.label}</span>
          </div>
          {bond.description && (
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              {bond.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Re-export ClockBar to avoid import warning (used inline below if clocks API added)
void ClockBar;
