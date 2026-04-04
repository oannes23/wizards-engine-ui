import type { ClockResponse, TraitTemplateResponse } from "@/lib/api/types";

// ── Clock Fixtures ─────────────────────────────────────────────────

export function makeClock(
  overrides?: Partial<ClockResponse>
): ClockResponse {
  return {
    id: "01CLOCK_DEFAULT000000000",
    name: "Doomsday Clock",
    segments: 8,
    progress: 3,
    is_completed: false,
    associated_type: null,
    associated_id: null,
    notes: null,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export const completedClock: ClockResponse = makeClock({
  id: "01CLOCK_COMPLETED0000000",
  name: "The Heist",
  segments: 6,
  progress: 6,
  is_completed: true,
});

export const nearCompleteClock: ClockResponse = makeClock({
  id: "01CLOCK_NEAR00000000000",
  name: "Ritual Preparation",
  segments: 8,
  progress: 7,
  is_completed: false,
});

// ── Trait Template Fixtures ────────────────────────────────────────

export function makeTraitTemplate(
  overrides?: Partial<TraitTemplateResponse>
): TraitTemplateResponse {
  return {
    id: "01TEMPLATE_DEFAULT000000",
    name: "Street Rat",
    description: "Grew up on the streets, knows how to survive",
    type: "core",
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export const roleTrait: TraitTemplateResponse = makeTraitTemplate({
  id: "01TEMPLATE_ROLE00000000",
  name: "Gifted Mage",
  description: "Natural talent for magical arts",
  type: "role",
});
