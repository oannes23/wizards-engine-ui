# Traits

> Status: Draft
> Last verified: 2026-03-23
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

## Known Gaps

- Can a trait be recharged when it already has 5 charges? The backend likely returns an error, but confirm behavior.
