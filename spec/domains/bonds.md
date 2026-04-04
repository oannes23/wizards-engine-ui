# Bonds

> Status: Verified
> Last verified: 2026-04-03
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

- **Charges** (0–5): Start at 5. Used as proposal modifier (+1d, costs 1 charge — same as core/role traits). GM can also strain bonds (−1 charge) as a consequence.
- **Degradation** (API field: `degradations`): When charges hit 0, charges auto-recharge to effective max and degradation increments by 1.
- **Effective max charges** = `CHARGE_MAX (5) - degradations`
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

## Bidirectional Bonds (Resolved)

When `bidirectional: true`:
- One database record exists (owned by the source)
- Both characters see the bond in their `bonds` list
- **Same bond `id`** on both sides — not a duplicate
- `label` is perspective-normalized (A sees `source_label`, B sees `target_label`)
- `target_id`/`target_name` always show the "other end"
- `active_bond_count` on CharacterDetailResponse counts only **outbound** pc_bond slots

**Deduplication**: If aggregating bonds across characters (e.g., relationship graph), deduplicate on `id`.

---

## Interrogation Decisions (2026-03-26)

### Bidirectional Bond Indicator

- **Decision**: Subtle arrow icon — ↔ for bidirectional, → for one-way
- **Rationale**: Quick visual signal without cluttering. Player can see at a glance which bonds are mutual.
- **Implications**: Bond list items include a small icon next to the target name

### Maintain Bond: Disable When Full

- **Decision**: Disable "Maintain" button when `charges === effective_charges_max`
- **Rationale**: Prevents wasting 1 FT on a no-op. Consistent with trait recharge disable pattern.
- **Implications**: Button checks `charges === effective_charges_max` (from `BondDisplayResponse.effective_charges_max`)

### Trauma Bond Visual Treatment

- **Decision**: Red accent border (#e05545 stress color) + "Trauma" badge. No maintain button.
- **Rationale**: Trauma bonds are permanent scars — visually distinct and immediately recognizable. Red ties them to the stress meter that triggered the trauma.
- **Implications**: Bond list item component checks `is_trauma` for conditional styling. Maintain button hidden when `is_trauma === true`.

### Past Bonds: Collapsed Section

- **Decision**: Past (retired) bonds are in a collapsible "Past" section, collapsed by default
- **Rationale**: Keeps the active bond list clean. Past bonds are historical context, not primary information.
- **Implications**: Character sheet bonds section renders `bonds.active` by default, with expandable `bonds.past` at the bottom.

### Bond Modifier in Proposal Wizard

- **Decision**: Show all active PC bonds in the modifier selector, disable those with 0 charges
- **Rationale**: Player sees the full picture and understands why some bonds are unavailable.
- **Implications**: Selector shows bond name + charge count. Bonds with `charges === 0` are greyed out and unselectable.

### ChargeDots: Display Only

- **Decision**: ChargeDots is always a pure display component — no interactive mode
- **Rationale**: Recharge and maintain actions use separate dedicated buttons. Keeps ChargeDots simple and avoids touch-target issues on small dots.
- **Implications**: No `onClick` or `interactive` prop on ChargeDots. GM edit uses MeterChange inputs (numeric +/- or set) for charge modifications via GM actions.

### Bond Click Navigation

- **Decision**: Clicking a bond navigates to the bond target's detail page, regardless of entity type (character → /world/characters/X, group → /world/groups/X, location → /world/locations/X). No bond detail page exists.
- **Rationale**: Bonds are links between entities, not standalone objects with their own pages.

### Duplicate Bond Uniqueness

- **Decision**: One active bond per (source, target) pair. API rejects duplicate active bonds with 422. Past bonds don't count against uniqueness.
- **Rationale**: Confirmed by backend. Multiple historical bonds to the same target are fine, but only one active at a time.
