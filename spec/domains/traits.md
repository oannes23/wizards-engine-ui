# Traits

> Status: Deepened
> Last verified: 2026-03-26
> Related: [characters.md](characters.md), [../api/contract.md#trait-templates](../api/contract.md#trait-templates)

## Overview

Traits are descriptive/mechanical properties attached to Game Objects. Character traits (core/role) have charges and provide dice bonuses. Group and location traits are descriptive only.

## Trait Types

| Trait Type | On | Max Slots | Charges? | Notes |
|------------|-----|-----------|----------|-------|
| `core_trait` | Full Character | 2 | Yes (0–5) | +1d when invoked as modifier, costs 1 charge |
| `role_trait` | Full Character | 3 | Yes (0–5) | +1d when invoked as modifier, costs 1 charge |
| `group_trait` | Group | 10 | No | Descriptive only |
| `feature_trait` | Location | 5 | No | Descriptive only |

## Trait Templates

Traits on characters are linked to **Trait Templates** — a GM-managed catalog:

- Templates have a `type` (`core` or `role`) that is immutable after creation
- When creating a trait via `new_trait` proposal, the player selects from the template catalog or proposes a custom name/description
- Multiple characters can use the same template

## Charge Mechanics

- Start at `CHARGE_MAX (5)`
- Consumed when invoked as modifier in a proposal (+1d bonus, costs 1 charge)
- **Recharge Trait** (direct action, 1 FT): Restores to 5 charges
- Traits can be **retired** to "Past" state (`is_active: false`) — they remain visible in history but no longer provide bonuses

## Modifier Stacking Rule

On any single proposal, a player can select at most:
- 1 Core Trait (+1d)
- 1 Role Trait (+1d)
- 1 Bond (+1d)
- **= max +3d** on top of base dice

The proposal wizard must enforce this constraint in the modifier selection UI.

## UI Responsibilities

- **Character Sheet**: Trait items showing name, description, slot badge, charge dots, recharge button
- **GM Templates Page**: CRUD for trait template catalog
- **Proposal Wizard**: Trait selector for modifier (+1d) — separate pickers for core trait and role trait, each showing current charges
- **GM Actions**: `create_trait`, `modify_trait`, `retire_trait`

---

## Interrogation Decisions (2026-03-26)

### Recharge Button: Disable at Max

- **Decision**: Disable the "Recharge" button when `charge === CHARGE_MAX (5)`. Grey out with tooltip "Already at full charges".
- **Rationale**: Prevents wasting 1 FT on a backend error. Clear feedback on why the action is unavailable.
- **Implications**: Trait list item checks `charge === 5` for button disabled state.

### Past Traits: Collapsed Section

- **Decision**: Past (retired) traits are in a collapsible "Past" section, collapsed by default
- **Rationale**: Consistent with bonds pattern. Active traits are primary; past traits are history.
- **Implications**: Character sheet traits section renders `traits.active` by default, with expandable `traits.past` at the bottom.

### Trait Modifier in Proposal Wizard

- **Decision**: Show trait name + inline ChargeDots in the modifier selector. Disabled at 0 charges.
- **Rationale**: Player instantly sees remaining charges. Consistent visual language with the character sheet.
- **Implications**: Core trait picker shows up to 2 options, role trait picker up to 3. Each option renders name + ChargeDots. Items with `charge === 0` are greyed out and unselectable.

### Template Name Uniqueness: Warn

- **Decision**: Warn on duplicate template names, but allow creation
- **Rationale**: Backend allows duplicate names (templates are ULID-keyed). A yellow warning helps the GM catch accidental duplicates without being restrictive.
- **Implications**: On the GM template creation form, after name input blur, check existing templates for name match and show inline warning if found.
