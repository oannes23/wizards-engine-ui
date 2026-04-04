"use client";

import { useState } from "react";
import {
  Zap,
  ChevronDown,
  User,
  Shield,
  Cpu,
} from "lucide-react";
import { EntityLink } from "@/components/ui/EntityLink";
import { formatRelativeTime } from "@/lib/utils/time";
import type { FeedEventItem } from "../types";
import type { GameObjectType } from "@/lib/api/types";

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Format an event_type string ("proposal.approved") into a human-readable label.
 * Uses title case and replaces dots/underscores with spaces.
 */
function formatEventType(eventType: string): string {
  return eventType
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(": ");
}

/**
 * Resolve a Tailwind color class for the event type badge.
 * Groups events by domain prefix for consistent coloring.
 */
function eventTypeBadgeColor(eventType: string): string {
  const domain = eventType.split(".")[0];
  switch (domain) {
    case "proposal":
      return "bg-status-pending/20 text-status-pending";
    case "character":
      return "bg-brand-blue/20 text-brand-blue-light";
    case "bond":
      return "bg-meter-gnosis/20 text-meter-gnosis";
    case "trait":
      return "bg-meter-ft/20 text-meter-ft";
    case "magic":
      return "bg-meter-gnosis/20 text-meter-gnosis";
    case "clock":
      return "bg-meter-plot/20 text-meter-plot";
    case "session":
      return "bg-status-active/20 text-status-active";
    case "player":
      return "bg-brand-teal/20 text-brand-teal";
    default:
      return "bg-bg-elevated text-text-secondary";
  }
}

function ActorIcon({ actorType }: { actorType: string }) {
  switch (actorType) {
    case "player":
      return <User className="h-3.5 w-3.5" />;
    case "gm":
      return <Shield className="h-3.5 w-3.5" />;
    case "system":
      return <Cpu className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

// ── Props ──────────────────────────────────────────────────────────

interface EventCardProps {
  /** The event feed item to display. */
  item: FeedEventItem;
  /**
   * Full EventResponse data for expanded detail.
   * When provided, enables the expandable detail section.
   */
  eventDetail?: {
    actor_type: string;
    actor_name: string | null;
    changes_summary: string | null;
    narrative: string | null;
    parent_event_id: string | null;
  };
  /** Whether this card is a rider (child event) — renders more compactly. */
  isRider?: boolean;
}

// ── Component ──────────────────────────────────────────────────────

/**
 * EventCard — Displays a single event feed item.
 *
 * Shows:
 * - Event type badge
 * - Actor information
 * - Primary target entity link(s)
 * - Narrative text
 * - Changes summary (expandable)
 * - Timestamp
 */
export function EventCard({ item, eventDetail, isRider = false }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryTargets = item.targets.filter((t) => t.is_primary);
  const secondaryTargets = item.targets.filter((t) => !t.is_primary);
  const hasDetail =
    eventDetail?.changes_summary || secondaryTargets.length > 0;

  return (
    <article
      className={`
        rounded-lg border transition-colors
        ${isRider
          ? "border-border-default bg-bg-muted ml-4"
          : item.is_own
          ? "border-brand-teal/30 bg-bg-surface"
          : "border-border-default bg-bg-surface"
        }
      `}
      aria-label={`Event: ${formatEventType(item.event_type)}`}
    >
      <div className="px-4 py-3">
        {/* Header row — type badge + actor + timestamp */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Event type badge */}
            <span
              className={`
                inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                ${eventTypeBadgeColor(item.event_type)}
              `}
            >
              <Zap className="h-3 w-3" aria-hidden="true" />
              {formatEventType(item.event_type)}
            </span>

            {/* Actor */}
            {eventDetail && eventDetail.actor_type !== "system" && eventDetail.actor_name && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <ActorIcon actorType={eventDetail.actor_type} />
                {eventDetail.actor_name}
              </span>
            )}
          </div>

          {/* Timestamp */}
          <time
            dateTime={item.timestamp}
            className="text-xs text-text-secondary whitespace-nowrap shrink-0"
            title={new Date(item.timestamp).toLocaleString()}
          >
            {formatRelativeTime(item.timestamp)}
          </time>
        </div>

        {/* Primary targets */}
        {primaryTargets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {primaryTargets.map((target) => (
              <EntityLink
                key={target.id}
                type={target.type as GameObjectType}
                id={target.id}
                name={target.id}
              />
            ))}
          </div>
        )}

        {/* Narrative */}
        {item.narrative && (
          <p className="text-sm text-text-primary leading-relaxed mb-2">
            {item.narrative}
          </p>
        )}

        {/* Expand toggle for changes summary */}
        {hasDetail && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors mt-1"
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
            {isExpanded ? "Hide details" : "Show details"}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && hasDetail && (
        <div className="px-4 pb-3 border-t border-border-default pt-2">
          {eventDetail?.changes_summary && (
            <p className="text-xs text-text-secondary font-mono">
              {eventDetail.changes_summary}
            </p>
          )}
          {secondaryTargets.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-text-secondary">Also affects:</span>
              {secondaryTargets.map((target) => (
                <EntityLink
                  key={target.id}
                  type={target.type as GameObjectType}
                  id={target.id}
                  name={target.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

