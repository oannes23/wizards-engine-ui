# Backend Change Requests — Handoff

> For the backend team. These are outstanding API changes requested by the frontend spec process.
> Full context: [backend-change-requests.md](backend-change-requests.md)
> Date: 2026-03-27

---

## Outstanding CRs

### CR-001: Proposal dry-run / pre-calculate endpoint (BLOCKING)

**What**: A new endpoint that computes `calculated_effect` for a proposal without persisting anything.

**Why**: The Proposal Wizard has a Step 3 "Review" screen that needs to show the player the server-computed dice pool, resource costs, and consequences _before_ they commit to submitting. Currently, the only way to get `calculated_effect` is to `POST /proposals` which creates a real pending proposal. This forces awkward cleanup (delete-on-back-button) and creates orphans if the user abandons the wizard.

**Proposed endpoint**:
```
POST /proposals/calculate
Auth: Any authenticated player
Body: Same shape as POST /proposals
      { character_id, action_type, narrative?, selections? }
Response: { calculated_effect: <action-type-specific object> }
```

Returns the computed effect without persisting anything. No side effects. No proposal record created.

**Calculated effect shapes already documented**: See `spec/api/response-shapes.md` → "Calculated Effect Shapes" section for the full TypeScript interfaces per action type (`UseSkillEffect`, `UseMagicEffect`, `ChargeMagicEffect`, `RegainGnosisEffect`, `RestEffect`, `WorkOnProjectEffect`, `NewTraitEffect`, `NewBondEffect`).

**Alternative**: If a stateless endpoint is hard, add a `draft` status to proposals. `POST /proposals` creates a draft, a separate `POST /proposals/{id}/submit` moves it to `pending`. Drafts can be abandoned/deleted without appearing in the GM queue.

**Frontend impact**: Step 3 of the Proposal Wizard is stubbed until this ships. Steps 1 and 2 can be built independently. MVP will use client-side estimates for non-magic actions.

---

### CR-009: Paginate story entries (HIGH)

**What**: Story entries need to be paginated, not returned inline as an unbounded array.

**Why**: `StoryDetailResponse.entries[]` is returned as a flat array in the `GET /stories/{id}` response. Stories with many entries (dozens to hundreds over a campaign) will make every story detail fetch heavy and slow. The frontend renders entries with "Load more" pagination.

**Preferred approach**: Add a new paginated endpoint:
```
GET /stories/{id}/entries
Auth: Any (visibility-filtered)
Params: ?after=<ulid>&limit=N (cursor-based, same pattern as other list endpoints)
Response: { items: StoryEntry[], next_cursor: string | null, has_more: boolean }
```

Keep the inline `entries[]` on `GET /stories/{id}` but cap it at the most recent N entries (e.g., 20) and add:
```json
{
  "entries": [...],
  "has_more_entries": true,
  "entries_cursor": "<ulid-of-oldest-inline-entry>"
}
```

**Alternative**: Just add pagination params to `GET /stories/{id}` entries inline. Less ideal — the entry list is a sub-resource and should follow the existing paginated sub-resource pattern (like `GET /sessions/{id}/timeline`).

---

## Resolved CRs (for reference)

These were resolved during the spec deepening process (2026-03-26). No backend changes needed — the documentation was clarified:

| CR | Resolution |
|----|-----------|
| CR-002 | `calculated_effect` shapes fully documented per action type |
| CR-003 | `MagicSacrifice` / `SacrificeEntry` type documented |
| CR-004 | `gm_overrides` flags enumerated per action type |
| CR-005 | `resolve_clock` / `resolve_trauma` approval schemas documented |
| CR-006 | `POST /me/character` body shape documented |
| CR-010 | Bidirectional bond representation clarified |
| CR-011 | Domain-specific error codes added to catalog |
| CR-012 | `InviteResponse` shape defined |

## Implemented CRs

| CR | Implementation |
|----|---------------|
| CR-007 | `?status=` filter on `GET /sessions` (commit 14994ee) |
| CR-008 | `character_name` added to session participants (commit 14994ee) |
