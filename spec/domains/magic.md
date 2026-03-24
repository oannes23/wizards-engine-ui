# Magic System

> Status: Draft
> Last verified: 2026-03-23
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

### Recommended Flow

1. **Set Target**: Player selects desired dice count. Show the tiered cost table so diminishing returns are visible.
2. **Build Payment**: Running total display ("X Gnosis equivalent needed, Y provided"). Per-source controls:
   - Gnosis: slider/stepper showing current balance
   - Stress: slider with RED WARNING as approaching effective max
   - FT: slider showing (3 + lowest_magic_stat) per point
   - Bond/Trait sacrifice: binary toggle with confirmation ("This bond will be permanently retired")
   - Other: freeform text field ("GM will assign value")
3. **Confirm**: Show complete sacrifice package, total provided vs. needed, resulting dice pool

### Design Goals

- Feel like assembling a ritual, not filing a form
- Running total must be prominently visible at all times
- Stress sacrifice should feel dangerous — visual urgency increases near effective max
- Bond/trait sacrifice should feel weighty — confirmation dialog showing what will be permanently lost

## UI Responsibilities

- **Character Sheet**: Magic stats display (level pips + XP progress), magic effects list (type badge, charges, use/retire)
- **Proposal Wizard**: Sacrifice Builder for `use_magic` and `charge_magic`
- **GM Actions**: `create_effect`, `modify_effect`, `retire_effect`, `award_xp`

## Client-Side Computations

- Sacrifice total: sum of all sacrifice sources in Gnosis equivalents
- Dice count from total: inverse of N*(N+1)/2 formula (find max N where N*(N+1)/2 <= total)
- FT-to-Gnosis rate: `3 + min(magic_stats.being.level, magic_stats.wyrding.level, ...)`

## Known Gaps

- The `calculated_effect` returned by the server for magic proposals — confirm its exact shape (dice_pool, costs breakdown, etc.)
- Whether `charge_magic` can increase `charges_max` or only restore `charges_current`
