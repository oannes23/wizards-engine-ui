# Groups

> Status: Draft
> Last verified: 2026-03-23
> Related: [bonds.md](bonds.md), [../api/contract.md#groups](../api/contract.md#groups)

## Overview

Groups are Game Objects representing organizations, crews, families, or guilds. They have a power tier, traits, bonds, and derived membership.

## Key Properties

- **Tier** (integer): Power level. Changed via GM `modify_group` action, not direct PATCH.
- **Traits**: Up to 10 `group_trait` slots. Descriptive only (no charges).
- **Bonds**: `group_relation` bonds to other Groups (max 7), `group_holding` bonds to Locations (unlimited).
- **Members**: Derived from bonds — any Character with a bond targeting the Group is a member. The API returns `members[]` pre-computed in the group detail response.

## Associated Clocks

Groups can have associated clocks created via `POST /groups/{id}/clocks`. These appear on the group detail view and the GM clocks page.

## UI Responsibilities

- **World Browser**: Group list with tier display, filterable by name
- **Group Detail Page**: Name, tier, description, traits list, bonds list, computed members list, associated clocks, group feed
- **GM World Management**: Create/edit group forms, manage traits and bonds via GM actions

## Known Gaps

- Whether group tier affects any game mechanics visible in the frontend, or is purely informational
