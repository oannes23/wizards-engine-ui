# Glossary

Canonical terminology for the Wizards Engine UI project. Use these terms consistently across specs, code, and documentation.

---

## Game Fiction Terms

**Bond** — A directional relationship between any two Game Objects. The mechanical unit of the bond graph. Always use "bond," not "relationship" or "edge."

**Bond Graph** — The traversable network of all active bonds among Game Objects. Drives visibility rules: 1-hop (bonded/commonly present), 2-hop (familiar/often present), 3-hop (public/sometimes present). After a non-Character node, the next hop must go through a Character.

**Charge** — An integer resource (0–5) on a character trait (core/role) or PC bond. Consumed (−1) when invoked as a proposal modifier (+1d). All three trait subtypes share this mechanic: **Core Traits** and **Role Traits** become unusable at 0 charges until recharged (1 FT → back to 5). **Bond Traits** (PC bonds) auto-recharge when hitting 0, but with max charges permanently decreased by 1 (see Degradation).

**Clock** — A Blades-in-the-Dark-style progress tracker with N segments and M filled. Can be standalone or associated with a Game Object. Completion triggers a `resolve_clock` system proposal.

**Core Trait** — A character trait in one of the 2 core slots. Has charges. Linked to a Trait Template. Provides +1d as modifier, costs 1 charge.

**Degradation** — An integer count (API field: `degradations`) on a PC bond recording how many times charges have hit 0 and auto-recharged. Each occurrence permanently reduces effective max charges (effective max = 5 − degradations). A bond with degradations = 3 has an effective max of 2.

**Effective Max** — A derived maximum: for Stress, it is 9 minus trauma count; for bond charges, it is 5 minus degradations.

**Free Time (FT)** — A character meter (0–20). Each downtime action costs 1 FT. Gained at session start based on `time_now` delta.

**Game Object** — Any of the three fictional entity types that form the bond graph: Character, Group, or Location. Distinct from System Entity.

**Gnosis** — A character meter (0–23). Magical resource consumed as sacrifice in magic actions.

**GM (Game Master)** — The user role with full visibility and control. Exactly one per campaign.

**Group** — A Game Object representing an organization. Has a tier (integer), traits, and implied membership derived from bonds (any Character bonded to a Group is a member).

**Location** — A Game Object representing a place. Supports parent/child nesting. Has feature traits and presence tiers derived from bond-graph traversal.

**Magic Effect** — An outcome of an approved magic action. Three subtypes: instant (one-time, not on sheet), charged (has charges, usable/retirable), permanent (always active, power level 1–5). Max 9 active effects per character (charged + permanent).

**Magic Stat** — One of five magical disciplines: `being`, `wyrding`, `summoning`, `enchanting`, `dreaming`. Has level (0–5) and XP (0–4, resets on level-up at 5 XP).

**Meter** — One of four numeric resource bars on a full (PC) character: Stress (`#e05545` red), Free Time (`#34d399` emerald), Plot (`#f59e0b` amber), Gnosis (`#a78bfa` violet).

**NPC** — Non-Player Character. Represented as a simplified character (`detail_level: "simplified"`). Has bonds but no meters, skills, magic stats, or traits with charges.

**PC** — Player Character. Represented as a full character (`detail_level: "full"`). Has full mechanical depth.

**Plot** — A character meter (0–5, can temporarily exceed). Each Plot spent in a proposal guarantees one success die (a 6). Clamped to 5 at session end.

**Presence Tier** — The hop-distance grouping (1, 2, or 3) shown on a Location's detail page: Tier 1 "Commonly present," Tier 2 "Often present," Tier 3 "Sometimes present."

**Proposal** — A player-submitted or system-generated request for a state change, subject to GM approval. The central mechanic of the application. Statuses: `pending`, `approved`, `rejected`.

**Rider Event** — An optional secondary GM action bundled into a proposal approval, applied atomically with the proposal's effects.

**Role Trait** — A character trait in one of the 3 role slots. Has charges. Linked to a Trait Template.

**Session** — A record of one play session. Lifecycle: Draft → Active → Ended. Only one Active session at a time. Drives FT/Plot distribution to participants.

**Skill** — One of 8 canonical action categories: `awareness`, `composure`, `influence`, `finesse`, `speed`, `power`, `knowledge`, `technology`. Level 0–3 determines base dice pool.

**Stress** — A character meter (0 to effective max). Hitting the effective max triggers the trauma mechanic (auto-generates a `resolve_trauma` system proposal).

**Story** — A narrative arc tracked as a named container with entries, owners, and visibility settings. Supports sub-arcs via parent/child hierarchy. Distinct from "story" in Agile usage.

**System Entity** — Any of: Session, Clock, Story, Proposal, Event. Not part of the bond graph. Distinct from Game Object.

**Trait** — An instance of a Trait Template attached to a Character (core/role), Group (group_trait), or Location (feature_trait). Character traits have charges; others are descriptive only.

**Trait Template** — A GM-managed catalog entry defining a trait name, description, and type (`core` or `role`). Referenced by trait instances on characters.

**Trauma** — A bond with `is_trauma: true`, created when a character's stress hits effective max. Permanently reduces effective stress max by 1. The chosen bond retires to Past state.

**Visibility Level** — An ordered enum governing event/story visibility: `silent` < `gm_only` < `private` < `bonded` < `familiar` < `public` < `global`.

---

## Data Model Terms

**Calculated Effect** — The server-computed preview on a proposal showing the dice pool, resource costs, and other consequences before GM approval. Displayed at proposal wizard Step 3 and in the GM queue.

**Detail Level** — Character discriminator: `"full"` (PC) or `"simplified"` (NPC). Determines which fields are present in the API response.

**Origin** — On a Proposal, whether it was submitted by a player (`"player"`) or auto-generated by the system (`"system"`). System proposals include `resolve_trauma` and `resolve_clock`.

**Slot Type** — String discriminator on bonds and traits identifying their category: `pc_bond`, `npc_bond`, `group_relation`, `group_holding`, `location_bond`, `core_trait`, `role_trait`, `group_trait`, `feature_trait`.

**Soft Delete** — Deletion pattern where `is_deleted` is set to `true` rather than removing the record. List endpoints exclude soft-deleted records by default; use `?include_deleted=true` to include them.

**ULID** — Universally Unique Lexicographically Sortable Identifier. The ID format for all entities. Cursor-based pagination relies on lexicographic ordering of ULIDs.

---

## Frontend Architecture Terms

**Feed** — A merged chronological stream of Events and Story entries. Discriminated union on `type: "event" | "story_entry"`. Rendered with cursor-based "Load more" pagination.

**Polling** — Data-refresh strategy: repeated timed requests to the API. Pauses when `document.visibilityState === 'hidden'`; resumes on focus. Managed via TanStack Query's `refetchInterval`.

**Proposal Wizard** — The 3-step form for submitting a proposal: (1) choose action type, (2) fill action-specific fields, (3) review and submit.

**Route Group** — A Next.js App Router directory wrapped in parentheses (e.g., `(player)/`) that groups routes under a shared layout without adding to the URL path.

**Sacrifice Builder** — The sub-component within the Proposal Wizard for `use_magic` and `charge_magic` action types. Handles multi-type resource sacrifice selection with gnosis-equivalent calculations.

---

## Abbreviations

| Abbreviation | Expansion |
|---|---|
| FT | Free Time |
| GM | Game Master |
| NPC | Non-Player Character |
| PC | Player Character |
| ULID | Universally Unique Lexicographically Sortable Identifier |
| MSW | Mock Service Worker |
| RTL | React Testing Library |
