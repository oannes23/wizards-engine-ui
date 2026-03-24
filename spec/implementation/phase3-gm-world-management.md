# Epic 3.2 — GM World Management & Actions

> Phase: 3
> Status: Not Started
> Depends on: Epic 3.1

## Goal

Enable the GM to create, edit, and manage all game objects and execute direct state modifications via the GM actions interface.

## Stories

### 3.2.1 — Create Character (NPC) Form

**Files to create:**
- `src/app/(gm)/world/characters/new/page.tsx`

**Acceptance criteria:**
- [ ] Form: name (required), description, notes, attributes
- [ ] `POST /characters` creates simplified character
- [ ] Success → redirect to character detail
- [ ] Validation error display

### 3.2.2 — Create Group Form

**Files to create:**
- `src/app/(gm)/world/groups/new/page.tsx`

**Acceptance criteria:**
- [ ] Form: name (required), tier (required), description, notes
- [ ] `POST /groups`
- [ ] Success → redirect to group detail

### 3.2.3 — Create Location Form

**Files to create:**
- `src/app/(gm)/world/locations/new/page.tsx`

**Acceptance criteria:**
- [ ] Form: name (required), description, parent_id (location picker), notes
- [ ] `POST /locations`
- [ ] Success → redirect to location detail

### 3.2.4 — Edit Game Object Forms

**Files to create:**
- `src/app/(gm)/world/characters/[id]/edit/page.tsx`
- `src/app/(gm)/world/groups/[id]/edit/page.tsx`
- `src/app/(gm)/world/locations/[id]/edit/page.tsx`

**Acceptance criteria:**
- [ ] Edit name, description, notes via `PATCH`
- [ ] Mechanical changes (traits, bonds, effects, meters) via GM actions (below)
- [ ] Sections for managing traits, bonds, effects with add/remove controls

### 3.2.5 — GM Action Type Selector & Router

**Files to create:**
- `src/app/(gm)/actions/page.tsx`
- `src/features/gm-actions/ActionTypeSelector.tsx`
- `src/lib/api/services/gm.ts`

**Acceptance criteria:**
- [ ] 14 action types organized by purpose (modify, bonds, traits, effects, XP)
- [ ] Selection reveals the appropriate dynamic form
- [ ] Batch mode toggle to build a list of actions

### 3.2.6 — GM Modify Actions

**Files to create:**
- `src/features/gm-actions/forms/ModifyCharacterForm.tsx`
- `src/features/gm-actions/forms/ModifyGroupForm.tsx`
- `src/features/gm-actions/forms/ModifyLocationForm.tsx`
- `src/features/gm-actions/forms/ModifyClockForm.tsx`

**Acceptance criteria:**
- [ ] modify_character: delta/set for each meter, narrative, visibility
- [ ] modify_group: tier changes
- [ ] modify_location: parent changes
- [ ] modify_clock: progress advancement
- [ ] Target picker for selecting which entity to modify

### 3.2.7 — GM Bond CRUD Actions

**Files to create:**
- `src/features/gm-actions/forms/BondForms.tsx`

**Acceptance criteria:**
- [ ] create_bond: source + target pickers (polymorphic), name, description
- [ ] modify_bond: charge/degradation changes
- [ ] retire_bond: confirmation dialog
- [ ] `POST /gm/actions` with appropriate payload

### 3.2.8 — GM Trait + Effect Actions

**Files to create:**
- `src/features/gm-actions/forms/TraitForms.tsx`
- `src/features/gm-actions/forms/EffectForms.tsx`

**Acceptance criteria:**
- [ ] create/modify/retire_trait
- [ ] create/modify/retire_effect (with effect type, power_level, charges)
- [ ] award_xp: character + magic stat selector + XP amount

### 3.2.9 — Clock Management Page

**Files to create:**
- `src/app/(gm)/clocks/page.tsx`
- `src/lib/api/services/clocks.ts`

**Acceptance criteria:**
- [ ] Clock grid with ClockSvg, name, progress, associated entity badge
- [ ] Create clock form: name, segments, associated entity (optional), notes
- [ ] Edit: name, notes, segments
- [ ] Delete (soft-delete)
- [ ] Near-completion clocks highlighted

### 3.2.10 — Trait Template CRUD

**Files to create:**
- `src/app/(gm)/templates/page.tsx`
- `src/lib/api/services/traitTemplates.ts`

**Acceptance criteria:**
- [ ] List templates with name, type (core/role), description
- [ ] Create form: name, description, type (immutable after creation)
- [ ] Edit: name, description
- [ ] Delete (soft-delete)
