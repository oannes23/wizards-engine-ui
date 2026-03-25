# Player Views

> Status: Draft
> Last verified: 2026-03-23
> Related: [components.md](components.md), [../domains/proposals.md](../domains/proposals.md), [../domains/characters.md](../domains/characters.md)

## Player Feed (`/`)

The player's home page. Tabs: **All** | **Starred**.

- All tab: `GET /me/feed` — all visible events and story entries
- Starred tab: `GET /me/feed/starred` — filtered to starred Game Objects
- FeedList with cursor pagination and "Load more"
- Polling at 20–30s

## Character Sheet (`/character`)

The most data-rich player view. Displays the player's own full character.

### Layout

**Mobile** (recommended tab structure below sticky meter header):

```
┌──────────────────────────────┐
│ Character Name               │
│ [Stress ████░░░░░ 5/8]      │
│ [FT     ████████░░ 8/20]    │
│ [Plot   ██░░░ 2/5]          │
│ [Gnosis ████████░░░░ 12/23] │
├──────────────────────────────┤
│ Resources | Traits | Magic | Feed │
├──────────────────────────────┤
│ (tab content)                │
└──────────────────────────────┘
```

- **Resources tab**: Skills grid (8 skills) + Magic stats grid (5 stats with level + XP)
- **Traits & Bonds tab**: Core traits (2 max) + Role traits (3 max) with ChargeDots + Bonds (8 max) with charges/degradation/trauma
- **Magic tab**: Magic effects list (up to 9) with type badges and use/retire buttons
- **Feed tab**: Character-specific feed

**Desktop**: Two-column. Left: meters + traits + bonds + effects. Right: skills + magic stats + feed.

### Direct Action Buttons

Contextual, not a separate page:

| Action | Location | Disabled When |
|--------|----------|---------------|
| Find Time | Near Plot meter | `plot < 3` |
| Recharge Trait | On each trait item | `free_time < 1` or `charge === 5` |
| Maintain Bond | On each bond item | `free_time < 1` or charges at effective max |
| Use Effect | On each charged effect | `charges_current === 0` |
| Retire Effect | Secondary action on each effect | — (always available, confirm dialog) |

### Polling

Poll `GET /characters/{id}` at 15–20s to pick up GM-applied changes.

## Proposals List (`/proposals`)

Player's proposals grouped by status:

- **Pending**: Proposals awaiting GM review
- **Approved**: Recently approved (with event link)
- **Rejected**: Rejected with rejection note and "Revise" link

Badge on the Proposals nav tab shows count of newly approved/rejected since last viewed.

Polling at 15–20s.

## Proposal Wizard (`/proposals/new`)

3-step wizard. See [domains/proposals.md](../domains/proposals.md) for full specification.

### Step 1: Choose Action Type

Grouped display:

**Session Actions** (require active session):
- Use Skill, Use Magic, Charge Magic

**Downtime Actions** (cost 1 FT each):
- Rest, Regain Gnosis, Work on Project, New Trait, New Bond

Disabled states for unavailable actions (no active session, 0 FT).

### Step 2: Fill Details

Dynamic form per action type. Key elements:
- Real-time dice pool preview as modifiers are added
- Character's current state shown alongside each selector
- Narrative textarea (prominent, not single-line)
- SacrificeBuilder for magic actions

### Step 3: Review & Submit

- Server-computed `calculated_effect` displayed (loading state while fetching)
- Full summary of selections
- Submit / Back buttons

### Complexity Ranking

| Action Type | Form Complexity |
|-------------|----------------|
| `use_magic` | Highest — SacrificeBuilder + modifiers + 3 text fields |
| `charge_magic` | High — SacrificeBuilder + effect selector + modifiers + 2 text fields |
| `new_trait` | Medium — template search + slot type + optional retire |
| `new_bond` | Medium — polymorphic target picker + optional retire |
| `use_skill` | Medium — skill selector + modifiers + plot spend |
| `work_on_project` | Low — story/clock picker + narrative |
| `regain_gnosis`, `rest` | Low — modifiers only |

## Proposal Detail (`/proposals/[id]`)

Single proposal view showing:
- Action type badge, status badge
- Narrative text
- Selections summary
- Calculated effect (dice pool, costs)
- Rejection note (if rejected)
- Edit button (if pending/rejected)
- Delete button (if pending/rejected)

## World Browser (`/world`)

Filterable tabs: **Characters** | **Groups** | **Locations** | **Stories**

Each tab shows a paginated list of GameObjectCards with search by name and sorting controls. Clicking a card navigates to the detail page.

Detail pages are read-only for players. They display the same data as GM detail pages but without edit controls.

## Profile (`/profile`)

- Display name (editable inline)
- Role badge
- Starred objects list (with unstar buttons)
- Refresh magic link button (with confirmation)
