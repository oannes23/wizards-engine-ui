# Epic 3.4 — Player & Invite Management

> Phase: 3
> Status: Complete
> Depends on: Epic 1.1
> Last verified: 2026-04-03

## Goal

Enable the GM to manage the player roster, generate invites, and handle player account administration.

## Stories

### 3.4.1 — Players Roster Page

**Files to create:**
- `src/app/(gm)/players/page.tsx`
- `src/lib/api/services/players.ts`

**Acceptance criteria:**
- [ ] List all users with display name, role badge, character name (if linked)
- [ ] Login URL shown per user (copyable) — GM sees these, players don't
- [ ] Regenerate token button per player

### 3.4.2 — Invite Management

**Acceptance criteria:**
- [ ] "Generate Invite" button → `POST /game/invites` → displays invite link (copyable)
- [ ] List all invites with consumed/unconsumed status
- [ ] Delete button on unconsumed invites
- [ ] 409 on deleting consumed invite → error toast

### 3.4.3 — Token Regeneration

**Acceptance criteria:**
- [ ] "Regenerate Login" button per player
- [ ] `POST /players/{id}/regenerate-token`
- [ ] New login URL displayed and copyable
- [ ] Confirmation dialog ("This will invalidate the player's current login link")

### 3.4.4 — GM Character Creation

**Acceptance criteria:**
- [ ] If GM has no linked character, show "Create Character" option on GM Character page
- [ ] `POST /me/character` with character details
- [ ] On success: character_id linked to GM user, character sheet accessible
