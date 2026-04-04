"use client";

import { useContext } from "react";
import { AuthContext, type AuthState } from "./AuthProvider";

/**
 * Hook to access auth state.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
