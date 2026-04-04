"use client";

import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocation, useLocationFeed, useLocations } from "@/features/world/hooks/useLocations";
import { useAuth } from "@/lib/auth/useAuth";
import { EntityLink } from "@/components/ui/EntityLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedList } from "@/features/feeds/components/FeedList";
import { BreadcrumbNav, type BreadcrumbItem } from "@/features/world/components/BreadcrumbNav";
import { PresenceTiers } from "@/features/world/components/PresenceTiers";
import { useActiveSession } from "@/features/feeds/hooks/useActiveSession";
import { GAME_CONSTANTS } from "@/lib/constants";
import type { BondDisplayResponse } from "@/lib/api/types";

/**
 * Location detail page — /world/locations/[id]
 *
 * Sections: Header (breadcrumb, name, description) → Presence → Traits → Bonds → Sub-Locations → Feed
 * Bond-distance gating: players see full detail only within 3 hops.
 */
export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canViewGmContent } = useAuth();

  const { data: location, isLoading, isError } = useLocation(id);
  const { data: activeSession } = useActiveSession();
  const feedQuery = useLocationFeed(id, { activeSession: !!activeSession });

  // Fetch parent for breadcrumb if parent_id is set
  const { data: parentData } = useLocation(location?.parent_id ?? undefined);

  // Fetch all locations to find sub-locations (children) — uses list query
  const { data: allLocationsData } = useLocations({});
  const allLocations = useMemo(
    () => allLocationsData?.pages.flatMap((p) => p.items) ?? [],
    [allLocationsData]
  );

  const subLocations = useMemo(
    () => allLocations.filter((loc) => loc.parent_id === id),
    [allLocations, id]
  );

  // Build breadcrumb ancestors chain
  const ancestors = useMemo<BreadcrumbItem[]>(() => {
    if (!location?.parent_id || !parentData) return [];
    return [
      {
        id: parentData.id,
        name: parentData.name,
        href: `/world/locations/${parentData.id}`,
      },
    ];
  }, [location, parentData]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-4 pt-4 space-y-3">
        <div className="h-6 w-32 bg-bg-elevated rounded animate-pulse" />
        <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-16 bg-bg-elevated rounded-lg animate-pulse" />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="Location not found"
          description="This location may not exist or you may not have access."
        />
      </div>
    );
  }

  // Bond-distance gating
  const bondDistance = location.bond_distance;
  const showFullDetail = canViewGmContent || bondDistance === null || bondDistance <= 3;

  if (!showFullDetail) {
    return (
      <div className="flex flex-col h-full">
        <BackNav href="/world" label="World" />
        <div className="px-4 pt-4 space-y-3">
          <h1 className="font-heading text-xl font-bold text-text-primary">
            {location.name}
          </h1>
          {location.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {location.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <BackNav href="/world" label="World" />

      <div className="px-4 pt-3 pb-6 space-y-6">
        {/* Header */}
        <div>
          {ancestors.length > 0 && (
            <div className="mb-2">
              <BreadcrumbNav ancestors={ancestors} current={location.name} />
            </div>
          )}

          <h1 className="font-heading text-xl font-bold text-text-primary">
            {location.name}
          </h1>

          {location.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {location.description}
            </p>
          )}

          {canViewGmContent && location.notes && (
            <div className="mt-2 rounded-md border border-brand-navy-light bg-brand-navy/30 px-3 py-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">
                Notes (GM only)
              </p>
              <p className="text-sm text-text-primary">{location.notes}</p>
            </div>
          )}
        </div>

        {/* Presence section */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Who&apos;s Around
          </h2>
          <PresenceTiers presence={location.presence} />
        </div>

        {/* Traits */}
        <div>
          <SectionHeader
            title="Features"
            count={location.traits.length}
            limit={GAME_CONSTANTS.FEATURE_TRAIT_LIMIT}
          />
          {location.traits.length === 0 ? (
            <p className="text-sm text-text-secondary italic">No features.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {location.traits.map((trait) => (
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

        {/* Bonds */}
        <div>
          <SectionHeader title="Connections" count={location.bonds.length} />
          <BondList bonds={location.bonds} emptyText="No connections." />
        </div>

        {/* Sub-locations (only shown when children exist) */}
        {subLocations.length > 0 && (
          <div>
            <SectionHeader title="Sub-Locations" count={subLocations.length} />
            <div className="space-y-2 mt-2">
              {subLocations.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/world/locations/${sub.id}`}
                  className="block rounded-lg border border-border-default bg-bg-surface px-3 py-2 hover:bg-bg-elevated transition-colors"
                >
                  <p className="text-sm font-medium text-brand-teal hover:text-brand-teal-light">
                    {sub.name}
                  </p>
                  {sub.description && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {sub.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

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

// ── Sub-components ────────────────────────────────────────────────��

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
