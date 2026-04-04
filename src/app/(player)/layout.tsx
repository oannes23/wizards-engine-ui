"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { useAuth } from "@/lib/auth/useAuth";
import {
  Newspaper,
  User,
  FileText,
  Globe,
  UserCircle,
} from "lucide-react";

const PLAYER_NAV_ITEMS = [
  { label: "Feed", href: "/", icon: <Newspaper className="h-5 w-5" /> },
  { label: "Character", href: "/character", icon: <User className="h-5 w-5" /> },
  { label: "Proposals", href: "/proposals", icon: <FileText className="h-5 w-5" /> },
  { label: "World", href: "/world", icon: <Globe className="h-5 w-5" /> },
  { label: "Profile", href: "/profile", icon: <UserCircle className="h-5 w-5" /> },
];

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
      <NavBar items={PLAYER_NAV_ITEMS} role="player" />
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
