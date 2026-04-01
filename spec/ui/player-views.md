# Player Views

> Status: Deepened
> Last verified: 2026-03-27
> Related: [components.md](components.md), [../domains/proposals.md](../domains/proposals.md), [../domains/characters.md](../domains/characters.md)

## Player Feed (`/`)

The player's home page. Desktop: main feed column + My Stories sidebar (sticky). Mobile: collapsible My Stories section at top + feed below.

- **All tab**: `GET /me/feed` — all visible events and story entries
- **Starred tab**: `GET /me/feed/starred` — filtered to starred Game Objects (count in tab label)
- FeedList with cursor pagination ("Load older" button)
- New item banner when scrolled down ("[N new items ↑]")
- My Stories sidebar: compact cards of active stories where player's character is an owner
- Polling at 10s normal, 5s active session

## Character Sheet (`/character`)

The most data-rich player view. Displays the player's own full character.

### Layout

**Mobile** — 5 tabs below sticky meter header:

```
┌──────────────────────────────┐
│ Character Name               │
│ [Stress ████░░░░░ 5/7]      │
│ [FT     ████████░░ 8/20]    │
│ [Plot   ██░░░ 2/5]          │
│ [Gnosis ████████░░░░ 12/23] │
├──────────────────────────────┤
│ Overview | Traits | Magic | Skills | Feed │
├──────────────────────────────┤
│ (tab content)                │
└──────────────────────────────┘
```

- **Overview tab**: Mini trait/bond summary, direct action buttons (Find Time, etc.)
- **Traits & Bonds tab**: Core traits (2 max) + Role traits (3 max) with ChargeDots + Recharge buttons. Bonds (8 max) with charges/degradation/trauma indicators + Maintain buttons. Past traits/bonds collapsed.
- **Magic tab**: Magic effects list (up to 9 active) with type badges, charges, use/retire buttons. Charged + permanent sorted, past collapsed.
- **Skills & Stats tab**: Skills grid (8 skills, 2x4) with level dot indicators. Magic stat grid (5 stats) with level + XP bar.
- **Feed tab**: Character-specific feed from `GET /characters/{id}/feed`

**Desktop** — 3-column layout:
- Left: meters + traits + bonds + effects
- Center: overview + direct actions
- Right: skills + magic stats + feed

### Direct Action Buttons

Contextual, on relevant items (not a separate page). FAB (+) for proposal wizard access.

| Action | Location | Disabled When |
|--------|----------|---------------|
| Find Time | Near Plot meter | `plot < 3` |
| Recharge Trait | On each trait item | `free_time < 1` or `charges === 5` |
| Maintain Bond | On each bond item | `free_time < 1` or charges at effective max |
| Use Effect | On each charged effect | `charges_current === 0` |
| Retire Effect | Secondary action on each effect | — (always available, ConfirmModal) |

### Polling

Poll `GET /characters/{id}` at 15s normal, 5s active session.

## Proposals List (`/proposals`)

Player's proposals with status filter chips: **All** | **Pending (N)** | **Approved** | **Rejected**

- **Pending cards**: Action type badge, narrative preview, timestamp, [Edit] [Delete]
- **Approved cards**: Expanded result card (CalculatedEffectCard) with costs applied, GM note
- **Rejected cards**: Rejection note displayed, [Revise] button

Badge on the Proposals nav tab shows count of newly approved/rejected since last viewed.

Polling at 15s normal, 5s active session.

## Proposal Wizard (`/proposals/new`)

3-step wizard. See [domains/proposals.md](../domains/proposals.md) for full specification.

### Step 1: Choose Action Type

Grouped cards: Session Actions (use_skill, use_magic, charge_magic) and Downtime Actions (regain_gnosis, rest, work_on_project, new_trait, new_bond). Disabled with tooltip for unavailable actions.

### Step 2: Fill Details

Dynamic form per action type. Three-slot modifier picker. Sticky DicePoolBar at bottom. SacrificeBuilder embedded inline for magic actions. Narrative textarea (prominent).

### Step 3: Review & Submit

Server-computed `calculated_effect` via `POST /proposals/calculate`. CalculatedEffectCard display. Submit / Back buttons.

### Complexity Ranking

| Action Type | Form Complexity |
|-------------|----------------|
| `use_magic` | Highest — SacrificeBuilder + modifiers + 3 text fields |
| `charge_magic` | High — SacrificeBuilder + effect selector + modifiers + 2 text fields |
| `new_trait` | Medium — template browse/propose + slot type + optional retire |
| `new_bond` | Medium — polymorphic target picker + optional retire |
| `use_skill` | Medium — skill selector + modifiers + plot spend |
| `work_on_project` | Low — story/clock picker + narrative |
| `regain_gnosis`, `rest` | Low — modifiers only |

## Proposal Detail (`/proposals/[id]`)

Full-page view reusing CalculatedEffectCard: action type header, status badge (prominent), narrative text, selections summary, calculated_effect formatted display. Rejection note if rejected. Edit/Delete/Revise buttons based on status.

## Sessions List (`/sessions`)

Player sessions list accessible from nav and active session banner. Reverse-chronological list of all sessions. Cards show: status badge, date, participant count, player's participation status. Join/Leave/Contribution toggle inline. Click through to shared session detail page.

Active session banner in player layout: "[Session name] active" + Join/Leave.

## World Browser (`/world`)

4-tab layout: **Characters** | **Groups** | **Locations** | **Stories**

Each tab shows a searchable paginated list of GameObjectCards (or story-specific cards for Stories). Search by name within active tab. Stories tab adds status and tag filters.

Clicking a card navigates to the shared detail page. Detail pages are read-only for players — same components as GM detail pages but without edit controls (isGm prop).

## Profile (`/profile`)

Simple settings page accessible from user avatar/icon in nav:

- Display name (inline editable)
- Role badge
- Character name link (EntityLink to own character)
- Starred objects list with unstar (×) buttons

---

## Interrogation Decisions

### Profile: Simple Settings Page

- **Decision**: Display name, role badge, character link, starred objects list with unstar buttons. No heavy customization.
- **Rationale**: MVP needs minimal profile management. Starred objects management is the main utility. Accessible from nav avatar/icon.
- **Implications**: `PATCH /me` for display name. `GET /me/starred` for list. `DELETE /me/starred/{type}/{id}` for unstar.

### Proposal Detail: Reuse CalculatedEffectCard

- **Decision**: Full-page view reusing the Step 3 review card format. Action type header, status badge, narrative, selections summary, calculated_effect display. Status-conditional buttons (Edit/Delete for pending/rejected, Revise for rejected).
- **Rationale**: Consistent with the wizard's Step 3 — players see the same format they reviewed before submitting. No new layout to learn.
- **Implications**: CalculatedEffectCard component shared between wizard Step 3 and proposal detail.

### Character Sheet Tabs: 5 from characters.md

- **Decision**: Mobile 5-tab layout: Overview, Traits & Bonds, Magic, Skills & Stats, Feed. Confirmed from the deepened characters.md spec. No Clocks tab.
- **Rationale**: 5 tabs gives each section room to breathe. Skills and magic stats together makes sense (both are "character stats"). Clocks belong on entity detail pages, not the character sheet.
- **Implications**: Reconciles the draft (4 tabs) with the deepened spec (5 tabs).

### Entity Detail Pages: Shared, Role-Aware

- **Decision**: All entity detail pages (character, group, location, story, session) are shared between GM and player. Player sees all data but no edit controls. isGm check hides: edit buttons, lifecycle controls, GM action panels, participant management (except self).
- **Rationale**: Avoids duplicating every detail page. One component with conditional rendering is simpler to maintain. This pattern was decided per-domain and is now confirmed as the universal standard.
- **Implications**: Detail page components accept isGm from auth context. No separate "player detail" vs "GM detail" components.
