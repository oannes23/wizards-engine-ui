# Magic System

> Status: Deepened
> Last verified: 2026-03-27
> Related: [characters.md](characters.md), [proposals.md](proposals.md), [../glossary.md](../glossary.md)

## Overview

The magic system is the most mechanically complex subsystem. It involves magic stats, magic effects, and a sacrifice-based casting system with tiered dice conversion.

## Magic Stats

Five canonical stats, each with level (0–5) and XP (0–4):

`being`, `wyrding`, `summoning`, `enchanting`, `dreaming`

- XP resets to 0 on level-up (at 5 XP)
- Max level is 5
- XP awarded via GM `award_xp` action only

## Magic Effects

Created by GM on approval of magic actions (`use_magic`, `charge_magic`). Three types:

| Type | Charges | Tracked on Sheet | Notes |
|------|---------|-----------------|-------|
| `instant` | — | No | One-time, not displayed after resolution |
| `charged` | charges_current / charges_max | Yes | Player can use (−1 charge) or retire |
| `permanent` | — | Yes | Always active, power_level 1–5 |

**Max 9 active effects** per character (charged + permanent; instants don't count).

### Effect Limit UI

- **Decision**: When a character has 9 active effects, show a warning banner in the proposal wizard step 2: "You have 9/9 active effects — this spell may create a new one." Allow submission since some spells are instant (no persistent effect).
- **Rationale**: Blocking use_magic at 9 effects would prevent instant spells. The banner warns without over-restricting.

### Modifier + Sacrifice Dual-Use

- **Decision**: A player CAN use the same bond or trait as both a modifier (+1d) and a sacrifice in a single magic proposal. Both costs apply (charge cost + destruction).
- **Rationale**: Confirmed by backend. Represents dramatic "drawing every last bit of power" narrative moment. Modifier charge cost is moot since the entity is being destroyed.
- **Implications**: No UI constraint preventing dual selection. Both sacrifice builder and modifier picker allow the same entity.

### Effect Actions (Direct, No GM Approval)

- **Use Effect**: `POST /characters/{id}/effects/{id}/use` — decrements `charges_current` by 1
- **Retire Effect**: `POST /characters/{id}/effects/{id}/retire` — sets `is_active = false`

## Sacrifice System

The `use_magic` and `charge_magic` proposal types require sacrificing resources to generate dice. Players can combine multiple sacrifice types in one action.

### Sacrifice Types & Exchange Rates

| Source | Rate | Player Cost |
|--------|------|-------------|
| Gnosis | 1 Gnosis = 1 Gnosis equiv | Depletes renewable resource |
| Stress | 1 Stress = 2 Gnosis equiv | Risky (approaches trauma) |
| Free Time | 1 FT = (3 + lowest magic stat level) Gnosis equiv | Safe but expensive |
| Bond sacrifice | Flat 10 Gnosis equiv | Bond retires to Past (permanent) |
| Trait sacrifice | Flat 10 Gnosis equiv | Trait retires to Past (permanent) |
| Other (freeform) | GM-assigned value | Narrative wildcard |

### Tiered Dice Conversion

N dice costs N*(N+1)/2 total Gnosis equivalent (diminishing returns):

| Dice | Total Cost | Marginal Cost |
|------|-----------|---------------|
| 1 | 1 | 1 |
| 2 | 3 | 2 |
| 3 | 6 | 3 |
| 4 | 10 | 4 |
| 5 | 15 | 5 |

## Sacrifice Builder (UI Component)

The Sacrifice Builder is a multi-step sub-form within the proposal wizard for `use_magic` and `charge_magic`:

### Flow: Live Running Total

No target-setting step. Player adds sacrifice sources and watches the running total + resulting dice count update in real-time. Exploratory flow — lets the player figure out what they can afford.

**In addition to sacrifices**, the player selects modifiers (same stacking rule as skill rolls): up to 1 Core Trait (+1d), 1 Role Trait (+1d), 1 Bond (+1d) = max +3d on top of sacrifice dice.

```
Sacrifice Builder
─────────────────
▶ Gnosis    [+] 3 [-]    = 3 equiv
▶ Stress    [+] 1 [-]    = 2 equiv
▶ Free Time [+] 0 [-]    = 0 equiv
▶ Bond sacrifice...       = 0 equiv
▶ Trait sacrifice...      = 0 equiv
+ Add creative sacrifice...
─────────────────
Total: 5 Gnosis equiv → 2 dice

Modifiers: (same as use_skill)
  Core Trait: [select] (+1d)
  Role Trait: [select] (+1d)
  Bond:       [select] (+1d)
```

### Input Controls

- **Gnosis, Stress, FT**: Stepper buttons [+]/[-] flanking the current value. Each tap increments by 1. Shows current balance. Stress stepper uses gradient red warning as value approaches effective max.
- **Bond/Trait sacrifice**: Toggle switches. Toggling ON shows immediate confirmation dialog: "Sacrifice [Name]? This will be permanently retired." Shows 10 Gnosis equiv.
- **Other (creative sacrifice)**: Hidden behind "Add creative sacrifice..." link. Expands to a text area with note: "The GM will assign a Gnosis value. Shows as 0 equiv until approved."

### Design Goals

- Feel like assembling a ritual, not filing a form
- Running total must be prominently visible at all times — shows "Total: X equiv → N dice"
- Stress sacrifice should feel dangerous — gradient red warning intensifies as approaching effective max
- Bond/trait sacrifice should feel weighty — confirmation dialog at moment of selection, showing what will be permanently lost

## UI Responsibilities

- **Character Sheet**: Magic stats display (level pips + XP progress), magic effects list (type badge, charges, use/retire)
- **Proposal Wizard**: Sacrifice Builder for `use_magic` and `charge_magic`
- **GM Actions**: `create_effect`, `modify_effect`, `retire_effect`, `award_xp`

## Client-Side Computations

- Sacrifice total: sum of all sacrifice sources in Gnosis equivalents
- Dice count from total: inverse of N*(N+1)/2 formula (find max N where N*(N+1)/2 <= total)
- FT-to-Gnosis rate: `3 + min(magic_stats.being.level, magic_stats.wyrding.level, ...)`

## Resolved Gaps

- **`calculated_effect` shape**: Fully documented in `api/response-shapes.md`. See `UseMagicEffect` and `ChargeMagicEffect` types.
- **`charge_magic` behavior**: Backend supports both adding charges (charged effects) and boosting power level (permanent effects). MVP implements charged-only; power boost deferred.

---

## Interrogation Decisions (2026-03-27)

### Sacrifice Builder: Live Running Total

- **Decision**: No target-setting step. Player adds sacrifices and sees dice count update live.
- **Rationale**: More exploratory — player discovers what they can afford rather than committing to a target upfront.
- **Implications**: Running total shows "Total: X equiv → N dice" at all times. No next-tier hint — just current dice count.

### Sacrifice Input: Stepper Buttons

- **Decision**: [+]/[-] stepper buttons for gnosis, stress, and FT amounts
- **Rationale**: Precise for small integer ranges (0-23 gnosis, 0-9 stress). Touch-friendly. Each tap increments by 1.
- **Implications**: Each stepper shows current balance as max. Stress stepper uses gradient red warning matching character sheet stress meter.

### Bond/Trait Sacrifice Confirmation: On Toggle

- **Decision**: Confirmation dialog fires when toggling a bond/trait sacrifice ON, not deferred to submission
- **Rationale**: The weight of a permanent sacrifice should be felt at the moment of choice.
- **Pattern**: "Sacrifice [Name]? This bond/trait will be permanently retired. You will lose access to its benefits." Confirm/Cancel.

### Creative Sacrifice: Hidden by Default

- **Decision**: "Other" sacrifice type hidden behind an "Add creative sacrifice..." link
- **Rationale**: Most players use gnosis/stress/FT. The creative option is available but doesn't clutter the common case.
- **Implications**: Expands to a text area. Note explains GM assigns value. Shows 0 Gnosis equiv in total until GM approval via `style_bonus`.

### Magic Modifiers on Magic Actions

- **Decision**: `use_magic` and `charge_magic` include the same modifier selection as `use_skill` — up to 1 Core Trait (+1d), 1 Role Trait (+1d), 1 Bond (+1d)
- **Rationale**: This is the standard modifier stacking rule for all proposal types that accept modifiers. Sacrifice dice + modifier dice = total dice pool.
- **Implications**: Sacrifice Builder includes a modifier selection section below the sacrifice sources, using the same trait/bond selector components as the skill roll flow.

### Effect Type Display: Badge + Charges/Power

- **Decision**: Each magic effect shows a type badge ("Charged" / "Permanent"). Charged effects show charge dots (current/max). Permanent effects show power level badge (Lv N). Instant effects are not displayed on the character sheet.
- **Rationale**: Clear visual distinction between effect types. Charge dots reuse the existing ChargeDots component.
- **Implications**: `MagicEffectCard` component checks `effect_type` for conditional rendering.

### Charge Magic: Charged Effects Only for MVP

- **Decision**: MVP supports charging charged effects only. Power level boosting for permanent effects is deferred.
- **Rationale**: Charged effect recharging is the common case. Power boost is an edge case that can be added later.
- **Implications**: `charge_magic` in the proposal wizard shows only charged effects as targets. Backend supports both — UI just filters.

### GM Effect Creation: Prefill from Narrative

- **Decision**: Pre-fill effect name from the proposal's narrative/intention. Default effect type to "charged". GM edits freely.
- **Rationale**: Saves GM time on the most common path. Narrative often contains the effect name ("I cast a ward of protection" → effect name "Ward of Protection").
- **Implications**: GM approval form for `use_magic` populates `EffectDetails` with `name` from narrative, `effect_type: 'charged'`. All fields are editable.
