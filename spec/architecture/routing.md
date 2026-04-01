# Routing

> Status: Deepened
> Last verified: 2026-03-26
> Related: [auth.md](auth.md), [../ui/player-views.md](../ui/player-views.md), [../ui/gm-views.md](../ui/gm-views.md)

## Route Groups

The app uses three Next.js route groups with distinct layouts:

| Group | Layout | Nav | Default Route |
|-------|--------|-----|---------------|
| `(auth)/` | Minimal, no nav | None | `/login` |
| `(player)/` | Player nav bar | Feed, Character, Proposals, World, Profile | `/` (Feed) |
| `(gm)/` | GM nav bar | Queue, Feed, World, Sessions, More | `/gm` (Queue) |

## Full Route Inventory

### Auth Routes — `(auth)/`

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Code input form |
| `/login/[code]` | LoginCodePage | Magic link deep-link, auto-submits |
| `/setup` | SetupPage | GM first-run bootstrap |
| `/join` | JoinPage | Invite redemption: display name + character name |

### Player Routes — `(player)/`

| Route | Page | Key API Calls |
|-------|------|---------------|
| `/` | PlayerFeedPage | `GET /me/feed`, `GET /me/feed/starred` |
| `/character` | CharacterSheetPage | `GET /characters/{id}`, `GET /characters/{id}/feed` |
| `/proposals` | ProposalsListPage | `GET /proposals?character_id={id}` |
| `/proposals/new` | ProposalWizardPage | `POST /proposals` |
| `/proposals/[id]` | ProposalDetailPage | `GET /proposals/{id}` |
| `/world` | WorldBrowserPage | `GET /characters`, `/groups`, `/locations`, `/stories` |
| `/world/characters/[id]` | CharacterDetailPage | `GET /characters/{id}` |
| `/world/groups/[id]` | GroupDetailPage | `GET /groups/{id}` |
| `/world/locations/[id]` | LocationDetailPage | `GET /locations/{id}` |
| `/world/stories/[id]` | StoryDetailPage | `GET /stories/{id}` |
| `/profile` | ProfilePage | `GET /me`, `GET /me/starred` |

### GM Routes — `(gm)/`

| Route | Page | Key API Calls |
|-------|------|---------------|
| `/gm` | GmQueuePage | `GET /proposals?status=pending`, `GET /gm/queue-summary` |
| `/gm/feed` | GmFeedPage | `GET /events`, `GET /me/feed/silent` |
| `/gm/world` | GmWorldPage | Multiple list endpoints |
| `/gm/world/characters/new` | GmCharacterNewPage | `POST /characters` |
| `/gm/world/characters/[id]` | GmCharacterDetailPage | `GET /characters/{id}` |
| `/gm/world/characters/[id]/edit` | GmCharacterEditPage | `PATCH /characters/{id}`, `POST /gm/actions` |
| `/gm/world/groups/new` | GmGroupNewPage | `POST /groups` |
| `/gm/world/groups/[id]` | GmGroupDetailPage | `GET /groups/{id}` |
| `/gm/world/groups/[id]/edit` | GmGroupEditPage | `PATCH /groups/{id}`, `POST /gm/actions` |
| `/gm/world/locations/new` | GmLocationNewPage | `POST /locations` |
| `/gm/world/locations/[id]` | GmLocationDetailPage | `GET /locations/{id}` |
| `/gm/world/locations/[id]/edit` | GmLocationEditPage | `PATCH /locations/{id}`, `POST /gm/actions` |
| `/gm/sessions` | GmSessionsPage | `GET /sessions`, `POST /sessions` |
| `/gm/sessions/[id]` | GmSessionDetailPage | `GET /sessions/{id}`, `GET /sessions/{id}/timeline` |
| `/gm/players` | GmPlayersPage | `GET /players`, `GET /game/invites` |
| `/gm/templates` | GmTemplatesPage | `GET /trait-templates` |
| `/gm/clocks` | GmClocksPage | `GET /clocks` |
| `/gm/actions` | GmActionsPage | `POST /gm/actions` |
| `/gm/character` | GmCharacterPage | `GET /characters/{id}` (GM's own character) |

## Navigation

### Player Nav Bar

```
Feed | Character | Proposals | World | Profile
```

- Bottom bar on mobile (< 768px), top bar on desktop
- Badge on Proposals tab: count of approved/rejected proposals since last viewed

### GM Nav Bar

```
Queue | Feed | World | Sessions | More ▼
```

- "More" dropdown: My Character, Players, Invites, Templates, Clocks, Actions, Profile
- Bottom bar on mobile, top bar on desktop
- Badge on Queue tab: count of pending proposals

### Responsive Breakpoint

At 768px:
- Mobile: `position: fixed; bottom: 0` nav bar
- Desktop: `position: sticky; top: 0` nav bar
- Main content needs corresponding padding (bottom on mobile, top on desktop)

---

## Interrogation Decisions (2026-03-26)

### Separate Detail/Edit Routes for GM

- **Decision**: Keep `/gm/world/<entity>/[id]` and `/gm/world/<entity>/[id]/edit` as distinct pages
- **Rationale**: Browser back button works naturally. Shareable URLs for both states. Clean separation of read vs write. Avoids complex in-page edit toggling.
- **Implications**: 19 GM routes is fine — the route structure is predictable and repetitive. No modal overlays for editing.

### Standalone GM Actions Page

- **Decision**: Keep `/gm/actions` as a standalone page
- **Rationale**: Useful for batch actions and quick one-offs not tied to a specific entity (e.g., "grant FT to all PCs", "advance time_now"). Entity edit pages also offer GM actions in context, but the standalone page covers the batch/global use case.
- **Implications**: GM nav "More" dropdown includes "Actions" link

### Entity Link URL Patterns

- **Decision**: In-content entity links follow the player route structure
- **Rationale**: Feed entries, story entries, and proposal descriptions reference characters, groups, and locations. These need linkable URLs that work for both roles.
- **Pattern**:
  | Entity Type | Link URL |
  |-------------|----------|
  | Character | `/world/characters/{id}` |
  | Group | `/world/groups/{id}` |
  | Location | `/world/locations/{id}` |
  | Story | `/world/stories/{id}` |
  | Proposal | `/proposals/{id}` |
  | Session | `/gm/sessions/{id}` (GM only) |
- **Implications**: Player routes use `/world/*` paths. GM users navigating these links see the player-route version (since GM can access player routes). GM-specific edit links are only shown in GM context.

### Player World Detail: Role-Aware Components

- **Decision**: Same feature component with `isGm` prop for role-aware rendering
- **Rationale**: The API already returns filtered data for players (bond-graph visibility). One component renders what it gets. The `isGm` prop controls whether edit buttons and GM-only mechanical details are shown.
- **Pattern**: Feature components accept `isGm?: boolean`. Default is `false`. GM route pages pass `isGm={true}`.
- **Implications**: No separate player vs GM detail components in features. Reduces duplication. Player route uses `<CharacterDetail id={id} />`, GM route uses `<CharacterDetail id={id} isGm />`.

### Mobile Nav: 5 Items with Icons + Labels

- **Decision**: 5 bottom nav items for both player and GM on mobile
- **Rationale**: Standard pattern (Instagram, etc.). Icons keep it compact. 44px touch targets fit 5 items on 320px+ screens.
- **Implications**: No "More" collapse on mobile bottom nav — all 5 items are visible. GM "More" dropdown is desktop-only; on mobile, the dropdown items become part of the 5th nav item's sub-menu or a separate page.

### GM Mobile Nav Overflow

- **Decision**: 5th bottom nav item is "More" which opens a slide-up sheet/overlay listing remaining items (My Character, Players, Invites, Templates, Clocks, Actions, Profile). No full-page navigation — the overlay is quick-access.
- **Rationale**: Overlay is faster than navigating to a separate page. Keeps the user in context.
