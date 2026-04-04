/**
 * Character feature module — public exports.
 */

// Components
export { MeterHeader } from "./components/MeterHeader";
export { TraitItem, TraitsSection } from "./components/TraitItem";
export { BondItem, BondsSection } from "./components/BondItem";
export { SkillGrid } from "./components/SkillGrid";
export { MagicStatGrid } from "./components/MagicStatGrid";
export { MagicEffectItem, MagicEffectsSection } from "./components/MagicEffectItem";
export { CharacterTabs } from "./components/CharacterTabs";
export { CharacterDesktopLayout } from "./components/CharacterDesktopLayout";

// Hooks
export { useCharacterFeed } from "./hooks/useCharacterFeed";

// Types & helpers
export type { CharacterTabId } from "./types";
export {
  isAtStressCap,
  effectiveBondMax,
  canRechargeTrait,
  canMaintainBond,
  CHARACTER_TABS,
  SKILL_DISPLAY_ORDER,
  SKILL_LABELS,
  MAGIC_STAT_DISPLAY_ORDER,
  MAGIC_STAT_LABELS,
} from "./types";
