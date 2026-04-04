"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableSectionProps {
  /** Section title */
  title: string;
  /** Whether the section starts expanded */
  defaultOpen?: boolean;
  /** Child content */
  children: React.ReactNode;
}

/**
 * ExpandableSection — Collapsible section with toggle.
 */
export function ExpandableSection({
  title,
  defaultOpen = false,
  children,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          px-4 py-3 bg-bg-surface
          hover:bg-bg-elevated transition-colors
          text-left
        "
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-text-primary">
          {title}
        </span>
        <ChevronDown
          className={`
            h-4 w-4 text-text-secondary transition-transform duration-200
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-bg-page">
          {children}
        </div>
      )}
    </div>
  );
}
