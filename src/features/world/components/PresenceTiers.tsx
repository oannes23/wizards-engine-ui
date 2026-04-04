import { EntityLink } from "@/components/ui/EntityLink";
import type { GameObjectType } from "@/lib/api/types";

interface PresenceTierItem {
  id: string;
  name: string;
  type: GameObjectType;
}

interface PresenceTier {
  tier: number;
  label: string;
  items: PresenceTierItem[];
}

interface PresenceTiersProps {
  presence: PresenceTier[];
}

// Opacity per tier: 1-hop = full, 2-hop = 70%, 3-hop = 50%
const TIER_OPACITY: Record<number, string> = {
  1: "opacity-100",
  2: "opacity-70",
  3: "opacity-50",
};

/**
 * PresenceTiers — "Who's Around" section for location detail pages.
 *
 * Renders tiered entity lists with opacity degradation:
 * - Tier 1 (100% opacity): "Commonly present"
 * - Tier 2 (70% opacity): "Often present"
 * - Tier 3 (50% opacity): "Sometimes present"
 *
 * Empty tiers are hidden per spec.
 * Entity names are clickable links to their detail pages.
 */
export function PresenceTiers({ presence }: PresenceTiersProps) {
  // Filter out empty tiers
  const activeTiers = presence.filter((t) => t.items.length > 0);

  if (activeTiers.length === 0) {
    return (
      <p className="text-sm text-text-secondary italic">
        No known presence at this location.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activeTiers.map((tier) => {
        const opacityClass = TIER_OPACITY[tier.tier] ?? "opacity-50";
        return (
          <div key={tier.tier} className={opacityClass}>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              {tier.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {tier.items.map((item) => (
                <EntityLink
                  key={item.id}
                  type={item.type}
                  id={item.id}
                  name={item.name}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
