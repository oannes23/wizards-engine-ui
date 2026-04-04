# Characters

> Status: Verified
> Last verified: 2026-04-03
> Related: [bonds.md](bonds.md), [traits.md](traits.md), [magic.md](magic.md), [../api/contract.md#characters](../api/contract.md#characters)

## Overview

Characters are the primary Game Objects. Two detail levels exist: **full** (PC — Player Character) with complete mechanical depth, and **simplified** (NPC — Non-Player Character) with basic fields and bonds only. Every player owns exactly one full character; NPCs are created by the GM.

### Bond-Distance Detail Gating (Player World Browser)

Players see full entity details only for entities within 3 hops of their character (the "public" visibility tier per bond graph traversal). Entities outside that range show **name and description only** — no meters, traits, bonds, skills, magic effects, etc. GM and viewer roles always see full detail.

This requires a backend bond-distance endpoint (CR-013). The frontend renders a "minimal" variant of the character detail page when the player lacks bond proximity.

## Meters

Full characters have four resource meters:

| Meter | Range | Color | Description |
|-------|-------|-------|-------------|
| **Stress** | 0 – effective_max | `#e05545` (red) | Harm. Hitting effective max triggers trauma. |
| **Free Time** | 0 – 20 | `#34d399` (emerald) | Downtime capacity. Each downtime action costs 1. |
| **Plot** | 0 – 5 (can temporarily exceed) | `#f59e0b` (amber) | Each spent = one guaranteed success (a 6). Clamped to 5 at session end. |
| **Gnosis** | 0 – 23 | `#a78bfa` (violet) | Magical resource. Consumed as sacrifice in magic actions. |

**Effective stress max** = `STRESS_MAX (9) - trauma_count`. The API provides `effective_stress_max` on the character detail response.

### Trauma Limits

- **Decision**: Maximum 8 traumas (limited by 8 PC bond slots). Effective stress max minimum is 1. If all 8 bonds are already trauma and stress hits max again, the GM handles narratively (no mechanical rule — no auto-generated resolve_trauma). Frontend just renders whatever the backend returns.
- **Rationale**: Confirmed by backend. Physical bond slot limit prevents effective_stress_max from reaching 0.

### Meter Animation

- **Decision**: Only animate meters when the value actually changes. Compare previous and current values on each poll response — no animation if same value. This naturally handles rapid 5s active-session polling without visual noise.
- **Rationale**: Simplest debounce mechanism that covers all polling scenarios.

### Trauma Notification

- **Decision**: When polling detects stress at effective max, show a toast notification: "Your character has suffered trauma. The GM will resolve this." Plus the existing red pulsing meter gradient.
- **Rationale**: Trauma is a significant event. Toast ensures the player notices even if not watching the meter.

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

- `effective_bond_max = CHARGE_MAX - bond.degradations` (also available as `BondDisplayResponse.effective_charges_max`)
- `is_at_stress_cap = character.stress >= character.effective_stress_max`
- Trauma bond identification (filter where `is_trauma === true`)

### Polling

The player's own character sheet polls `GET /characters/{id}` at 15s (or 5s during active session). When meter values change on poll, bars animate to the new value (300ms ease-in-out).

---

## Interrogation Decisions (2026-03-26)

### Character Sheet: 6 Tabs on Mobile

- **Decision**: 6 tabbed sections — Overview, Traits, Bonds, Magic, Skills & Stats, Feed
- **Rationale**: Skills and magic stats are data-dense enough to warrant their own tab. "Overview" replaced "Resources" to include a character description block, the Find Time action, and a summary of counts (traits/bonds/effects) alongside a non-zero skill snapshot.
- **Tab order** (matches `CHARACTER_TABS` in `src/features/character/types.ts`):
  1. **Overview** — character description, Find Time action, count summary (traits/bonds/effects), non-zero skills snapshot
  2. **Traits** — Core traits (2) + role traits (3), each with charge dots + recharge button. Collapsed "Past" section.
  3. **Bonds** — Active bonds with charge dots, maintain button, trauma badges. Collapsed "Past" section.
  4. **Magic** — Active magic effects with type badge, charges, use/retire buttons. Collapsed "Past" section.
  5. **Skills & Stats** — Full SkillGrid (2×4) + MagicStatGrid (5 stats with XP bar)
  6. **Feed** — Character-specific event/story feed with "Load more"

> Implementation note (2026-04-03): tab IDs are `overview`, `traits`, `bonds`, `magic`, `skills`, `feed`. The "Skills & Stats" tab panel is keyed `skills`.

### Desktop: Three-Column Layout

- **Decision**: No tabs on desktop. Sticky MeterHeader above a three-column scrollable grid.
- **Layout** (matches `CharacterDesktopLayout.tsx`):
  ```
  ── STICKY METER HEADER (full width) ──────────────────────────────
  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
  │ Find Time btn  │   │ Core Traits    │   │ Magic Effects  │
  ├────────────────┤   │ Role Traits    │   │                │
  │ Skills (2x4)   │   │ Past Traits ▼  │   │ Past Effects ▼ │
  ├────────────────┤   ├────────────────┤   │                │
  │ Magic Stats    │   │ Bonds          │   │                │
  ├────────────────┤   │ Past Bonds ▼   │   │                │
  │ Feed           │                        │                │
  │ (fills bottom) │                        │                │
  └────────────────┘   └────────────────┘   └────────────────┘
  ```
- **Implications**: `CharacterDesktopLayout` renders with `hidden lg:grid lg:grid-cols-3`. `CharacterTabs` renders with `lg:hidden`. MeterHeader renders above both, always sticky.

> Implementation note (2026-04-03): desktop breakpoint is `lg` (1024px), not `md` (768px) as originally planned. The diagram above reflects the actual implementation in `CharacterDesktopLayout.tsx`.

### Meter Bars: Bar + Numeric

- **Decision**: Colored progress bar with current/max numeric label
- **Pattern**: `Stress [======--------] 5/9`. Bar color matches meter color. Number uses tabular figures (Inter font-variant-numeric).
- **Implications**: MeterBar component accepts `value`, `max`, `color`, `label` props.

### Stress Warning: Gradient Approach

- **Decision**: Stress bar color intensifies continuously as it fills toward effective max
- **Rationale**: Continuous visual feedback is more natural than a hard threshold. Player senses increasing danger.
- **Pattern**: At low fill, normal stress red (#e05545). As ratio approaches 1.0, color shifts brighter/more saturated and a subtle pulse animation begins at ~80% fill. At 100% (cap reached), strong pulsing border.
- **Implications**: MeterBar component for stress accepts a `warning` mode that interpolates color intensity based on fill ratio.

### Direct Actions: Inline Buttons

- **Decision**: Action buttons appear inline on their relevant items. Find Time is in the Overview tab (mobile) and in a card at the top of the left desktop column. Recharge and Maintain appear directly on each TraitItem and BondItem respectively. Use and Retire appear on MagicEffectItem.
- **Implications**: No FAB drawer was implemented. All actions are reachable by navigating to the relevant tab/column.

> Implementation note (2026-04-03): the original spec described an additional floating action button (FAB) drawer as a quick-access shortcut. This was not built in Phase 1. The inline-only pattern was sufficient for the initial character sheet. The FAB drawer can be added in a later phase if usability testing reveals a need.

### Find Time: Disable at Plot < 3

- **Decision**: Disable button when Plot < 3, show cost in label
- **Pattern**: Button label: "Find Time (3 Plot → 1 FT)". Greyed out with tooltip "Not enough Plot" when Plot < 3.
- **Implications**: Button is in the meters section on mobile Resources tab, in the left column on desktop.

### Skills Grid: 2x4 with Level Dots

- **Decision**: Two columns, four rows. Each cell shows skill name + 3 level dots (filled/empty).
- **Pattern**: `Awareness ●●○ | Finesse ●○○`. Max 3 dots matching skill max level.
- **Implications**: Reuses a generic `LevelDots` component (similar to ChargeDots but for 0-3 range).

### Magic Stats: Level + XP Bar

- **Decision**: Each stat shows name, level number, and XP progress bar (0-4 segments toward level-up at 5 XP)
- **Pattern**: `Being Lv 3 [====─] 4/5 XP`. Level is prominent, XP is secondary.
- **Implications**: A `MagicStatRow` component with level badge + mini progress bar. XP bar uses a neutral color (brand-teal-muted).

### Poll-Driven Meter Animation

- **Decision**: Animate meter changes when new poll data arrives (300ms ease-in-out)
- **Rationale**: Makes changes noticeable and feel physical. Player sees "oh, my stress went up."
- **Implications**: MeterBar uses CSS transition on width. React state update triggers the animation naturally.

### Retire Effect: Confirmation Dialog

- **Decision**: Require confirmation dialog before retiring a magic effect. **Instant effects have no interactive action buttons at all** — they are display-only once created.
- **Rationale**: Narratively significant and permanent. Design system principle #5: "show what will happen." Instant effects are one-time outcomes already consumed; there is no meaningful retire action for them.
- **Pattern**: Radix Dialog — "Retire [Effect Name]? This will permanently deactivate this effect. You will lose access to its abilities." Confirm/Cancel buttons.
- **Implications**: `MagicEffectItem` renders action buttons only when `effect_type !== "instant"`. Charged effects show Use + Retire. Permanent effects show Retire only.

> Implementation note (2026-04-03): diverges from earlier spec note that said "instant: power level + Retire button". Instant effects show power level but no buttons.

### NPC Character Page: Simplified View

- **Decision**: NPC pages show description + bonds + locations + attributes (GM only). No meters/skills/magic sections.
- **Pattern**: Check `detail_level === 'simplified'` and render a narrative-focused page. If `isGm`, show attributes as a key-value table.
- **Implications**: The character detail feature component checks `detail_level` to choose between PC and NPC layouts. Not separate components — one component, two code paths.

### Attributes Field (Resolved)

`attributes` is freeform JSON, primarily for NPC data. Rendered as a key-value editor on GM NPC edit pages. Ignored on PC pages. See `api/response-shapes.md` Interrogation Decisions for details.
