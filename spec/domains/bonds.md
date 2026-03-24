# Bonds

> Status: Draft
> Last verified: 2026-03-23
> Related: [characters.md](characters.md), [groups.md](groups.md), [locations.md](locations.md), [../glossary.md](../glossary.md)

## Overview

Every relationship in the system is a **Bond**. Bonds are directional edges connecting any two Game Objects (Character, Group, Location). The bond type is auto-inferred from the source/target pairing.

## Bond Types

| Bond Type | Source → Target | Mechanical? | Max Slots |
|-----------|----------------|-------------|-----------|
| `pc_bond` | Full Character → any | Yes (charges, degradation) | 8 |
| `npc_bond` | Simplified Character → any | No (descriptive only) | 7 |
| `group_relation` | Group → Group | No | 7 |
| `group_holding` | Group → Location | No | Unlimited |
| `location_bond` | Location → any | No | Unlimited |

## PC Bond Mechanics

PC bonds have mechanical depth:

- **Charges** (0–5): Start at 5. Used as proposal modifier (+1d, no charge cost). GM can strain bonds (−1 charge) as consequence.
- **Degradation** (integer): When charges hit 0, charges reset to effective max and degradation increments by 1.
- **Effective max charges** = `CHARGE_MAX (5) - degradation_count`
- **Maintain Bond** (direct action, 1 FT): Restores charges to effective max.

### ChargeDots Display

The ChargeDots component needs three visual states:
1. **Filled** — remaining charges
2. **Empty (available)** — spent charges, recoverable
3. **Degraded (missing)** — permanently removed positions

Example: A bond with `charges: 2, degradations: 1` displays: `[filled] [filled] [empty] [empty] [X]` (4 available positions, 1 degraded)

## Bond Graph Visibility

The bond graph determines what players can see:

| Hop Distance | Label | Visibility |
|---|---|---|
| 1-hop | Commonly present / Bonded | Direct bond |
| 2-hop | Often present / Familiar | Bond-of-bond |
| 3-hop | Sometimes present / Public | Three degrees away |

**Traversal rule**: After a non-Character node, the next hop must go through a Character (PC or NPC as intermediary).

The server computes visibility — the frontend simply renders what the API returns. Presence tiers on locations are pre-computed in the response.

## Group Membership

**Derived from bonds**: Any Character with a bond targeting a Group is a member of that Group. There is no separate membership entity. The `GroupDetailResponse.members[]` array is server-computed.

## Trauma Mechanic

When a character's Stress hits `effective_stress_max`:

1. System auto-generates a `resolve_trauma` proposal (origin: `"system"`)
2. GM fills in which existing bond becomes the trauma
3. On approval: chosen bond retires to Past, new trauma bond created (`is_trauma: true`), Stress resets to 0
4. `effective_stress_max` permanently reduced by 1

Trauma bonds are permanent scars — they cannot be retired or maintained.

## UI Responsibilities

- **Character Sheet**: Bond items with target name, type icon, charge dots, degradation count, trauma badge, maintain quick-action button
- **World Browser**: Bond connections shown on character/group/location detail pages
- **Proposal Wizard**: Bond selector for modifier (+1d) in `use_skill`, `use_magic`, `charge_magic`, `regain_gnosis`, `rest` actions
- **GM Actions**: `create_bond`, `modify_bond`, `retire_bond` via the GM actions interface

## Known Gaps

- The `bidirectional` field on bonds: when true, both entities see the bond. Confirm whether the API returns the bond from both entity perspectives or only from the source.
