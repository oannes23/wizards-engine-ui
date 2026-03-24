# Locations

> Status: Draft
> Last verified: 2026-03-23
> Related: [bonds.md](bonds.md), [../api/contract.md#locations](../api/contract.md#locations)

## Overview

Locations are Game Objects representing places in the game world. They support parent/child nesting for geographic hierarchy and have presence tiers derived from bond-graph traversal.

## Key Properties

- **Parent/child hierarchy**: Locations can nest via `parent_id`. Changed via GM actions, not direct PATCH.
- **Traits**: Up to 5 `feature_trait` slots. Descriptive only (no charges).
- **Bonds**: `location_bond` to any Game Object (unlimited).
- **Presence tiers**: Derived from bond-graph traversal. The API returns pre-computed tiers:

```json
{
  "presence": [
    {"tier": 1, "label": "Commonly present", "items": [...]},
    {"tier": 2, "label": "Often present", "items": [...]},
    {"tier": 3, "label": "Sometimes present", "items": [...]}
  ]
}
```

## Deferred Narrative Resolution

Character presence at locations is probabilistic, not declarative. The UI must use language like "commonly present at" rather than "is at." This preserves narrative ambiguity — the GM can place a character elsewhere in any given scene without contradicting the system.

## UI Responsibilities

- **World Browser**: Location list, filterable by name, sortable
- **Location Detail Page**: Name, description, parent location link, traits list, bonds list, presence tiers (grouped by tier with label), location feed
- **GM World Management**: Create/edit location forms, manage traits and bonds via GM actions

## Visual Design for Presence Tiers

Consider visual degradation by tier:
- Tier 1: Full opacity, rich detail
- Tier 2: Slightly muted
- Tier 3: Notably muted, minimal detail

This communicates bond-graph distance without breaking immersion.
