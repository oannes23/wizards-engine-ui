# Characters

> Status: Deepened
> Last verified: 2026-03-26
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

### Character Sheet: 5 Tabs on Mobile

- **Decision**: 5 tabbed sections — Resources, Traits, Bonds, Magic Effects, Feed
- **Rationale**: Traits and bonds are distinct enough to warrant separate tabs. If a future Actions tab is needed, merge Traits & Bonds back to make room.
- **Tab order**:
  1. **Resources** — 4 meter bars + skills grid + magic stats
  2. **Traits** — Core traits (2) + role traits (3), each with charge dots + recharge button. Collapsed "Past" section.
  3. **Bonds** — Active bonds with charge dots, maintain button, trauma badges. Collapsed "Past" section.
  4. **Magic Effects** — Active effects with type badge, charges, use/retire buttons. Collapsed "Past" section.
  5. **Feed** — Character-specific event/story feed with "Load more"

### Desktop: Three-Column Layout

- **Decision**: No tabs on desktop. Three-column scrollable layout.
- **Layout**:
  ```
  LEFT COLUMN           MIDDLE COLUMN         RIGHT COLUMN
  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
  │ Meters (4 bars)│   │ Core Traits    │   │ Magic Effects  │
  │                │   │ Role Traits    │   │                │
  ├────────────────┤   ├────────────────┤   │                │
  │ Skills (2x4)   │   │ Bonds          │   │                │
  ├────────────────┤   │                │   │                │
  │ Magic Stats    │   │                │   │                │
  ├────────────────┤   │                │   │                │
  │ Feed           │   │                │   │                │
  │ (fills bottom) │   │                │   │                │
  └────────────────┘   └────────────────┘   └────────────────┘
  ```
- **Implications**: Tabs component only renders on mobile (< 768px). Desktop wraps the same section components in a CSS grid.

### Meter Bars: Bar + Numeric

- **Decision**: Colored progress bar with current/max numeric label
- **Pattern**: `Stress [======--------] 5/9`. Bar color matches meter color. Number uses tabular figures (Inter font-variant-numeric).
- **Implications**: MeterBar component accepts `value`, `max`, `color`, `label` props.

### Stress Warning: Gradient Approach

- **Decision**: Stress bar color intensifies continuously as it fills toward effective max
- **Rationale**: Continuous visual feedback is more natural than a hard threshold. Player senses increasing danger.
- **Pattern**: At low fill, normal stress red (#e05545). As ratio approaches 1.0, color shifts brighter/more saturated and a subtle pulse animation begins at ~80% fill. At 100% (cap reached), strong pulsing border.
- **Implications**: MeterBar component for stress accepts a `warning` mode that interpolates color intensity based on fill ratio.

### Direct Actions: Inline + FAB Drawer

- **Decision**: Action buttons appear inline on their relevant items AND a floating action button opens a quick-action drawer listing all currently valid actions.
- **FAB drawer contents**: Lists all direct actions that are currently valid — Find Time (if Plot >= 3), plus each trait that can be recharged, each bond that can be maintained, each effect that can be used/retired. Tapping an action in the drawer either executes it (Find Time) or scrolls to the relevant item.
- **Implications**: FAB is a fixed-position button in the bottom-right corner (above mobile bottom nav). Drawer uses Radix Dialog or Sheet.

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

- **Decision**: Require confirmation dialog before retiring a magic effect
- **Rationale**: Narratively significant and permanent. Design system principle #5: "show what will happen."
- **Pattern**: Radix Dialog — "Retire [Effect Name]? This will permanently deactivate this effect. You will lose access to its abilities." Confirm/Cancel buttons.
- **Implications**: Also applies to other permanent actions: retiring a trait, sacrificing a bond (handled in proposal wizard).

### NPC Character Page: Simplified View

- **Decision**: NPC pages show description + bonds + locations + attributes (GM only). No meters/skills/magic sections.
- **Pattern**: Check `detail_level === 'simplified'` and render a narrative-focused page. If `isGm`, show attributes as a key-value table.
- **Implications**: The character detail feature component checks `detail_level` to choose between PC and NPC layouts. Not separate components — one component, two code paths.

### Attributes Field (Resolved)

`attributes` is freeform JSON, primarily for NPC data. Rendered as a key-value editor on GM NPC edit pages. Ignored on PC pages. See `api/response-shapes.md` Interrogation Decisions for details.
