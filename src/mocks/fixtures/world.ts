import type {
  GroupDetailResponse,
  LocationDetailResponse,
  StoryDetailResponse,
} from "@/lib/api/types";
import { makeTrait, makeBond } from "./characters";

// ── Group fixtures ─────────────────────────────────────────────────

export function makeGroup(
  overrides?: Partial<GroupDetailResponse>
): GroupDetailResponse {
  return {
    id: "01GROUP_DEFAULT000000000",
    name: "The Night Watch",
    tier: 3,
    description: "A vigilant organization that patrols the city's borders",
    notes: null,
    bond_distance: 1,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    traits: [
      makeTrait({
        id: "01GTRAIT_0000000000000",
        slot_type: "group_trait",
        name: "Well-Armed",
        description: "The group maintains an impressive arsenal",
      }),
    ],
    bonds: [
      makeBond({
        id: "01GRELATION_0000000000",
        slot_type: "group_relation",
        target_type: "group",
        target_id: "01GROUP_OTHER0000000000",
        target_name: "The City Guard",
        label: "Allies with",
        charges: null,
        degradations: null,
        is_trauma: null,
        effective_charges_max: null,
      }),
      makeBond({
        id: "01GHOLDING_000000000000",
        slot_type: "group_holding",
        target_type: "location",
        target_id: "01LOC_DEFAULT0000000000",
        target_name: "The Watchtower",
        label: "Holds",
        charges: null,
        degradations: null,
        is_trauma: null,
        effective_charges_max: null,
      }),
    ],
    members: [
      { id: "01CHAR_DEFAULT0000000000", name: "Kael", detail_level: "full" },
    ],
    ...overrides,
  };
}

// ── Location fixtures ──────────────────────────────────────────────

export function makeLocation(
  overrides?: Partial<LocationDetailResponse>
): LocationDetailResponse {
  return {
    id: "01LOC_DEFAULT0000000000",
    name: "The Docks",
    description: "A bustling waterfront district",
    parent_id: "01LOC_PARENT0000000000",
    notes: null,
    bond_distance: 1,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    traits: [
      makeTrait({
        id: "01FTRAIT_0000000000000",
        slot_type: "feature_trait",
        name: "Trade Hub",
        description: "Merchants from across the realm meet here",
      }),
    ],
    bonds: [
      makeBond({
        id: "01LOCBOND_000000000000",
        slot_type: "location_bond",
        target_type: "group",
        target_id: "01GROUP_DEFAULT000000000",
        target_name: "The Night Watch",
        label: "Patrolled by",
        charges: null,
        degradations: null,
        is_trauma: null,
        effective_charges_max: null,
      }),
    ],
    presence: [
      {
        tier: 1,
        label: "Commonly present",
        items: [
          { id: "01CHAR_DEFAULT0000000000", name: "Kael", type: "character" },
        ],
      },
      {
        tier: 2,
        label: "Often present",
        items: [
          { id: "01NPC_DEFAULT00000000000", name: "Merchant", type: "character" },
        ],
      },
      {
        tier: 3,
        label: "Sometimes present",
        items: [],
      },
    ],
    ...overrides,
  };
}

// ── Story fixtures ─────────────────────────────────────────────────

export function makeStory(
  overrides?: Partial<StoryDetailResponse>
): StoryDetailResponse {
  return {
    id: "01STORY_DEFAULT000000000",
    name: "The Shadow Conspiracy",
    summary: "A web of intrigue threatens the city",
    status: "active",
    parent_id: null,
    tags: ["investigation", "intrigue"],
    visibility_level: "public",
    visibility_overrides: [],
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    owners: [
      {
        type: "character",
        id: "01CHAR_DEFAULT0000000000",
        name: "Kael",
      },
    ],
    entries: [
      {
        id: "01ENTRY_0000000000000001",
        text: "We discovered the first clue at the docks.",
        author_id: "01USER_PLAYER000000000",
        character_id: "01CHAR_DEFAULT0000000000",
        session_id: null,
        created_at: "2026-01-15T10:00:00Z",
      },
      {
        id: "01ENTRY_0000000000000002",
        text: "The merchant revealed the location of the safehouse.",
        author_id: "01USER_PLAYER000000000",
        character_id: "01CHAR_DEFAULT0000000000",
        session_id: null,
        created_at: "2026-01-16T14:30:00Z",
      },
    ],
    has_more_entries: false,
    entries_cursor: null,
    ...overrides,
  };
}
