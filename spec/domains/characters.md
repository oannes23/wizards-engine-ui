# Characters

> Status: Draft
> Last verified: 2026-03-23
> Related: [bonds.md](bonds.md), [traits.md](traits.md), [magic.md](magic.md), [../api/contract.md#characters](../api/contract.md#characters)

## Overview

Characters are the primary Game Objects. Two detail levels exist: **full** (PC — Player Character) with complete mechanical depth, and **simplified** (NPC — Non-Player Character) with basic fields and bonds only. Every player owns exactly one full character; NPCs are created by the GM.

## Meters

Full characters have four resource meters:

| Meter | Range | Color | Description |
|-------|-------|-------|-------------|
| **Stress** | 0 – effective_max | `#e05545` (red) | Harm. Hitting effective max triggers trauma. |
| **Free Time** | 0 – 20 | `#34d399` (emerald) | Downtime capacity. Each downtime action costs 1. |
| **Plot** | 0 – 5 (can temporarily exceed) | `#f59e0b` (amber) | Each spent = one guaranteed success (a 6). Clamped to 5 at session end. |
| **Gnosis** | 0 – 23 | `#a78bfa` (violet) | Magical resource. Consumed as sacrifice in magic actions. |

**Effective stress max** = `STRESS_MAX (9) - trauma_count`. The API provides `effective_stress_max` on the character detail response.

## Skills (8 Canonical)

Each skill has a level 0–3 that determines the base dice pool:

`awareness`, `composure`, `influence`, `finesse`, `speed`, `power`, `knowledge`, `technology`

## Magic Stats (5 Canonical)

Each has a level (0–5) and XP (0–4, resets on level-up at 5 XP):

`being`, `wyrding`, `summoning`, `enchanting`, `dreaming`

XP is awarded by the GM via the `award_xp` GM action.

## Player Direct Actions

These bypass the proposal workflow — no GM approval needed:

| Action | Endpoint | Cost | Effect |
|--------|----------|------|--------|
| Find Time | `POST /characters/{id}/find-time` | 3 Plot | +1 FT |
| Recharge Trait | `POST /characters/{id}/recharge-trait` | 1 FT | Trait charges → 5 |
| Maintain Bond | `POST /characters/{id}/maintain-bond` | 1 FT | Bond charges → effective max |
| Use Effect | `POST /characters/{id}/effects/{id}/use` | 1 charge | Effect charges −1 |
| Retire Effect | `POST /characters/{id}/effects/{id}/retire` | — | Effect is_active → false |

## UI Responsibilities

### Character Sheet Page (`/character`)

The most data-rich view. Displays all character data with inline direct action buttons.

**Recommended mobile layout** (tabbed sections below sticky meter header):
1. **Resources** — 4 meter bars + skills grid + magic stats grid
2. **Traits & Bonds** — Trait items with charge dots + bond items with charges/degradation
3. **Magic Effects** — Effect items with type badge, charges, use/retire buttons
4. **Feed** — Character-specific event/story feed

**Desktop**: Consider two-column layout. Left: meters + traits + bonds + effects. Right: skills + magic stats + feed.

### Key Computations (Client-Side)

- `effective_bond_max = CHARGE_MAX - bond.degradations`
- `is_at_stress_cap = character.stress >= character.effective_stress_max`
- Active trait/bond/effect counts (filter where `is_active === true`)
- Trauma bond identification (filter where `is_trauma === true`)

### Polling

The player's own character sheet should poll `GET /characters/{id}` at 15–20s intervals to pick up changes from GM actions during play.

## Known Gaps

- The `attributes` field on characters is a generic `Record<string, unknown>`. Its schema is not defined in the seed doc — it may be used for freeform character properties.
- The character summary endpoint (`GET /characters/summary`) returns only full characters — confirm whether it excludes deleted.
