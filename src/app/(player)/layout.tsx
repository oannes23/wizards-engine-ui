"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { useAuth } from "@/lib/auth/useAuth";
import { useProposalBadge } from "@/features/proposals/hooks/useProposalBadge";
import {
  Newspaper,
  User,
  FileText,
  Globe,
  UserCircle,
} from "lucide-react";
import { ActiveSessionBanner } from "@/features/sessions/components/ActiveSessionBanner";

// ── Nav items with live badge ─────────────────────────────────────

function usePlayerNavItems(characterId: string | null | undefined) {
  const proposalBadge = useProposalBadge(characterId);

  return [
    { label: "Feed", href: "/", icon: <Newspaper className="h-5 w-5" /> },
    { label: "Character", href: "/character", icon: <User className="h-5 w-5" /> },
    {
      label: "Proposals",
      href: "/proposals",
      icon: <FileText className="h-5 w-5" />,
      badge: proposalBadge > 0 ? proposalBadge : undefined,
    },
    { label: "World", href: "/world", icon: <Globe className="h-5 w-5" /> },
    { label: "Profile", href: "/profile", icon: <UserCircle className="h-5 w-5" /> },
  ];
}

// ── Inner layout (role-guarded) ───────────────────────────────────

/**
 * PlayerLayoutInner — Layer 2 role guard.
 *
 * - user === null (expired cookie) → redirect to /login
 * - viewer role → redirect to /gm (viewers use the GM layout)
 * - GM role → allowed (GM has full visibility including player routes)
 * - player role → allowed
 */
function PlayerLayoutInner({ children }: { children: ReactNode }) {
  const { user, isLoading, isPlayer, isGm } = useAuth();
  const router = useRouter();
  const navItems = usePlayerNavItems(user?.character_id);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Cookie was present but /me returned 401 — session expired
      router.replace("/login");
      return;
    }

    if (!isPlayer && !isGm) {
      // Viewer role — redirect to GM dashboard (read-only)
      router.replace("/gm");
    }
  }, [isLoading, user, isPlayer, isGm, router]);

  // While loading or about to redirect, render nothing
  if (isLoading || !user || (!isPlayer && !isGm)) {
    return null;
  }

  return (
    <>
      <NavBar items={navItems} role="player" />
      <ActiveSessionBanner playerCharacterId={user?.character_id} />
      <main className="pb-20 md:pb-0 md:pt-0">
        {children}
      </main>
    </>
  );
}

export default function PlayerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PlayerLayoutInner>{children}</PlayerLayoutInner>
    </AuthProvider>
  );
}
