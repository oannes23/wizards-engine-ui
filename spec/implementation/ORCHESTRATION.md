# Implementation Orchestration

> Master execution plan for the orchestrator agent. Read this file to know what to do next.

## How to Use This Document

1. Check [PROGRESS.md](PROGRESS.md) to find the current batch
2. Look up the batch in [EXECUTION_ORDER.md](EXECUTION_ORDER.md) for prerequisites and stories
3. Delegate stories to the appropriate agent per [AGENT_ASSIGNMENTS.md](AGENT_ASSIGNMENTS.md)
4. After each batch, check if a review checkpoint is due per [REVIEW_CHECKPOINTS.md](REVIEW_CHECKPOINTS.md)
5. Update PROGRESS.md as stories complete

## Agent Roster

| Agent | Role | When Used |
|-------|------|-----------|
| **frontend-dev** | Primary implementer | Every story (Batches A–U) |
| **qa-engineer** | Test writer & validator | 8 QA sessions + 1 E2E session |
| **code-reviewer** | Quality & standards critic | 4 gates + 3 inline reviews + 1 final |
| **game-designer** | Mechanics & UX validator | 4 gates + 3 inline reviews + 1 final |
| **architect** | Structure & pattern finder | 4 gates + 3 inline reviews + 1 final |
| **tech-writer** | Spec maintenance | 4 sync points (TW-1 through TW-4) + 1 final |

## Execution Summary

**21 implementation batches** (A–U) across 4 phases, interleaved with **9 QA sessions**, **4 phase gates**, **3 inline reviews**, and **1 final review**.

Total estimated agent sessions: **45–50**

## Phase Overview

| Phase | Batches | QA Sessions | Gates | Inline Reviews | TW Syncs |
|-------|---------|-------------|-------|----------------|----------|
| 0 — Foundation | A, B, C | QA-1 | GATE-0 | — | TW-1 |
| 1 — Core Display | D, E, F, G, H | QA-2, QA-3 | GATE-1 | Inline-1 | TW-2 |
| 2 — Core Gameplay | I, J, K, L, M, N | QA-4, QA-5 | GATE-2 | Inline-2 | TW-3 |
| 3 — World & Mgmt | O, P, Q, R, S, T, U | QA-6, QA-7 | GATE-3 | Inline-3 | TW-4 |
| Final | — | QA-8 (E2E) | — | — | TW-Final |

## Parallelism Map

```
Phase 0:  [A] ──→ [B] ──────────────────────────────────┐
               └─→ [C] ──→ [QA-1] ──→ [GATE-0 + TW-1]  │
                                                          │
Phase 1:  [D] ──→ [E] ──→ [QA-2] ──────────────────────┐│
          [F] ──→ [G] ──→ [QA-3] ──→ [Inline-1]        ││
          [H] (feeds, parallel with D–G)                  ││
                              └──→ [GATE-1 + TW-2] ──────┘│
                                                           │
Phase 2:  [I] ──→ [J] ──→ [K] ──→ [Inline-2] ──→ [L]    │
                                         └──→ [QA-4]      │
          [M] (after L) ─────────────────────────────────┐ │
          [N] (after H) ──→ [QA-5]                       │ │
                              └──→ [GATE-2 + TW-3] ──────┘ │
                                                            │
Phase 3:  [O] ──→ [P] ──→ [Q] ──→ [R] ──→ [Inline-3]     │
                                      └──→ [S]             │
          [T] (parallel with O–S)          └──→ [QA-6]     │
          [U] (parallel with O–S)                           │
                    └──→ [QA-7] ──→ [GATE-3 + TW-4]        │
                                                            │
Final:    [QA-8 E2E] ──→ [FINAL REVIEW]                    │
```

## Known Discrepancies

These are confirmed mismatches between the frontend spec and the actual backend API. They are **non-blocking** — the frontend adapts to match the backend, and the tech-writer updates specs at the designated sync points.

| # | Area | Spec Says | Backend Returns | Resolution | When |
|---|------|-----------|-----------------|------------|------|
| D1 | Feed story entries | `text` | `entry_text` | Use `entry_text` in TypeScript types | TW-1 (GATE-0) |
| D2 | Player roster | `UserResponse` (no `is_active`) | `PlayerResponse` with `is_active: bool` | Add field to type, use in roster UI | TW-4 (GATE-3) |
| D3 | Story owners | `{type, id, name}` | `{type, id}` (no `name`) | Build `useEntityName()` hook (cache lookup + fallback fetch) | Batch P (Story 3.1.6) |
| D4 | GM action requests | Generic `targets[] + changes{}` envelope | Per-action-type discriminated request schemas | Build type-specific request builders | Batch R (Stories 3.2.5–3.2.8) |

## Critical Risk Areas

| Risk | Batch | Mitigation |
|------|-------|------------|
| Proposal wizard complexity (12 action types) | K | Build simple downtime forms first (Batch J) to establish patterns; Inline-2 review gates magic forms |
| Sacrifice builder math | K | Dedicated unit tests in QA-4; game-designer validates exchange rates at Inline-2 |
| GM action form proliferation (14 types) | R | Architect reviews DRY at Inline-3; group similar forms (modify, bond, trait+effect) |
| Cross-origin cookie auth | D | Test CORS config in Batch D; document in CLAUDE.md if deployment-specific |
| Cache invalidation ripple | M | Architect validates query key hierarchy and invalidation map at GATE-2 |

## Orchestrator Protocol

### Starting a Batch

1. Verify all prerequisite batches are marked `Complete` in PROGRESS.md
2. Read the batch definition in EXECUTION_ORDER.md
3. For each story in the batch:
   a. Read the story's epic file for acceptance criteria
   b. Read the relevant spec files listed in the story
   c. Delegate to the primary agent (frontend-dev) with full context
   d. Mark story `In Progress` in PROGRESS.md
4. After the agent completes, verify acceptance criteria
5. Mark story `Complete` in PROGRESS.md

### Running a QA Session

1. Delegate to qa-engineer with:
   - List of stories covered
   - Spec files for the domain
   - Testing strategy from `spec/testing/strategy.md`
   - Fixture requirements
2. QA-engineer creates: MSW handlers, fixtures, component tests, integration tests
3. Run `pnpm test` to verify all pass
4. Mark QA session complete in PROGRESS.md

### Running a Review Checkpoint

1. For each reviewer agent in the checkpoint (see REVIEW_CHECKPOINTS.md):
   a. Provide the reviewer with the scope (which batches/stories to review)
   b. Reviewer produces findings (pass/fail + issues list)
2. If any blocking issues: create follow-up stories, assign to frontend-dev
3. If all pass: mark gate complete, proceed to next phase
4. Tech-writer runs their sync point at each gate

### Handling Review Findings

- **Blocking**: Must fix before proceeding. Create a patch story, assign to frontend-dev.
- **Non-blocking**: Log as follow-up. Can be addressed in the next batch or at end.
- **Spec divergence**: Route to tech-writer for spec update at next TW sync point.
