# Epic 1.2 — Character Sheet

> Phase: 1
> Status: Not Started
> Depends on: Epic 0.1

## Goal

Display the player's full character sheet with all data sections and inline direct actions, establishing the most data-rich view in the app.

## Stories

### 1.2.1 — MeterBar Component (if not done in 0.1.8)

Covered in Epic 0.1.8. Verify it handles effective_max for Stress.

### 1.2.2 — ChargeDots Component (if not done in 0.1.8)

Covered in Epic 0.1.8. Verify three-state rendering (filled/empty/degraded).

### 1.2.3 — Character Sheet Page Layout

**As a** player, **I want** to see my character sheet **so that** I know my current state.

**Files to create:**
- `src/app/(player)/character/page.tsx`
- `src/lib/hooks/useCharacter.ts`
- `src/lib/api/services/characters.ts`

**Acceptance criteria:**
- [ ] Fetches character detail via `GET /characters/{id}` using auth context's `characterId`
- [ ] Sticky meter header with 4 MeterBars (stress, FT, plot, gnosis)
- [ ] Mobile: tabbed sections below meters
- [ ] Desktop: two-column layout
- [ ] Loading and error states
- [ ] Polls at 15–20s for live updates

### 1.2.4 — Traits Section

**As a** player, **I want** to see my traits **so that** I know my character's abilities and charge levels.

**Files to create:**
- `src/features/characters/TraitItem.tsx`
- `src/features/characters/TraitsSection.tsx`

**Acceptance criteria:**
- [ ] Lists core traits (2 max) and role traits (3 max) separately
- [ ] Each trait shows: name, description, slot badge, ChargeDots
- [ ] Active vs. past traits visually distinct (past are de-emphasized)
- [ ] Recharge button per trait (disabled when FT < 1 or charges = 5)

### 1.2.5 — Bonds Section

**As a** player, **I want** to see my bonds **so that** I understand my relationships and their mechanical state.

**Files to create:**
- `src/features/characters/BondItem.tsx`
- `src/features/characters/BondsSection.tsx`

**Acceptance criteria:**
- [ ] Lists all bonds (8 max active)
- [ ] Each bond shows: name, target name with type icon, ChargeDots (with degradation), trauma badge
- [ ] Maintain button per bond (disabled when FT < 1 or charges at effective max)
- [ ] Trauma bonds visually distinct

### 1.2.6 — Magic Effects Section

**As a** player, **I want** to see my magic effects **so that** I can use and manage them.

**Files to create:**
- `src/features/characters/MagicEffectItem.tsx`
- `src/features/characters/MagicEffectsSection.tsx`

**Acceptance criteria:**
- [ ] Lists active effects with type badge (charged/permanent)
- [ ] Charged effects show charge dots + use button
- [ ] All active effects show retire button (with confirmation)
- [ ] Shows count: "Active Effects: X/9"

### 1.2.7 — Skills & Magic Stats Sections

**As a** player, **I want** to see my skills and magic stats **so that** I know my character's capabilities.

**Files to create:**
- `src/features/characters/SkillGrid.tsx`
- `src/features/characters/MagicStatGrid.tsx`

**Acceptance criteria:**
- [ ] Skills: 8 skills in compact grid with level indicators (0–3)
- [ ] Magic stats: 5 stats with level (0–5) and XP progress bar (0–4)

### 1.2.8 — Direct Action Buttons

**As a** player, **I want** quick action buttons on my character sheet **so that** I can perform direct actions without leaving the page.

**Files to modify:**
- Trait, bond, and effect item components
- `src/lib/hooks/useCharacterMutations.ts`

**Acceptance criteria:**
- [ ] Find Time button near Plot meter (disabled if plot < 3)
- [ ] Recharge Trait on each trait (disabled if FT < 1 or charge = 5)
- [ ] Maintain Bond on each bond (disabled if FT < 1 or at effective max)
- [ ] Use Effect on each charged effect (disabled if charges = 0)
- [ ] Retire Effect with confirmation dialog
- [ ] Optimistic updates for all direct actions
- [ ] Success/error toasts
- [ ] Character data refreshed after mutation settles

### 1.2.9 — Character Feed Tab

**As a** player, **I want** to see events related to my character **so that** I can track what happened to me.

**Files to create:**
- `src/features/characters/CharacterFeed.tsx`
- `src/lib/hooks/useCharacterFeed.ts`

**Acceptance criteria:**
- [ ] Fetches `GET /characters/{id}/feed`
- [ ] FeedList with cursor pagination
- [ ] FeedItem renders both event and story_entry variants
- [ ] Polling at 20–30s
