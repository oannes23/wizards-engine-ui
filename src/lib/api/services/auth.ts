import { api } from "../client";
import type { MeResponse } from "../types";

export type { MeResponse };

// ── Types ──────────────────────────────────────────────────

export interface LoginResponse {
  id?: string;
  display_name?: string;
  role?: "gm" | "player" | "viewer";
  character_id?: string | null;
}

export interface SetupResponse {
  id: string;
  display_name: string;
  role: "gm";
  login_url: string;
}

export interface JoinRequest {
  code: string;
  display_name: string;
  character_name?: string;
}

export interface JoinResponse {
  id: string;
  display_name: string;
  role: "player" | "viewer";
  character_id: string | null;
}

export interface RefreshLinkResponse {
  login_url: string;
}

// ── Service Functions ──────────────────────────────────────

/** Get current authenticated user. */
export function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>("/me");
}

/** Login with a magic link code. */
export function login(code: string): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", { code });
}

/** Logout — clears the httpOnly cookie. */
export function logout(): Promise<void> {
  return api.post<void>("/auth/logout");
}

/** One-time GM bootstrap. */
export function setup(display_name: string): Promise<SetupResponse> {
  return api.post<SetupResponse>("/setup", { display_name });
}

/** Join the game via invite code. */
export function join(data: JoinRequest): Promise<JoinResponse> {
  return api.post<JoinResponse>("/game/join", data);
}

/** Rotate login code and get new magic link. */
export function refreshLink(): Promise<RefreshLinkResponse> {
  return api.post<RefreshLinkResponse>("/me/refresh-link");
}

/** Update display name. */
export function updateDisplayName(display_name: string): Promise<MeResponse> {
  return api.patch<MeResponse>("/me", { display_name });
}
