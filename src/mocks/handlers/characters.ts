import { http, HttpResponse } from "msw";
import { makeCharacter, makeNpcCharacter } from "../fixtures/characters";
import { paginatedList } from "../fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

// ── Canonical character IDs used in handlers ──────────────────────

export const PC_CHAR_ID = "01CH_A0000000000000000000";
export const NPC_CHAR_ID = "01NPC_DEFAULT00000000000";

// ── Default character fixture for handlers ────────────────────────

export function makeDefaultPcCharacter() {
  return makeCharacter({ id: PC_CHAR_ID });
}

// ── Handlers ──────────────────────────────────────────────────────

export const characterHandlers = [
  // GET /characters/{id} — full character detail
  http.get(`${API_BASE}/characters/:id`, ({ params }) => {
    const { id } = params as { id: string };
    if (id === NPC_CHAR_ID) {
      return HttpResponse.json(makeNpcCharacter({ id: NPC_CHAR_ID }));
    }
    return HttpResponse.json(makeCharacter({ id }));
  }),

  // GET /characters/{id}/feed
  http.get(`${API_BASE}/characters/:id/feed`, () => {
    return HttpResponse.json(paginatedList([]));
  }),

  // GET /sessions — active session check (returns empty by default)
  http.get(`${API_BASE}/sessions`, () => {
    return HttpResponse.json(paginatedList([]));
  }),

  // POST /characters/{id}/find-time — 3 Plot → 1 FT
  http.post(`${API_BASE}/characters/:id/find-time`, ({ params }) => {
    const { id } = params as { id: string };
    const character = makeCharacter({ id, plot: 0, free_time: 9 });
    return HttpResponse.json(character);
  }),

  // POST /characters/{id}/recharge-trait
  http.post(`${API_BASE}/characters/:id/recharge-trait`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { trait_instance_id: string };
    const base = makeCharacter({ id });
    // Update the recharged trait to full charges (5)
    const updatedTraits = base.traits!.active.map((t) =>
      t.id === body.trait_instance_id ? { ...t, charge: 5 } : t
    );
    return HttpResponse.json({
      ...base,
      free_time: (base.free_time ?? 1) - 1,
      traits: { active: updatedTraits, past: base.traits!.past },
    });
  }),

  // POST /characters/{id}/maintain-bond
  http.post(`${API_BASE}/characters/:id/maintain-bond`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { bond_instance_id: string };
    const base = makeCharacter({ id });
    // Update the bond to max charges
    const updatedBonds = base.bonds.active.map((b) =>
      b.id === body.bond_instance_id
        ? { ...b, charges: b.effective_charges_max }
        : b
    );
    return HttpResponse.json({
      ...base,
      free_time: (base.free_time ?? 1) - 1,
      bonds: { active: updatedBonds, past: base.bonds.past },
    });
  }),

  // POST /characters/{id}/effects/{effect_id}/use
  http.post(
    `${API_BASE}/characters/:id/effects/:effectId/use`,
    ({ params }) => {
      const { id, effectId } = params as { id: string; effectId: string };
      const base = makeCharacter({ id });
      const updatedEffects = base.magic_effects!.active.map((e) =>
        e.id === effectId && e.charges_current !== null
          ? { ...e, charges_current: e.charges_current - 1 }
          : e
      );
      return HttpResponse.json({
        ...base,
        magic_effects: { active: updatedEffects, past: base.magic_effects!.past },
      });
    }
  ),

  // POST /characters/{id}/effects/{effect_id}/retire
  http.post(
    `${API_BASE}/characters/:id/effects/:effectId/retire`,
    ({ params }) => {
      const { id, effectId } = params as { id: string; effectId: string };
      const base = makeCharacter({ id });
      const retiring = base.magic_effects!.active.find((e) => e.id === effectId);
      const updatedActive = base.magic_effects!.active.filter(
        (e) => e.id !== effectId
      );
      const updatedPast = retiring
        ? [...base.magic_effects!.past, { ...retiring, is_active: false }]
        : base.magic_effects!.past;
      return HttpResponse.json({
        ...base,
        magic_effects: { active: updatedActive, past: updatedPast },
        active_magic_effects_count: updatedActive.length,
      });
    }
  ),
];

// ── Error-scenario handler factories ─────────────────────────────

/** Override find-time to return 422 (insufficient plot) */
export function findTimeInsufficientPlotHandler(characterId: string) {
  return http.post(
    `${API_BASE}/characters/${characterId}/find-time`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "insufficient_plot",
            message: "Not enough Plot (need 3)",
            details: null,
          },
        },
        { status: 422 }
      )
  );
}

/** Override recharge-trait to return 422 (insufficient free time) */
export function rechargeTraitInsufficientFtHandler(characterId: string) {
  return http.post(
    `${API_BASE}/characters/${characterId}/recharge-trait`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "insufficient_free_time",
            message: "Not enough Free Time",
            details: null,
          },
        },
        { status: 422 }
      )
  );
}

/** Override maintain-bond to return 422 (insufficient free time) */
export function maintainBondInsufficientFtHandler(characterId: string) {
  return http.post(
    `${API_BASE}/characters/${characterId}/maintain-bond`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "insufficient_free_time",
            message: "Not enough Free Time",
            details: null,
          },
        },
        { status: 422 }
      )
  );
}

/** Override use-effect to return 422 (no charges) */
export function useEffectNoChargesHandler(
  characterId: string,
  effectId: string
) {
  return http.post(
    `${API_BASE}/characters/${characterId}/effects/${effectId}/use`,
    () =>
      HttpResponse.json(
        {
          error: {
            code: "no_charges",
            message: "Effect has no charges remaining",
            details: null,
          },
        },
        { status: 422 }
      )
  );
}
