import type {
  GmActionType,
  GmActionRequest,
  GameObjectType,
  MeterChange,
  SkillName,
  MagicStatName,
  SlotType,
  MagicEffectType,
  VisibilityLevel,
} from "@/lib/api/types";

// ── Action Group Metadata ──────────────────────────────────────────

export interface GmActionGroupDef {
  label: string;
  actions: GmActionType[];
}

export const GM_ACTION_GROUPS: GmActionGroupDef[] = [
  {
    label: "Modify",
    actions: [
      "modify_character",
      "modify_group",
      "modify_location",
      "modify_clock",
    ],
  },
  {
    label: "Bond",
    actions: ["create_bond", "modify_bond", "retire_bond"],
  },
  {
    label: "Trait",
    actions: ["create_trait", "modify_trait", "retire_trait"],
  },
  {
    label: "Effect",
    actions: ["create_effect", "modify_effect", "retire_effect"],
  },
  {
    label: "XP",
    actions: ["award_xp"],
  },
];

export const GM_ACTION_LABELS: Record<GmActionType, string> = {
  modify_character: "Modify Character",
  modify_group: "Modify Group",
  modify_location: "Modify Location",
  modify_clock: "Advance Clock",
  create_bond: "Create Bond",
  modify_bond: "Modify Bond",
  retire_bond: "Retire Bond",
  create_trait: "Create Trait",
  modify_trait: "Modify Trait",
  retire_trait: "Retire Trait",
  create_effect: "Create Effect",
  modify_effect: "Modify Effect",
  retire_effect: "Retire Effect",
  award_xp: "Award XP",
};

// ── Target types per action ────────────────────────────────────────

export const GM_ACTION_TARGET_TYPES: Record<GmActionType, GameObjectType[]> = {
  modify_character: ["character"],
  modify_group: ["group"],
  modify_location: ["location"],
  modify_clock: [],  // clock ID goes in changes
  create_bond: ["character", "group", "location"],
  modify_bond: ["character", "group", "location"],
  retire_bond: ["character", "group", "location"],
  create_trait: ["character", "group", "location"],
  modify_trait: ["character", "group", "location"],
  retire_trait: ["character", "group", "location"],
  create_effect: ["character"],
  modify_effect: ["character"],
  retire_effect: ["character"],
  award_xp: ["character"],
};

// ── Re-export for convenience ──────────────────────────────────────

export type {
  GmActionType,
  GmActionRequest,
  GameObjectType,
  MeterChange,
  SkillName,
  MagicStatName,
  SlotType,
  MagicEffectType,
  VisibilityLevel,
};
