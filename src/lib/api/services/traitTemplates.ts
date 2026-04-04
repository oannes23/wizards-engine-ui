import { api, apiFetchPaginated } from "../client";
import type { PaginatedResponse } from "../client";
import type { TraitTemplateResponse, TraitTemplateType } from "../types";

// ── Request Types ──────────────────────────────────────────────────

export interface CreateTraitTemplateRequest {
  name: string;
  description: string;
  type: TraitTemplateType;
}

export interface UpdateTraitTemplateRequest {
  name?: string;
  description?: string;
}

// ── Filters ────────────────────────────────────────────────────────

export interface TraitTemplateListFilters {
  type?: TraitTemplateType;
  include_deleted?: boolean;
  after?: string;
  limit?: number;
}

// ── Service Functions ──────────────────────────────────────────────

/** GET /trait-templates — paginated list of templates */
export function listTraitTemplates(
  filters?: TraitTemplateListFilters
): Promise<PaginatedResponse<TraitTemplateResponse>> {
  return apiFetchPaginated<TraitTemplateResponse>("/trait-templates", {
    ...(filters as Record<string, string | number | boolean | null | undefined>),
  });
}

/** GET /trait-templates/{id} — template detail */
export function getTraitTemplate(id: string): Promise<TraitTemplateResponse> {
  return api.get<TraitTemplateResponse>(`/trait-templates/${id}`);
}

/** POST /trait-templates — create template */
export function createTraitTemplate(
  body: CreateTraitTemplateRequest
): Promise<TraitTemplateResponse> {
  return api.post<TraitTemplateResponse>("/trait-templates", body);
}

/** PATCH /trait-templates/{id} — update name, description (type immutable) */
export function updateTraitTemplate(
  id: string,
  body: UpdateTraitTemplateRequest
): Promise<TraitTemplateResponse> {
  return api.patch<TraitTemplateResponse>(`/trait-templates/${id}`, body);
}

/** DELETE /trait-templates/{id} — soft-delete */
export function deleteTraitTemplate(id: string): Promise<void> {
  return api.del<void>(`/trait-templates/${id}`);
}
