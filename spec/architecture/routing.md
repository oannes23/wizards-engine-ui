# Routing

> Status: Draft
> Last verified: 2026-03-23
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
