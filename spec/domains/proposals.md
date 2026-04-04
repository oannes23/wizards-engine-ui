# Proposals

> Status: Deepened
> Last verified: 2026-03-27
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

System proposals are visually distinct in the GM queue (different card styling and icon) and pinned at the top, but not blocking — the GM can scroll past them.

### GM Queue Sort Order

Frontend sorts client-side (API returns newest-first by ULID):
1. **System proposals** pinned at top (visually distinct styling)
2. **Player proposals** sorted oldest-pending-first (FIFO — fair to players, no starvation)

### Proposal Revision Flow

When a player edits a rejected proposal (`PATCH /proposals/{id}`), the backend automatically transitions status back to `pending` and creates a `proposal.revised` event. The frontend presents this as a two-step UX: player opens edit form, makes changes, then clicks "Resubmit" (which triggers the PATCH).

The GM sees a revision count badge on resubmitted proposals (e.g., "Revised 2x") via the `revision_count` field on `ProposalResponse` (CR-014 implemented — stored on the model, no event counting needed).

### work_on_project Rider Event Pre-Fill

When the GM approves a `work_on_project` proposal that has an associated `clock_id`, the approval form pre-fills a rider event for `clock.advanced` targeting that clock. The GM can accept, modify, or remove the pre-filled rider before confirming approval.

### Action Availability by Mode

The Proposal Wizard Step 1 groups actions by availability:
- Available actions shown first (session actions during active session, downtime actions during downtime)
- Collapsed "Unavailable during [session/downtime]" section below with greyed-out actions

## Selections Schema by Action Type

### use_skill

```typescript
{
  skill: SkillName                    // one of 8 skills
  modifiers: {
    core_trait_id?: string | null     // +1d, costs 1 charge
    role_trait_id?: string | null     // +1d, costs 1 charge
    bond_id?: string | null           // +1d, costs 1 charge
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

### Narrative Requirements

- **Decision**: Narrative is required for downtime actions (`regain_gnosis`, `work_on_project`, `rest`, `new_trait`, `new_bond`) and direct actions (`recharge_trait`, `maintain_bond`). Optional for session actions (`use_skill`, `use_magic`, `charge_magic`). System proposals have auto-generated narrative stubs.
- **Rationale**: Confirmed by backend team. Narrative is player creative contribution, required where the action IS the narrative (downtime), optional where dice/mechanics are the focus (session).
- **Implications**: Proposal wizard step 2 must conditionally require narrative textarea based on action type category.

## Modifier Stacking Rule

On any single proposal: **max 1 Core Trait (+1d) + 1 Role Trait (+1d) + 1 Bond (+1d) = max +3d** on top of base dice.

The UI must enforce this constraint and show real-time dice pool preview as modifiers are added.

## Calculated Effect

The `calculated_effect` field is computed by the server via `POST /proposals/calculate` (dry-run, no side effects) and returned on the proposal response. It shows the dice pool, resource costs, and other consequences. The frontend displays this at:

- Proposal wizard Step 3 (review before submit) — via `POST /proposals/calculate`
- Proposal detail page — from `ProposalResponse.calculated_effect`
- GM queue (for review before approve/reject)

### Wizard Error Handling

- **Decision**: When `POST /proposals/calculate` returns 422, navigate back to step 2 with field-level errors parsed from `details.fields`. Step 3 is only shown after a successful calculation.
- **Rationale**: Users should fix errors at the source (step 2 form) rather than seeing cryptic errors on the review step.
- **Implications**: The calculate call should happen during the step 2 → step 3 transition. On success, proceed to step 3. On 422, stay on step 2 with highlighted errors.

### Draft Auto-Save

- **Decision**: Auto-save wizard state to browser `sessionStorage` on each step change. On re-login after session expiry, detect saved state and offer to restore.
- **Rationale**: Magic sacrifice selections are complex to rebuild. Session cookies last 1 year so expiry is rare, but the cost of auto-save is low.
- **Implications**: Wizard component saves `{action_type, selections, current_step}` to sessionStorage. On mount, check for saved state and show "Restore draft?" prompt.

### Concurrency Model

- **Decision**: Proposal optimistic locking via `updated_at` is deferred. Current model: backend re-validates resources on approval. If resources changed since submission, the system returns 409 with `force: true` retry option. No edit-level locking for the GM-approving-while-player-edits race.
- **Rationale**: The dangerous race (approving with insufficient resources) is already handled. The edit race (stale data in queue) is accepted for MVP.
- **Implications**: No `If-Unmodified-Since` or `updated_at` in PATCH requests. The 10s poll gap is an accepted race.

### Validation Rules

- **Decision**: Centralize all per-action-type required/optional field rules in this document. Narrative optionality documented above. `work_on_project` requires at least one of `story_id` or `clock_id` (client-side validation).
- **Rationale**: Single source of truth for frontend form validation.

## GM Approval

Approve body:
```typescript
{
  narrative?: string                  // optional narrative override
  gm_overrides?: {
    force?: boolean
    bond_strained?: boolean
    // ... other override flags per action type
  }
  rider_event?: GmActionRequest      // optional piggyback GM action
}
```

Most approvals should be a single click. Override options are opt-in expansions (hidden by default). The rider event is a compact GM action form embedded in the approval card.

---

## Interrogation Decisions

### Step 1: Grouped Action Cards

- **Decision**: Two sections — "Session Actions" (use_skill, use_magic, charge_magic) and "Downtime Actions" (regain_gnosis, rest, work_on_project, new_trait, new_bond). Each action as a selectable card with icon, name, and one-line description. Disabled cards with reason tooltip for unavailable actions (session actions disabled if no active session; downtime actions disabled if FT = 0).
- **Rationale**: Grouped cards make the session/downtime distinction clear. Disability reasons prevent confusion. Cards are more scannable than a dropdown.
- **Implications**: `useActiveSession()` hook determines session action availability. Character meter data determines downtime availability.

### Step 2: Embedded Sacrifice Builder for Magic

- **Decision**: Magic action forms (use_magic, charge_magic) embed the Sacrifice Builder inline as a sub-section. Form order: magic stat selector → intention + symbolism textareas → Sacrifice Builder → Modifiers. The sticky bar shows running sacrifice total + dice pool.
- **Rationale**: Inline embedding keeps the form as one continuous flow. The Sacrifice Builder is complex but integral — a separate page/modal would lose context.
- **Implications**: Sacrifice Builder component must work embedded (no full-page assumptions). See `magic.md` for Sacrifice Builder decisions.

### Modifier Selector: Three-Slot Picker

- **Decision**: Three labeled dropdown slots — "Core Trait", "Role Trait", "Bond" — each showing available options with current charges. Items with 0 charges are disabled. Live dice pool preview updates as selections change. Applies to: use_skill, use_magic, charge_magic, regain_gnosis, rest.
- **Rationale**: Three fixed slots enforce the +3d stacking rule structurally (impossible to select 2 core traits). Charge display helps players make informed decisions. Live preview gives immediate feedback.
- **Implications**: Each dropdown fetches from the character's active traits/bonds. Disabled items show "(0 charges)" label.

### Dice Pool Preview: Sticky Summary Bar

- **Decision**: Sticky bar at the bottom of Step 2 showing the running dice pool calculation (e.g., "4d = 2 base + 1 core + 1 bond") and all resource costs (FT, charges, Plot). Updates live as the form changes. "Next: Review →" button in the bar. Tapping the calculation scrolls to the modifier section.
- **Rationale**: Persistent visibility of the pool means players never lose track of the mechanical impact of their choices. Combining the preview with the Next button makes it the natural completion target.
- **Implications**: Sticky positioning with `position: sticky; bottom: 0`. Calculation is client-side (not server — server calculation happens in Step 3). For non-dice actions (new_trait, new_bond, work_on_project), bar shows costs only (e.g., "Cost: 1 FT").

### Step 3: Formatted Summary Card via Server Calculation

- **Decision**: Styled review card showing: action type header, narrative text, full dice pool breakdown, all resource costs itemized (current → post-cost for each), modifier details. For magic: full sacrifice breakdown. Submit and Back buttons. The `calculated_effect` is fetched via `POST /proposals/calculate` (CR-001 implemented). Loading state while calculating.
- **Rationale**: Server calculation is authoritative — especially for magic actions where tiered conversion is complex. CR-001 is now shipped, so no client-side estimation needed.
- **Implications**: Step 3 fires `POST /proposals/calculate` on mount. Loading spinner while waiting. 422 errors from the calculate endpoint surface as inline form errors (player goes back to fix). Submit fires `POST /proposals` with the same payload.

### GM Queue: Priority-Sorted List

- **Decision**: Single list with system proposals (resolve_trauma, resolve_clock) pinned at top with urgency/warning styling, then player proposals sorted newest-first. Each card shows: character name, action type badge, narrative preview, dice pool summary, relative timestamp. Two tabs: "Queue" (pending only) and "Recent" (approved/rejected history).
- **Rationale**: System proposals are time-sensitive and need immediate attention. Newest-first for player proposals matches the expected review flow.
- **Implications**: Queue tab polls at 10s (5s during active session). Recent tab defaults to ~20 items but supports "Load more" pagination going back indefinitely.

### GM Approval: Quick Approve + Expandable Options

- **Decision**: Each proposal card has visible [Approve] and [Reject] buttons. Clicking Approve immediately approves with no overrides (single click for the common case). An "Options" toggle reveals: narrative override textarea, gm_overrides checkboxes (force, bond_strained), and rider event mini-form. Reject opens a note textarea field.
- **Rationale**: Most approvals are straightforward — one click. The Options panel is opt-in for the ~20% of cases that need overrides or riders. Keeps the queue fast.
- **Implications**: Approve with no options: `POST /proposals/{id}/approve` with empty body. With options: includes narrative/gm_overrides/rider_event. Reject: `POST /proposals/{id}/reject` with optional `rejection_note`.

### Magic Overrides: Grouped Sub-Panel

- **Decision**: Within the Options expansion for magic proposals (use_magic, charge_magic), a "Magic Overrides" collapsible sub-section containing: `actual_stat` dropdown (override player's suggested stat), `style_bonus` number input, and for use_magic: `effect_details` form (name, description, type selector, power_level, charges for charged type). Collapsed by default.
- **Rationale**: Magic overrides are specialized and only relevant for magic proposals. Nesting them keeps the Options panel clean for non-magic proposals.
- **Implications**: Options panel conditionally renders the Magic Overrides section based on `action_type`. For charge_magic: `charges_added` and `power_boost` fields instead of `effect_details`.

### System Proposals: Inline Form Cards

- **Decision**: System proposals render as expanded cards with required inputs inline (not Approve/Reject buttons). `resolve_trauma`: bond selector dropdown (active bonds for the affected character) + trauma name + trauma description fields + [Resolve] button. `resolve_clock`: narrative textarea + [Resolve] button. Both support optional rider event. Pinned at top with warning styling.
- **Rationale**: System proposals require specific GM input — they can't be "approved" with a single click. Inline forms keep them in the queue flow rather than navigating away.
- **Implications**: `resolve_trauma` card needs the character's active bonds for the dropdown. Resolve fires `POST /proposals/{id}/approve` with the required `gm_overrides` fields.

### Rider Event: Compact GM Action Type-Selector

- **Decision**: "+Add Rider" button within the Options panel. Opens a compact version of the GM action type-selector: action type dropdown → dynamic form fields for the selected type. Shows a summary line when filled. Removable via × button.
- **Rationale**: Same pattern as standalone GM Actions but embedded. Keeps the approval flow self-contained. Most approvals won't use riders.
- **Implications**: Rider form reuses GM action form components. Rider data sent as `rider_event` in the approve request body.

### Player Proposals: Status-Filtered List

- **Decision**: Player proposals page showing their character's proposals. Filter chips: All, Pending, Approved, Rejected (with counts). Each card: action type badge, narrative preview, status badge, relative timestamp. Pending proposals show [Edit] and [Delete] buttons. Rejected proposals show the GM's rejection note and a [Revise] button.
- **Rationale**: Players need to track their proposal lifecycle. Filter chips give quick access to each status. Action buttons are contextual to status.
- **Implications**: Fetches `GET /proposals?character_id=X&status=Y`. Counts can be derived from the full list or separate count queries.

### Revise Flow: Reopen Wizard Pre-Filled

- **Decision**: Clicking "Revise" on a rejected (or "Edit" on a pending) proposal reopens the wizard at Step 2 with all previous selections pre-filled. The GM's rejection note (if any) is shown as a warning banner at the top of Step 2. Player edits and re-submits. The existing proposal is updated via `PATCH /proposals/{id}` (same ID, not a new proposal).
- **Rationale**: Pre-filling saves the player from re-entering everything. The rejection note gives context for what to fix. PATCH preserves the proposal identity in the queue.
- **Implications**: Wizard component accepts an `initialData` prop for pre-fill. PATCH endpoint triggers recalculation of `calculated_effect`.

### Discard Draft: Browser Native + Route Intercept

- **Decision**: Use `beforeunload` event for hard navigation (closing tab, URL change). For in-app navigation (clicking a link within the app), use a route-change intercept with a confirm dialog: "Discard proposal draft?" with [Keep editing] and [Discard] buttons. No auto-save to localStorage.
- **Rationale**: Standard pattern. Auto-save risks stale drafts. The wizard is quick enough to redo if accidentally discarded.
- **Implications**: Route intercept via Next.js `useRouter` events or a custom navigation guard. `beforeunload` via `useEffect` with cleanup.

### Approved Results: Expanded Result Card

- **Decision**: Approved proposals on the player list and GM queue Recent tab show an expanded result card: dice pool, costs applied (before → after for each resource), GM narrative override (if any), and rider event summary. Uses the same styled format as Step 3's review card. Rejected proposals show the rejection note.
- **Rationale**: Players want to see what happened to their proposal. The before→after display makes mechanical consequences clear. Consistent styling with Step 3.
- **Implications**: Reuses the calculated_effect renderer from Step 3. Before values require snapshot data (if not in calculated_effect, derive from the event's `changes` field).

### Proposal Notifications: Nav Badge + Toast

- **Decision**: Nav badge on the "Proposals" nav item showing count of newly approved/rejected proposals (cleared on page visit). Toast notification when polling detects a status change while the app is active ("Your proposal 'use_skill' was approved!").
- **Rationale**: Badge for passive awareness, toast for active notification. Low-overhead. No separate notification system needed.
- **Implications**: Badge count derived from polling `GET /proposals?character_id=X` and tracking which proposals the player has seen (e.g., last-seen timestamp in sessionStorage). Toast triggered by comparing previous and current poll results.

### Trait/Bond Action Forms: Select or Propose

- **Decision**: `new_trait`: Slot type selector (core/role) showing current slot usage (e.g., "1/2 slots used") → radio toggle "Pick from catalog" / "Propose custom". Catalog shows trait template cards; custom shows name + description fields. If slots are full, shows an optional "Retire existing" radio group with current traits and their charges. `new_bond`: Target type selector (character/group/location) → entity search → optional name/description fields. If at bond limit, shows "Retire existing" radio group.
- **Rationale**: Dual-mode (catalog/custom) covers both common and creative use cases. Retire selector only appears when relevant (slots full). Charges displayed on retire options help players decide which to retire.
- **Implications**: Trait template list from `GET /trait-templates`. Entity search for bonds from characters/groups/locations list endpoints. Slot limits from constants (CORE_TRAIT_LIMIT: 2, ROLE_TRAIT_LIMIT: 3, PC_BOND_LIMIT: 8).

### Work on Project Form: Story/Clock Selectors + Textarea

- **Decision**: Two optional searchable dropdowns: "Story" (active stories visible to the character) and "Clock" (active clocks). At least one should be selected (validated client-side). Large narrative textarea ("What did you do?"). **Note**: `work_on_project` does NOT auto-advance the targeted clock. The clock selector is informational — it associates the proposal with a clock for context so the GM can see which clock was targeted when deciding how to advance it separately via `modify_clock`. Add helper text beneath the clock selector: "Clock advancement is handled separately by the GM."
- **Rationale**: Direct selection of the target story/clock is clear and unambiguous. Stories and clocks are independent concepts — `work_on_project` only touches the Story (adds a narrative entry + deducts 1 FT).
- **Implications**: Story dropdown from `GET /stories?status=active`. Clock dropdown from `GET /clocks`. Both filtered by visibility.

### Wizard Access: FAB + Nav Item

- **Decision**: Floating Action Button (+ icon) on the character sheet page for quick proposal creation — the primary trigger during active play. Also a "New Proposal" button on the proposals list page. The "Proposals" item in the player nav links to the proposals list.
- **Rationale**: FAB is the fastest path to the wizard from the most-visited page (character sheet). Nav item and list page button provide alternative entry points.
- **Implications**: FAB renders in the player layout, conditionally visible on the character sheet route. Wizard opens as a full-page route (`/proposals/new`) or a slide-over panel (TBD based on mobile UX).

---

## Wizard State Management

Use `useReducer` scoped to the wizard component tree. State must survive step navigation (1→2→3→2→3). Clear on successful submission and on navigation away (with discard confirmation if non-empty).

---

## UI Responsibilities

### Proposal Wizard (`/proposals/new`)

- **Step 1**: Grouped action cards (Session / Downtime). Disabled with tooltip for unavailable actions.
- **Step 2**: Dynamic form based on action_type. Includes modifier selector, dice pool sticky bar. Magic actions embed Sacrifice Builder inline.
- **Step 3**: Formatted summary card with server-computed calculated_effect via `POST /proposals/calculate`. Submit and Back buttons.

### Player Proposals Page (`/proposals`)

- Status filter chips: All, Pending (count), Approved, Rejected
- Proposal cards: action type, narrative preview, status badge, timestamp
- Pending: [Edit] [Delete]. Rejected: rejection note + [Revise]. Approved: expanded result card.
- [+ New Proposal] button

### GM Proposal Queue (`/gm/proposals`)

- Two tabs: Queue (pending) and Recent (approved/rejected, paginated, loads more indefinitely)
- Queue: system proposals pinned at top with urgency styling, player proposals newest-first
- Proposal cards: character name, action type, narrative preview, dice pool, timestamp
- Quick [Approve] [Reject] buttons + expandable [Options] panel
- Options: narrative override, gm_overrides checkboxes, Magic Overrides sub-panel (magic only), rider event mini-form
- System proposals: inline form cards with required inputs and [Resolve] button

### Notification

- Nav badge on Proposals item for new status changes
- Toast on detected status change

### Polling

- GM Queue: 10s (5s during active session)
- Player Proposals: 15s (5s during active session)

---

## Resolved Gaps

- ~~Exact shape of `calculated_effect` per action type~~ — Fully documented in `response-shapes.md`.
- ~~Whether `POST /proposals` has a dry-run mode~~ — CR-001 implemented: `POST /proposals/calculate` returns `calculated_effect` without side effects.
- ~~Available `gm_overrides` flags per action type~~ — Fully documented in `response-shapes.md`.
