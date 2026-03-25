# Spec Deepening Roadmap

> Created: 2026-03-23
> Approach: Full depth before implementation. One spec at a time.
> Focus: Edge cases, interaction design, and implementation decisions.
> Full question roadmap: See [plan file](../.claude/plans/distributed-wandering-music.md) for per-spec question tables.

## Decisions

- **Strategy**: All specs deepened before any code is written
- **Backend API**: Stable/frozen. Change requests go to [api/backend-change-requests.md](api/backend-change-requests.md) (12 CRs filed)
- **Audience**: Developer + Claude Code agent. Specs focus on decisions, edge cases, and implementation-blocking ambiguities
- **Process**: Interrogate each spec individually via `/interrogate`, going deep before moving to the next
- **Charge mechanics**: Three trait subtypes (Core/Role/Bond) share charge mechanic; bonds auto-degrade at 0 charges

## Phase 0 — Pre-Interrogation Fixes (COMPLETED 2026-03-23)

- [x] Fix meter color inconsistency (`characters.md`, `glossary.md` → match `design-system.md`)
- [x] Fix bond charge mechanics (`bonds.md` "no charge cost" → "costs 1 charge"; update glossary)
- [x] Fix glossary `degradation_count` → `degradations` (match API field name)
- [x] Fix duplicate row in `player-views.md` Complexity Ranking table
- [x] File 12 backend change requests (6 blocking, 6 high/medium)

---

## Interrogation Sequence

Optimized for dependency chains within each wave. Specs on the same round can be interrogated in parallel.

### Wave 1 — Foundation (7 specs, ~4 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 1 | [architecture/overview.md](architecture/overview.md) | 14 | Everything depends on this |
| 2 | [architecture/naming-conventions.md](architecture/naming-conventions.md) | 3 | Depends on overview |
| 2 | [ui/design-system.md](ui/design-system.md) | 9 | Depends on overview |
| 3 | [architecture/api-client.md](architecture/api-client.md) | 10 | Independent |
| 3 | [architecture/auth.md](architecture/auth.md) | 8 | Independent |
| 4 | [architecture/data-fetching.md](architecture/data-fetching.md) | 12 | Depends on api-client |
| 4 | [architecture/routing.md](architecture/routing.md) | 6 | Depends on auth |

### Wave 2 — Core Domains + API (6 specs, ~3 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 5 | [api/response-shapes.md](api/response-shapes.md) | 10 | Types drive all domain specs |
| 5 | [api/contract.md](api/contract.md) | 12 | Endpoints drive all domain specs |
| 6 | [domains/users.md](domains/users.md) | 4 | Simple, low risk |
| 6 | [domains/bonds.md](domains/bonds.md) | 10 | Independent |
| 6 | [domains/traits.md](domains/traits.md) | 6 | Independent |
| 7 | [domains/characters.md](domains/characters.md) | 13 | Benefits from bonds/traits settled |

### Wave 3 — Central Mechanic + World (7 specs, ~4 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 8 | [domains/magic.md](domains/magic.md) | 10 | Sacrifice system — prerequisite for proposals |
| 9 | [domains/sessions.md](domains/sessions.md) | 9 | Independent |
| 9 | [domains/groups.md](domains/groups.md) | 4 | Independent |
| 9 | [domains/locations.md](domains/locations.md) | 7 | Independent |
| 9 | [domains/stories.md](domains/stories.md) | 7 | Independent |
| 10 | [domains/proposals.md](domains/proposals.md) | **26** | Heavyweight — after all other domains |
| 11 | [domains/events-and-feeds.md](domains/events-and-feeds.md) | 8 | After stories |

### Wave 4 — UI Views + Testing (5 specs, ~3 rounds)

| Round | Spec | Questions | Key Dependencies |
|-------|------|-----------|------------------|
| 12 | [ui/components.md](ui/components.md) | 12 | Primitives catalog — views depend on this |
| 13 | [ui/player-views.md](ui/player-views.md) | 8 | After components |
| 13 | [testing/strategy.md](testing/strategy.md) | 15 | Can parallel with player-views |
| 14 | [ui/gm-views.md](ui/gm-views.md) | 12 | After player-views |
| 14 | [glossary.md](glossary.md) | 9 terms + fixes | Final cleanup pass |

**Total: ~180 questions across 14 rounds (~25 specs)**

---

## Backend Change Requests

See [api/backend-change-requests.md](api/backend-change-requests.md) for the full list. Key blocking CRs that must be resolved before their dependent specs can be fully deepened:

| CR | Blocks | Filed |
|----|--------|-------|
| CR-001 Proposal dry-run endpoint | proposals.md (Round 10) | 2026-03-23 |
| CR-002 `calculated_effect` shape | response-shapes.md (Round 5), proposals.md | 2026-03-23 |
| CR-003 `MagicSacrifice` type | magic.md (Round 8) | 2026-03-23 |
| CR-004 `gm_overrides` flags | proposals.md (Round 10), gm-views.md | 2026-03-23 |
| CR-005 System proposal approval schemas | proposals.md (Round 10) | 2026-03-23 |
| CR-006 `POST /me/character` body | contract.md (Round 5) | 2026-03-23 |

---

## Progress Log

_Updated as each spec is interrogated._

| Date | Spec | Round | Result |
|------|------|-------|--------|
| 2026-03-23 | Phase 0 fixes | — | Completed: colors, charges, degradation field name, duplicate row, 12 CRs filed |
