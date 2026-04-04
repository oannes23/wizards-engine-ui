"use client";

import Link from "next/link";
import { User, Building2, MapPin, BookOpen } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StarToggle } from "@/features/feeds/components/StarToggle";
import type { StoryStatus } from "@/lib/api/types";

// ── Type helpers ───────────────────────────────────────────────────

const TYPE_ICONS = {
  character: User,
  group: Building2,
  location: MapPin,
  story: BookOpen,
} as const;

const TYPE_ROUTES = {
  character: "/world/characters",
  group: "/world/groups",
  location: "/world/locations",
  story: "/world/stories",
} as const;

// ── Prop shapes ────────────────────────────────────────────────────

interface BaseCardProps {
  id: string;
  name: string;
  description?: string | null;
  /** When true, show the star toggle (StarToggle reads its own state from cache). */
  showStar?: boolean;
}

interface CharacterCardProps extends BaseCardProps {
  type: "character";
  detailLevel: "full" | "simplified";
  playerName?: string | null;
}

interface GroupCardProps extends BaseCardProps {
  type: "group";
  tier: number;
  memberCount?: number;
}

interface LocationCardProps extends BaseCardProps {
  type: "location";
  parentName?: string | null;
  traitCount?: number;
}

interface StoryCardProps extends BaseCardProps {
  type: "story";
  status: StoryStatus;
  tags?: string[];
  entryCount?: number;
}

export type GameObjectCardProps =
  | CharacterCardProps
  | GroupCardProps
  | LocationCardProps
  | StoryCardProps;

// ── Subtitle renderer per type ─────────────────────────────────────

function Subtitle(props: GameObjectCardProps) {
  switch (props.type) {
    case "character":
      return (
        <span className="text-xs text-text-secondary">
          {props.detailLevel === "simplified" ? "NPC" : "PC"}
          {props.playerName ? ` · ${props.playerName}` : ""}
        </span>
      );
    case "group":
      return (
        <span className="text-xs text-text-secondary">
          Group{props.tier !== undefined ? ` · Tier ${props.tier}` : ""}
          {props.memberCount !== undefined ? ` · ${props.memberCount} members` : ""}
        </span>
      );
    case "location":
      return (
        <span className="text-xs text-text-secondary">
          Location
          {props.parentName
            ? ` · ${props.parentName}`
            : " · (top-level)"}
          {props.traitCount !== undefined ? ` · ${props.traitCount} traits` : ""}
        </span>
      );
    case "story":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={props.status} />
          {props.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded-full bg-brand-navy-light text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      );
  }
}

// ── Main component ─────────────────────────────────────────────────

/**
 * GameObjectCard — Polymorphic list card for characters/groups/locations/stories.
 *
 * Renders a type icon, name, type-specific subtitle, description excerpt,
 * and an optional star toggle. Navigates to the entity detail page on click.
 */
export function GameObjectCard(props: GameObjectCardProps) {
  const { id, name, description, showStar } = props;
  const Icon = TYPE_ICONS[props.type];
  const href = `${TYPE_ROUTES[props.type]}/${id}`;

  // Truncate description to ~120 chars
  const excerpt =
    description && description.length > 120
      ? `${description.slice(0, 120).trimEnd()}…`
      : description;

  return (
    <div className="relative group rounded-lg border border-border-default bg-bg-surface hover:bg-bg-elevated transition-colors">
      <Link
        href={href}
        className="flex items-start gap-3 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
        aria-label={`View ${props.type}: ${name}`}
      >
        {/* Type icon */}
        <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-brand-navy-light flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand-teal" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-text-primary text-sm leading-snug truncate">
              {name}
            </h3>
          </div>

          <div className="mt-0.5">
            <Subtitle {...props} />
          </div>

          {excerpt && (
            <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
      </Link>

      {/* Star toggle — positioned top-right, outside the link */}
      {showStar && (
        <div className="absolute top-2.5 right-2.5">
          <StarToggle
            type={props.type}
            id={id}
            name={name}
          />
        </div>
      )}
    </div>
  );
}
