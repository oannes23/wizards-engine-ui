"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { useAuth } from "@/lib/auth/useAuth";
import {
  Inbox,
  Newspaper,
  Globe,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";

const GM_NAV_ITEMS = [
  { label: "Queue", href: "/gm", icon: <Inbox className="h-5 w-5" /> },
  { label: "Feed", href: "/gm/feed", icon: <Newspaper className="h-5 w-5" /> },
  { label: "World", href: "/gm/world", icon: <Globe className="h-5 w-5" /> },
  { label: "Sessions", href: "/gm/sessions", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "More", href: "/gm/players", icon: <MoreHorizontal className="h-5 w-5" /> },
];

/**
 * GmLayoutInner — Layer 2 role guard for GM routes.
 *
 * - user === null (expired cookie) → redirect to /login
 * - player role → redirect to / (player home)
 * - GM role → allowed (full access)
 * - viewer role → allowed (read-only; action buttons hidden via canTakeGmActions)
 */
function GmLayoutInner({ children }: { children: ReactNode }) {
  const { user, isLoading, canViewGmContent, isPlayer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Cookie was present but /me returned 401 — session expired
      router.replace("/login");
      return;
    }

    if (isPlayer) {
      // Players cannot access GM routes
      router.replace("/");
    }
  }, [isLoading, user, isPlayer, router]);

  // While loading or about to redirect, render nothing
  if (isLoading || !user || isPlayer) {
    return null;
  }

  // Redundant safety net — canViewGmContent is false only for players
  // (already handled above) but guard defensively
  if (!canViewGmContent) {
    return null;
  }

  return (
    <>
      <NavBar items={GM_NAV_ITEMS} role="gm" />
      <main className="pb-20 md:pb-0 md:pt-0">
        {children}
      </main>
    </>
  );
}

export default function GmLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GmLayoutInner>{children}</GmLayoutInner>
    </AuthProvider>
  );
}
