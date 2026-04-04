import { api } from "../client";
import type {
  CharacterDetailResponse,
  CharacterSummaryResponse,
  PaginatedResponse,
} from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface RechargeTraitRequest {
  trait_instance_id: string;
  narrative?: string;
}

export interface MaintainBondRequest {
  bond_instance_id: string;
  narrative?: string;
}

// ── List / Detail ──────────────────────────────────────────────────

export interface CharacterListFilters {
  detail_level?: "full" | "simplified";
  has_player?: boolean;
  include_deleted?: boolean;
  name?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  after?: string;
  limit?: number;
}

/** GET /characters — paginated list of characters */
export function listCharacters(
  filters?: CharacterListFilters
): Promise<PaginatedResponse<CharacterDetailResponse>> {
  return api.get<PaginatedResponse<CharacterDetailResponse>>(
    "/characters",
    filters as Record<string, string | number | boolean | null | undefined>
  );
}

/** GET /characters/summary — compact PC overview */
export function getCharacterSummary(): Promise<CharacterSummaryResponse> {
  return api.get<CharacterSummaryResponse>("/characters/summary");
}

/** GET /characters/{id} — full or simplified character detail */
export function getCharacter(id: string): Promise<CharacterDetailResponse> {
  return api.get<CharacterDetailResponse>(`/characters/${id}`);
}

// ── Player Direct Actions ──────────────────────────────────────────

/** POST /characters/{id}/find-time — 3 Plot → 1 FT */
export function findTime(characterId: string): Promise<CharacterDetailResponse> {
  return api.post<CharacterDetailResponse>(`/characters/${characterId}/find-time`);
}

/** POST /characters/{id}/recharge-trait — restore trait to 5 charges (1 FT) */
export function rechargeTrait(
  characterId: string,
  body: RechargeTraitRequest
): Promise<CharacterDetailResponse> {
  return api.post<CharacterDetailResponse>(
    `/characters/${characterId}/recharge-trait`,
    body
  );
}

/** POST /characters/{id}/maintain-bond — restore bond to effective max charges (1 FT) */
export function maintainBond(
  characterId: string,
  body: MaintainBondRequest
): Promise<CharacterDetailResponse> {
  return api.post<CharacterDetailResponse>(
    `/characters/${characterId}/maintain-bond`,
    body
  );
}

// ── Magic Effects ──────────────────────────────────────────────────

/** POST /characters/{id}/effects/{effect_id}/use — use charged effect (−1 charge) */
export function useEffect(
  characterId: string,
  effectId: string
): Promise<CharacterDetailResponse> {
  return api.post<CharacterDetailResponse>(
    `/characters/${characterId}/effects/${effectId}/use`
  );
}

/** POST /characters/{id}/effects/{effect_id}/retire — retire effect */
export function retireEffect(
  characterId: string,
  effectId: string
): Promise<CharacterDetailResponse> {
  return api.post<CharacterDetailResponse>(
    `/characters/${characterId}/effects/${effectId}/retire`
  );
}
