"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  id: string;
  name: string;
  href: string;
}

interface BreadcrumbNavProps {
  /** Ordered ancestor chain from root to direct parent (not including current item). */
  ancestors: BreadcrumbItem[];
  /** The current item (not a link — rendered as plain text at the end). */
  current: string;
}

/**
 * BreadcrumbNav — Ancestor breadcrumb trail for location hierarchy.
 *
 * If depth (ancestors + current) exceeds 4 levels, truncates the middle with
 * an ellipsis that expands on click.
 *
 * Example: City › Harbor District › The Docks
 * Truncated: City › … › Harbor District › The Docks
 */
export function BreadcrumbNav({ ancestors, current }: BreadcrumbNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalDepth = ancestors.length + 1; // +1 for current
  const shouldTruncate = totalDepth > 4 && !isExpanded;

  // When truncated: show first ancestor, ellipsis, last 2 ancestors, current
  const visibleAncestors: Array<BreadcrumbItem | { ellipsis: true }> =
    shouldTruncate && ancestors.length > 2
      ? [
          ancestors[0],
          { ellipsis: true },
          ...ancestors.slice(-2),
        ]
      : ancestors;

  if (ancestors.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-text-secondary">
      {visibleAncestors.map((item, index) => (
        <span key={"ellipsis" in item ? `ellipsis-${index}` : item.id} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-text-secondary/50 shrink-0" aria-hidden="true" />
          )}
          {"ellipsis" in item ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-text-secondary hover:text-text-primary transition-colors px-0.5"
              aria-label="Show full path"
              title="Show full path"
            >
              &hellip;
            </button>
          ) : (
            <Link
              href={item.href}
              className="hover:text-brand-teal transition-colors"
            >
              {item.name}
            </Link>
          )}
        </span>
      ))}

      {/* Current item (not a link) */}
      <span className="flex items-center gap-1">
        <ChevronRight className="h-3 w-3 text-text-secondary/50 shrink-0" aria-hidden="true" />
        <span className="text-text-primary font-medium" aria-current="page">
          {current}
        </span>
      </span>
    </nav>
  );
}
