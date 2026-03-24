# Epic 2.1 — Proposal System (Player Side)

> Phase: 2
> Status: Not Started
> Depends on: Epic 1.1, Epic 1.2

## Goal

Enable players to submit, view, edit, and track proposals — the central mechanic of the application.

## Stories

### 2.1.1 — Proposals List Page

**As a** player, **I want** to see my proposals **so that** I can track their status.

**Files to create:**
- `src/app/(player)/proposals/page.tsx`
- `src/lib/hooks/useProposals.ts`
- `src/lib/api/services/proposals.ts`

**Acceptance criteria:**
- [ ] Proposals grouped by status: Pending, Approved, Rejected
- [ ] Each proposal shows: action type badge, narrative excerpt, timestamp, status badge
- [ ] Polling at 15–20s for status changes
- [ ] Empty states per group

### 2.1.2 — Proposal Detail Page

**As a** player, **I want** to see a proposal's full details **so that** I understand its effect and status.

**Files to create:**
- `src/app/(player)/proposals/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Full proposal display: narrative, selections, calculated_effect, status
- [ ] Rejection note displayed if rejected
- [ ] Edit and delete buttons for pending/rejected proposals
- [ ] Link to resulting event if approved

### 2.1.3 — Step Indicator (if not done in 0.1.8)

Covered in Epic 0.1.8.

### 2.1.4 — Wizard Step 1: Action Type Selector

**As a** player, **I want** to choose an action type **so that** I can start building my proposal.

**Files to create:**
- `src/app/(player)/proposals/new/page.tsx`
- `src/features/proposals/WizardProvider.tsx` — wizard state context
- `src/features/proposals/ActionTypeSelector.tsx`

**Acceptance criteria:**
- [ ] Action types grouped: Session Actions, Downtime Actions
- [ ] Each type shows name, one-line description
- [ ] Session actions disabled when no active session
- [ ] Downtime actions disabled when FT = 0
- [ ] Selection advances to Step 2

### 2.1.5 — Wizard Step 2: use_skill Form

**As a** player, **I want** to configure a skill check **so that** I can submit an action proposal.

**Files to create:**
- `src/features/proposals/forms/UseSkillForm.tsx`
- `src/features/proposals/ModifierSelector.tsx`

**Acceptance criteria:**
- [ ] Skill selector (8 options) showing current level
- [ ] Modifier pickers: core trait (1 max), role trait (1 max), bond (1 max)
- [ ] Each modifier shows current charges, disabled if 0 charges
- [ ] Plot spend selector (0 to current plot)
- [ ] Real-time dice pool preview: "Base Xd + modifiers = Yd"
- [ ] Narrative textarea
- [ ] Stacking rule enforced (max 1+1+1 = +3d)

### 2.1.6 — Wizard Step 2: Magic Action Forms

**As a** player, **I want** to configure magic actions **so that** I can cast spells or charge effects.

**Files to create:**
- `src/features/proposals/forms/UseMagicForm.tsx`
- `src/features/proposals/forms/ChargeMagicForm.tsx`
- `src/features/proposals/SacrificeBuilder.tsx`

**Acceptance criteria:**
- [ ] use_magic: magic stat selector, intention + symbolism textareas, SacrificeBuilder, modifiers
- [ ] charge_magic: effect selector (active charged effects), then same as use_magic minus stat
- [ ] SacrificeBuilder: tiered cost display, multi-source sacrifice selection, running total
- [ ] Gnosis/stress/FT sliders with current balance display
- [ ] Bond/trait sacrifice as binary toggles with confirmation
- [ ] Dice pool preview based on total gnosis equivalent

### 2.1.7 — Wizard Step 2: Downtime Action Forms

**As a** player, **I want** to configure downtime actions **so that** I can spend my Free Time effectively.

**Files to create:**
- `src/features/proposals/forms/RegainGnosisForm.tsx`
- `src/features/proposals/forms/RestForm.tsx`
- `src/features/proposals/forms/WorkOnProjectForm.tsx`
- `src/features/proposals/forms/NewTraitForm.tsx`
- `src/features/proposals/forms/NewBondForm.tsx`

**Acceptance criteria:**
- [ ] regain_gnosis / rest: modifier selectors only, computed preview
- [ ] work_on_project: story/clock picker + narrative
- [ ] new_trait: slot type selector, template search/browse or custom name/description, optional retire
- [ ] new_bond: target type picker, target search, optional name/description, optional retire

### 2.1.8 — Sacrifice Builder Component

Detailed in 2.1.6. See [domains/magic.md](../domains/magic.md) for full specification.

### 2.1.9 — Wizard Step 3: Review & Submit

**As a** player, **I want** to review my proposal before submitting **so that** I can catch mistakes.

**Files to create:**
- `src/features/proposals/ReviewStep.tsx`

**Acceptance criteria:**
- [ ] Formatted summary of all selections
- [ ] `POST /proposals` to get server-computed calculated_effect
- [ ] Loading state while server responds
- [ ] Dice pool and resource costs displayed
- [ ] Submit button (creates/finalizes proposal)
- [ ] Back button returns to Step 2 without losing state

### 2.1.10 — Proposal Edit & Delete

**As a** player, **I want** to revise rejected proposals **so that** I can resubmit after addressing GM feedback.

**Acceptance criteria:**
- [ ] Edit button on pending/rejected proposals opens wizard pre-filled with existing selections
- [ ] `PATCH /proposals/{id}` updates and triggers recalculation
- [ ] Delete button on pending/rejected with confirmation
- [ ] `DELETE /proposals/{id}` removes proposal
- [ ] 409 if proposal already approved → error toast
