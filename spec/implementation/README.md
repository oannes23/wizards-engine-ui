# Implementation Plan

## Dependency Graph

```
Phase 0: Foundation
  Epic 0.1 (Scaffolding) ─────────────────────────────────────────────┐
                                                                      │
Phase 1: Core Display                                                 │
  Epic 1.1 (Auth & Onboarding) ◄─────────────────────────────────────┤
  Epic 1.2 (Character Sheet)   ◄─────────────────────────────────────┘
  Epic 2.3 (Feeds & Events)    ◄──── can start with 0.1

Phase 2: Core Gameplay
  Epic 2.1 (Proposals)         ◄──── needs 1.1, 1.2
  Epic 2.2 (GM Queue)          ◄──── needs 2.1

Phase 3: World & Management
  Epic 3.1 (World Browser)     ◄──── needs 1.2
  Epic 3.2 (GM World Mgmt)     ◄──── needs 3.1
  Epic 3.3 (Sessions)          ◄──── needs 1.2
  Epic 3.4 (Players & Invites) ◄──── needs 1.1
```

## Critical Path

The longest sequential chain for the core gameplay loop:

```
0.1 Scaffolding → 1.1 Auth → 1.2 Character Sheet → 2.1 Proposals → 2.2 GM Queue
```

5 Epics deep. The proposal system is the app's central mechanic and requires auth, character data, and feeds.

## Parallelism Opportunities

| Phase | Parallel Work Streams |
|-------|----------------------|
| Phase 1 | 1.1 Auth, 1.2 Character Sheet, 2.3 Feeds (all need only 0.1) |
| Phase 2 | 2.1 Proposals + 2.3 Feeds (if not started in Phase 1) |
| Phase 3 | 3.1 World Browser, 3.3 Sessions, 3.4 Players (all independent) |

## Epic Summary

| Phase | Epic | Est. Stories | Risk | Status |
|-------|------|-------------|------|--------|
| 0 | [0.1 Scaffolding](phase0-scaffolding.md) | 6–8 | Medium | Complete |
| 1 | [1.1 Auth & Onboarding](phase1-auth-onboarding.md) | 5–6 | Medium | Complete |
| 1 | [1.2 Character Sheet](phase1-character-sheet.md) | 7–9 | High | Complete |
| 2 | [2.1 Proposals](phase2-proposals.md) | 8–10 | **Critical** | Complete |
| 2 | [2.2 GM Queue](phase2-gm-queue.md) | 5–6 | Medium | Complete |
| 2 | [2.3 Feeds & Events](phase2-feeds.md) | 6–7 | Low | Complete |
| 3 | [3.1 World Browser](phase3-world-browser.md) | 7–8 | Low | Complete |
| 3 | [3.2 GM World Management](phase3-gm-world-management.md) | 8–10 | High | Complete |
| 3 | [3.3 Sessions](phase3-sessions.md) | 5–6 | Medium | Complete |
| 3 | [3.4 Players & Invites](phase3-players-invites.md) | 3–4 | Low | Complete |

**Total: 60–74 estimated stories**

## Risk Areas

1. **Proposal Wizard** (Epic 2.1) — 12 action types with different selection schemas, sacrifice builder for magic, modifier stacking enforcement. Most complex UI.
2. **Character Sheet** (Epic 1.2) — Highest data density view, mobile layout challenge, polling + optimistic update race conditions.
3. **GM Actions** (Epic 3.2) — 14 action types with different payloads, batch mode, embedded in edit pages and proposal approval.
4. **Auth Cross-Origin Cookies** (Epic 1.1) — SameSite=Lax + CORS can cause hard-to-debug failures in certain deployment configs.
