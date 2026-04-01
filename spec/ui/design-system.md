# Design System

> Status: Deepened
> Last verified: 2026-03-26
> Related: [components.md](components.md)

## Theme

**Dark theme only for MVP.** The brand navy palette is designed for dark backgrounds. Light mode is a future enhancement, not in scope for initial implementation.

Tailwind CSS config: hardcode dark styles as the default. No `darkMode: 'class'` toggle needed for MVP — all color tokens assume dark theme.

## Brand & Logo

Logo: `public/logo.png` — an open book with overlapping petal/leaf forms in navy and teal. The studio's brand palette drives the app's foundational colors.

## Color Palette

### Brand Colors (from Logo)

The logo defines three anchor colors that set the visual identity:

| Name | Hex | Tailwind Custom | Usage |
|------|-----|-----------------|-------|
| **Navy** | `#1e1b5e` | `brand-navy` | Darkest tone — spine/outlines, dark backgrounds, nav bar |
| **Blue** | `#2e6eb5` | `brand-blue` | Mid-tone — interactive elements, links, active states, focus rings |
| **Teal** | `#5bbfc4` | `brand-teal` | Highlight — accents, hover states, selected tabs, headings |

### Extended Brand Scale

Derived from the logo colors for UI layering:

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-navy-deep` | `#141050` | Darkest background (page body) |
| `brand-navy` | `#1e1b5e` | Card/panel backgrounds, nav bar |
| `brand-navy-light` | `#2a2670` | Elevated surfaces, hover backgrounds |
| `brand-blue` | `#2e6eb5` | Links, interactive elements, focus rings |
| `brand-blue-light` | `#4a8fd4` | Hover states for interactive elements |
| `brand-teal` | `#5bbfc4` | Primary accent — selected tabs, highlights, badges |
| `brand-teal-light` | `#7ed4d8` | Hover for teal elements |
| `brand-teal-muted` | `#3d8a8e` | Subdued accent for secondary elements |

### Meter Colors (Semantic Accents)

These four colors are the most recognizable visual elements in the UI. They are chosen to contrast well against the navy/teal brand palette:

| Meter | Color | Tailwind Custom | Notes |
|-------|-------|-----------------|-------|
| Stress | `#e05545` (red) | `meter-stress` | Warm red, visible against navy backgrounds |
| Free Time | `#34d399` (emerald) | `meter-ft` | Bright green-teal, harmonizes with brand teal |
| Plot | `#f59e0b` (amber) | `meter-plot` | Warm amber, high contrast against blue tones |
| Gnosis | `#a78bfa` (violet) | `meter-gnosis` | Soft violet, complements the navy/blue range |

### Background & Surface

The dark theme uses the brand navy as its foundation instead of generic charcoal/gray:

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-page` | `#0d0b2e` | Page background — deepest navy, near-black |
| `bg-surface` | `#1e1b5e` | Cards, panels, nav bar — brand navy |
| `bg-elevated` | `#2a2670` | Hover states, elevated panels |
| `bg-muted` | `#16133f` | Subtle distinction from page background |
| `text-primary` | `#e8e6f0` | Primary text — cool off-white with slight lavender warmth |
| `text-secondary` | `#9b97b8` | Secondary/muted text |
| `text-accent` | `#5bbfc4` | Accent text — brand teal |
| `border-default` | `#2a2670` | Subtle borders matching elevated background |
| `border-focus` | `#2e6eb5` | Focus rings — brand blue |

### Status Colors

| Status | Color | Notes |
|--------|-------|-------|
| Pending | `#f59e0b` (amber) | Matches plot meter for visual consistency |
| Approved | `#34d399` (emerald) | Matches FT meter |
| Rejected | `#e05545` (red) | Matches stress meter |
| Draft | `#9b97b8` (muted lavender) | Neutral against navy |
| Active | `#2e6eb5` (brand blue) | Brand color for active state |
| Ended | `#6b6789` (muted) | De-emphasized |

## Typography

**Font Stack** (Google Fonts, loaded via Next.js `next/font/google`):

| Role | Font | Weight Range | Usage |
|------|------|-------------|-------|
| Headings | **Crimson Pro** | 400–700 | Page titles, section headings, character/location names. Modern readable serif — sophisticated without being dramatic. |
| Body | **Inter** | 400–600 | Body text, labels, descriptions, narratives. Clean geometric sans, excellent for UI. |
| Numbers | Inter (tabular figures) | 500–700 | Meter values, charges, dice pools. Use `font-variant-numeric: tabular-nums` for aligned columns. |

- **Headings**: Crimson Pro serif. Game titles, character names, location names are proper nouns in a fictional world.
- **Body text**: Inter for readability. Narratives and descriptions need to be easy to read at length.
- **Numbers**: Inter with tabular figures for meter values, charges, and dice pools. Resource numbers should be scannable and aligned.

## Responsive Design

### Breakpoints

Three breakpoints: mobile, tablet (`md:`), and desktop (`lg:`).

| Breakpoint | Width | Tailwind Prefix |
|------------|-------|-----------------|
| Mobile | < 768px | (default) |
| Tablet | 768–1024px | `md:` |
| Desktop | > 1024px | `lg:` |

| Element | Mobile (< 768px) | Tablet (768–1024px) | Desktop (> 1024px) |
|---------|------------------|---------------------|---------------------|
| Navigation | Bottom bar, fixed | Top bar, sticky | Top bar, sticky |
| Content padding | `padding-bottom: nav-height` | `padding-top: nav-height` | `padding-top: nav-height` |
| Character Sheet | Tabbed sections | 2-column layout | 3-column layout |
| GM Queue cards | Bottom sheet for approval form | Inline expansion | Inline expansion |
| DataTable | Card-based layout | Compact table | Full table |

### Touch Targets

All interactive elements: minimum 44x44px hit area. Charge dots are decorative on character sheet but interactive (for recharge) on GM edit — interactive variant needs larger hit area.

## Animation & Motion

Minimal and purposeful. No decorative animation. CSS transitions only — no JS animation libraries (framer-motion, etc.).

### Timing

| Category | Duration | Easing | Examples |
|----------|----------|--------|----------|
| Micro-interaction | 150ms | `ease-out` | Hover, focus, toggle, button press |
| Transition | 300ms | `ease-in-out` | Meter fill/deplete, status change, tab switch |
| Dramatic | 500ms | `ease-in-out` | Clock completion, proposal approval, trauma trigger |

### Animated Elements

- **Meter changes**: Animate bar filling/depleting segment by segment (300ms). Makes resource expenditure feel physical.
- **Dice pool preview**: Build up visually as modifiers are added (150ms per die). Each +1d should feel like adding a die.
- **Proposal status change**: Brief satisfying transition (300ms) when approved/rejected. The player waited for this — reward the moment.
- **Clock advancement**: Newly filled segment sweeps in (300ms). Completion gets a distinct animation (500ms).
- **Stress approaching max**: Subtle visual warning (pulsing border or warming color shift) as stress nears effective max.

## Toast Notifications

- **Error**: Red background, 6-second duration, bottom of screen
- **Success**: Green background, 3-second duration, bottom of screen
- Use `aria-live="polite"` (success) and `aria-live="assertive"` (error)
- Auto-dismiss pauses on hover/focus for accessibility

## Game Feel Principles

These principles guide design decisions when alternatives are available:

1. **Narrative first, mechanics second**: In feeds and proposals, narrative text is the visually dominant element. Mechanical data (dice pools, costs) is secondary.
2. **Card metaphor**: Game objects render as cards with subtle texture, shadow, rounded corners — like physical artifacts from the table.
3. **Dot notation for charges**: Filled/empty circles are a direct translation of pencil-on-paper tracking. Instantly recognizable to tabletop players.
4. **Collapsed mechanical detail**: Skills, stats, and numbers are available but not visually dominant. A character sheet that leads with description and narrative says "this is a story game."
5. **Confirmation for permanent actions**: Retiring a trait, sacrificing a bond — these are narratively significant. Show what will happen: "Retiring 'Street Rat' will set it to Past status. You will lose access to its +1d bonus."
6. **Probabilistic language for presence**: "Commonly present at" not "is at." Preserves narrative ambiguity.

## Radix UI Primitives Used

| Radix Primitive | Used For |
|-----------------|----------|
| `@radix-ui/react-dialog` | Modal, NarrativeModal, ConfirmModal |
| `@radix-ui/react-accordion` | ProposalCard, ExpandableSection |
| `@radix-ui/react-tabs` | WorldBrowser, CharacterSheet inner tabs |
| `@radix-ui/react-dropdown-menu` | GM "More" nav dropdown |
| `@radix-ui/react-toast` | Toast notifications |
| `@radix-ui/react-select` | Action type selectors, skill/stat pickers |
| `@radix-ui/react-popover` | Target pickers, help tooltips |

---

## Interrogation Decisions (2026-03-26)

### Dark Only for MVP

- **Decision**: Ship dark theme only. No light mode toggle.
- **Rationale**: The brand navy palette is designed for dark backgrounds. Light mode would require defining a full parallel palette. Deferred to a future enhancement.
- **Implications**: No `darkMode: 'class'` in Tailwind config, no theme toggle UI, all color tokens assume dark theme

### Font Stack: Crimson Pro + Inter

- **Decision**: Crimson Pro (serif) for headings, Inter (sans-serif) for body
- **Rationale**: Crimson Pro is a modern, readable serif — sophisticated rather than dramatic. Strong enough for the "storybook" heading feel without being heavy like Cinzel. Inter is the standard UI sans-serif.
- **Implications**: Load via `next/font/google` for automatic optimization. Updated Typography section above.

### Spacing: Tailwind Defaults

- **Decision**: Use the standard Tailwind spacing scale (4px base)
- **Rationale**: Well-documented, no config overhead, universally understood. No reason to diverge.
- **Implications**: No custom spacing config in `tailwind.config.ts`

### Icons: Lucide React

- **Decision**: Use `lucide-react` as the icon library
- **Rationale**: Tree-shakeable, consistent stroke style, ~1000 icons, good variety for game UI. Pairs well with the clean Inter + Crimson aesthetic.
- **Implications**: Add `lucide-react` to dependencies. Import icons individually for tree-shaking: `import { Sword, Shield } from 'lucide-react'`

### Border Radius: Tailwind Defaults

- **Decision**: Standard Tailwind radius tokens
- **Rationale**: `rounded-md` (6px) for cards/buttons, `rounded-lg` (8px) for modals/panels, `rounded-full` for avatars/badges. No custom config needed.
- **Implications**: No custom border radius config

### Shadows: Tailwind Defaults + Color Shifts

- **Decision**: Use standard Tailwind shadow tokens, plus background color steps for elevation
- **Rationale**: On dark navy backgrounds, shadows are subtle. Elevation is primarily communicated through bg color: `bg-page` (deepest) → `bg-surface` (cards) → `bg-elevated` (hover/popup).
- **Pattern**: `shadow-sm` on cards, `shadow-md` on modals/popovers, `shadow-lg` on dropdowns. Shadows supplement, not replace, the color-based elevation.

### Focus: `:focus-visible` Only

- **Decision**: Focus rings appear only on keyboard navigation
- **Rationale**: `:focus-visible` shows rings for keyboard users but hides them on mouse click. Clean for mouse users, accessible for keyboard users. Radix handles focus trapping in dialogs/menus automatically.
- **Pattern**: Global CSS rule: `*:focus-visible { outline: 2px solid var(--brand-blue); outline-offset: 2px; }`
- **Implications**: No custom focus management system needed

### Component Variant System

- **Decision**: Three variant dimensions — Size, Intent, Tone — implemented via `cva` (class-variance-authority)
- **Rationale**: Size and Intent cover standard UI needs. Tone adds a third axis for game-specific semantic colors (meter colors as badges, status colors on cards) without overloading Intent.

#### Variant Dimensions

| Dimension | Values | Purpose |
|-----------|--------|---------|
| **Size** | `sm`, `md`, `lg` | Physical sizing: padding, font size, min-height |
| **Intent** | `primary`, `secondary`, `danger`, `ghost` | Action purpose: primary actions, secondary/de-emphasized, destructive, transparent |
| **Tone** | `brand`, `neutral`, `stress`, `ft`, `plot`, `gnosis` | Semantic color: brand teal accent, neutral gray, or meter-colored for game elements |

#### Implementation Pattern

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const badge = cva('inline-flex items-center rounded-full font-medium', {
  variants: {
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    },
    intent: {
      primary: 'bg-brand-blue text-white',
      secondary: 'bg-brand-navy-light text-text-secondary',
      danger: 'bg-meter-stress text-white',
      ghost: 'bg-transparent text-text-secondary border border-border-default',
    },
    tone: {
      brand: 'bg-brand-teal/20 text-brand-teal',
      neutral: 'bg-brand-navy-light text-text-secondary',
      stress: 'bg-meter-stress/20 text-meter-stress',
      ft: 'bg-meter-ft/20 text-meter-ft',
      plot: 'bg-meter-plot/20 text-meter-plot',
      gnosis: 'bg-meter-gnosis/20 text-meter-gnosis',
    },
  },
  defaultVariants: {
    size: 'md',
    intent: 'primary',
  },
})
```

- **Intent** and **Tone** are typically not used together — Intent drives action elements (buttons), Tone drives display elements (badges, status chips, meter labels).
- **Implications**: Add `class-variance-authority` to dependencies. All `components/ui/` primitives use cva for variant mapping. Feature components compose primitives with variant props.
