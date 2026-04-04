"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { UserRole } from "@/lib/api/types";

// ── Types ────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface NavBarProps {
  items: NavItem[];
  role: UserRole;
}

// ── Nav Bar ──────────────────────────────────────────────────────

/**
 * Responsive navigation bar.
 * - Mobile (< 768px): fixed bottom bar
 * - Desktop (>= 768px): sticky top bar
 *
 * Accepts role-specific items from the layout.
 */
export function NavBar({ items }: NavBarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sticky top bar */}
      <nav className="hidden md:flex sticky top-0 z-40 h-14 items-center justify-between bg-bg-surface border-b border-border-default px-6">
        <Link href="/" className="font-heading text-lg font-bold text-brand-teal">
          Wizards
        </Link>
        <div className="flex items-center gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-brand-navy-light text-brand-teal"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-teal text-[10px] font-bold text-bg-page px-1"
                    aria-label={`${item.label}: ${item.badge}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: fixed bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around bg-bg-surface border-t border-border-default safe-bottom">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] text-xs transition-colors
                ${isActive
                  ? "text-brand-teal"
                  : "text-text-secondary hover:text-text-primary"
                }
              `}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-teal text-[9px] font-bold text-bg-page px-0.5"
                  aria-label={`${item.label}: ${item.badge}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
