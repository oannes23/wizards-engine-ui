# Proposals

> Status: Draft
> Last verified: 2026-03-23
> Related: [characters.md](characters.md), [magic.md](magic.md), [traits.md](traits.md), [bonds.md](bonds.md), [../api/contract.md#proposals](../api/contract.md#proposals)

## Overview

The proposal workflow is the **central mechanic** of the application. Players request state changes via proposals; the GM reviews and approves or rejects them; approved proposals auto-apply consequences.

## Proposal Lifecycle

```
Player submits proposal
  → status: "pending"
  → server computes calculated_effect
  → GM sees in queue

GM reviews:
  ├── Approve (optional overrides/rider) → status: "approved" → effects auto-applied → event created
  └── Reject (optional note) → status: "rejected" → player can revise and resubmit
```

Players can edit pending or rejected proposals (triggers recalculation). Players can delete pending or rejected proposals. Approved proposals cannot be modified or deleted.

## 12 Action Types

### Session Actions (during active play)

| Type | Description | Key Selections |
|------|-------------|----------------|
| `use_skill` | Roll skill dice + modifiers + plot spend | `skill`, `modifiers`, `plot_spend?` |
| `use_magic` | Sacrifice resources for magic dice | `magic_stat`, `intention`, `symbolism`, `sacrifices[]`, `modifiers` |
| `charge_magic` | Sacrifice resources to recharge/boost an effect | `effect_id`, `intention`, `symbolism`, `sacrifices[]`, `modifiers` |

### Downtime Actions (all cost 1 FT)

| Type | Description | Key Selections |
|------|-------------|----------------|
| `regain_gnosis` | Restore gnosis (3 + lowest magic stat + modifiers) | `modifiers` |
| `work_on_project` | Progress a story/project clock | `story_id?`, `clock_id?`, `narrative` |
| `rest` | Heal stress (3 base + modifiers) | `modifiers` |
| `new_trait` | Create/replace a trait | `slot_type`, `template_id?`, `proposed_name?`, `proposed_description?`, `retire_trait_id?` |
| `new_bond` | Create/replace a bond | `target_type`, `target_id`, `name?`, `description?`, `retire_bond_id?` |

### System Proposals (auto-generated, GM completes)

| Type | Trigger | GM Action |
|------|---------|-----------|
| `resolve_clock` | Clock completed | Fill in outcome narrative |
| `resolve_trauma` | Stress hit effective max | Select which bond becomes trauma |

System proposals appear at the top of the GM queue with visual urgency.

## Selections Schema by Action Type

### use_skill

```typescript
{
  skill: SkillName                    // one of 8 skills
  modifiers: {
    core_trait_id?: string | null     // +1d, costs 1 charge
    role_trait_id?: string | null     // +1d, costs 1 charge
    bond_id?: string | null           // +1d, no charge cost
  }
  plot_spend?: number                 // each = 1 guaranteed success
}
```

### use_magic

```typescript
{
  magic_stat: MagicStatName           // one of 5 stats
  intention: string                   // what the magic should accomplish
  symbolism: string                   // how the magic manifests
  sacrifices: MagicSacrifice[]        // see magic.md
  modifiers: ProposalModifiers        // same as use_skill
}
```

### charge_magic

```typescript
{
  effect_id: string                   // which active charged effect to charge/boost
  intention: string
  symbolism: string
  sacrifices: MagicSacrifice[]
  modifiers: ProposalModifiers
}
```

### regain_gnosis / rest

```typescript
{
  modifiers: ProposalModifiers        // optional trait/bond modifiers for bonus
}
```

### work_on_project

```typescript
{
  story_id?: string                   // target story (optional)
  clock_id?: string                   // target clock (optional)
  narrative: string                   // description of work done
}
```

### new_trait

```typescript
{
  slot_type: 'core_trait' | 'role_trait'
  template_id?: string                // select from catalog
  proposed_name?: string              // or propose custom
  proposed_description?: string
  retire_trait_id?: string            // optionally retire existing to make room
}
```

### new_bond

```typescript
{
  target_type: GameObjectType         // character, group, or location
  target_id: string
  name?: string
  description?: string
  retire_bond_id?: string             // optionally retire existing to make room
}
```

## Modifier Stacking Rule

On any single proposal: **max 1 Core Trait (+1d) + 1 Role Trait (+1d) + 1 Bond (+1d) = max +3d** on top of base dice.

The UI must enforce this constraint and show real-time dice pool preview as modifiers are added.

## Calculated Effect

The `calculated_effect` field is computed by the server and returned on the proposal response. It shows the dice pool, resource costs, and other consequences. The frontend displays this at:

- Proposal wizard Step 3 (review before submit)
- Proposal detail page
- GM queue (for review before approve/reject)

## Proposal Wizard (3-Step Flow)

### Step 1: Choose Action Type

- Group action types by category (Session / Downtime)
- System proposals are not player-selectable
- Disable actions the player cannot take (no active session for session actions, 0 FT for downtime actions)
- Each type shows a one-line description

### Step 2: Fill Details

- Dynamic form fields based on selected action_type
- Show character's current state alongside each selection (charges, meter values)
- Real-time dice pool preview: "Base 2d + Core Trait +1d + Bond +1d = 4d"
- Resource affordability checks: disable traits/bonds with 0 charges, show FT cost for downtime
- Narrative field: prominent textarea, not single-line input

### Step 3: Review & Submit

- Formatted summary of all selections
- Server-computed `calculated_effect` (loading state while fetching)
- Dice pool and resource costs displayed clearly
- Submit button → creates proposal with `status: "pending"`
- Back button → return to Step 2 without losing state

### Wizard State Management

Use `useReducer` scoped to the wizard component tree. State must survive step navigation. Clear on successful submission and on navigation away (with "discard draft?" confirmation if non-empty).

## GM Approval

Approve body:
```typescript
{
  narrative?: string                  // optional narrative override
  gm_overrides?: {
    force?: boolean
    bond_strained?: boolean
    // ... other override flags
  }
  rider_event?: GmActionRequest      // optional piggyback GM action
}
```

Most approvals should be a single click. Override options should be opt-in expansions (hidden by default, revealed on toggle). The rider event is a mini GM Actions form embedded in the approval card.

## Known Gaps

- Exact shape of `calculated_effect` per action type — varies, not fully documented
- Whether `POST /proposals` creates the proposal immediately or has a dry-run mode (impacts Back button behavior at Step 3)
- Available `gm_overrides` flags per action type
