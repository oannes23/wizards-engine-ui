"use client";

import {
  createContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { MeResponse } from "@/lib/api/types";

// ── Auth Context Shape ───────────────────────────────────────────

export interface AuthState {
  user: MeResponse | null;
  isLoading: boolean;
  isGm: boolean;
  isPlayer: boolean;
  isViewer: boolean;
  canViewGmContent: boolean;
  canTakeGmActions: boolean;
  characterId: string | null;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

// ── Auth Provider ────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wraps the root layout.
 * Calls GET /me on mount to check auth state.
 * Blocks rendering of children while loading.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<MeResponse, ApiError>({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.get<MeResponse>("/me"),
    retry: (failureCount, err) => {
      // Don't retry 401s
      if (err instanceof ApiError && err.status === 401) return false;
      // Retry up to 3 times with exponential backoff (1s, 2s, 4s)
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 4000),
    staleTime: Infinity, // User identity is stable during session
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout failure is non-critical
    }
    queryClient.setQueryData(queryKeys.auth.me, null);
    queryClient.clear();
    window.location.href = "/login";
  }, [queryClient]);

  const value = useMemo<AuthState>(() => {
    const resolvedUser = user ?? null;
    return {
      user: resolvedUser,
      isLoading,
      isGm: resolvedUser?.role === "gm",
      isPlayer: resolvedUser?.role === "player",
      isViewer: resolvedUser?.role === "viewer",
      canViewGmContent: resolvedUser?.can_view_gm_content ?? false,
      canTakeGmActions: resolvedUser?.can_take_gm_actions ?? false,
      characterId: resolvedUser?.character_id ?? null,
      logout,
    };
  }, [user, isLoading, logout]);

  // Block rendering while loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Network error (not 401)
  if (error && !(error instanceof ApiError && error.status === 401)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Unable to connect
          </h1>
          <p className="text-text-secondary">
            Could not reach the server. Please check your connection and try
            again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-brand-blue px-6 py-2 text-sm font-medium text-white hover:bg-brand-blue-light transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
