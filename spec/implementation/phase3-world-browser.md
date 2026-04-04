# Epic 3.1 — World Browser

> Phase: 3
> Status: Complete
> Depends on: Epic 1.2
> Last verified: 2026-04-03

## Goal

Enable players and GMs to browse and explore game world objects — characters, groups, locations, and stories.

## Stories

### 3.1.1 — World Browser Page

**As a** user, **I want** to browse the game world **so that** I can explore characters, groups, locations, and stories.

**Files to create:**
- `src/app/(player)/world/page.tsx`
- `src/lib/api/services/groups.ts`
- `src/lib/api/services/locations.ts`
- `src/lib/api/services/stories.ts`

**Acceptance criteria:**
- [ ] Tabs: Characters | Groups | Locations | Stories
- [ ] Each tab shows a paginated list of GameObjectCards
- [ ] Tab state preserved during session

### 3.1.2 — GameObjectCard Component

**As a** user, **I want** consistent cards for game objects **so that** I can quickly scan lists.

**Files to create:**
- `src/features/world/GameObjectCard.tsx`

**Acceptance criteria:**
- [ ] Shared card for character, group, location with type icon
- [ ] Shows name, brief description/summary
- [ ] Character cards show detail_level badge (PC/NPC)
- [ ] Group cards show tier
- [ ] Links to detail page

### 3.1.3 — Character List & Detail

**Files to create:**
- `src/app/(player)/world/characters/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Character list with filters (detail_level, has_player, name search, sort)
- [ ] Character detail: same layout as character sheet but read-only (no direct action buttons)
- [ ] Full PC detail for full characters, simplified view for NPCs
- [ ] Star/unstar button

### 3.1.4 — Group List & Detail

**Files to create:**
- `src/app/(player)/world/groups/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Group list with name search and sort
- [ ] Group detail: name, tier, description, traits, bonds, computed members, associated clocks, group feed
- [ ] Star/unstar button

### 3.1.5 — Location List & Detail

**Files to create:**
- `src/app/(player)/world/locations/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Location list with name search and sort
- [ ] Location detail: name, description, parent link, traits, bonds, presence tiers (with labels), location feed
- [ ] Presence tiers visually graded (tier 1 vivid, tier 3 muted)
- [ ] Star/unstar button

### 3.1.6 — Story List & Detail

**Files to create:**
- `src/app/(player)/world/stories/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Story list with filters (status, tag, owner, sort)
- [ ] Story detail: name, summary, status, tags, owners, entries
- [ ] Entries shown chronologically

### 3.1.7 — Story Entry CRUD

**As a** user, **I want** to add entries to stories **so that** I can contribute to the narrative.

**Acceptance criteria:**
- [ ] Add entry form: textarea + optional character_id
- [ ] Edit entry (for author/GM): inline editing
- [ ] Delete entry (for author/GM): with confirmation
- [ ] Entries refresh after CRUD operations

### 3.1.8 — Search & Filter Controls

**As a** user, **I want** to search and filter lists **so that** I can find what I'm looking for.

**Files to create:**
- `src/features/world/SearchFilter.tsx`

**Acceptance criteria:**
- [ ] Name search input (debounced)
- [ ] Sort controls (sort_by, sort_dir)
- [ ] Filter controls per entity type
- [ ] Query params sync with URL for shareable links
