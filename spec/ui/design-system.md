# Design System

> Status: Draft
> Last verified: 2026-03-23
> Related: [components.md](components.md)

## Theme

**Dark theme by default.** The current backend-served UI uses dark mode. The new frontend should default to dark and optionally support light mode.

Tailwind CSS config: `darkMode: 'class'`, apply `dark` class to `<html>` at app startup.

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

- **Headings**: A serif or semi-serif font with character. Game titles, character names, location names are proper nouns in a fictional world.
- **Body text**: Clean sans-serif for readability. Narratives and descriptions need to be easy to read at length.
- **Numbers**: Monospace or tabular figures for meter values, charges, and dice pools. Resource numbers should be scannable and aligned.

## Responsive Design

### Breakpoint: 768px

| Element | Mobile (< 768px) | Desktop (>= 768px) |
|---------|------------------|---------------------|
| Navigation | Bottom bar, fixed | Top bar, sticky |
| Content padding | `padding-bottom: nav-height` | `padding-top: nav-height` |
| Character Sheet | Tabbed sections | Two-column layout |
| GM Queue cards | Bottom sheet for approval form | Inline expansion |
| DataTable | Card-based layout | Full table |

### Touch Targets

All interactive elements: minimum 44x44px hit area. Charge dots are decorative on character sheet but interactive (for recharge) on GM edit — interactive variant needs larger hit area.

## Animation & Motion

Minimal and purposeful. No decorative animation.

- **Meter changes**: Animate bar filling/depleting segment by segment. Makes resource expenditure feel physical.
- **Dice pool preview**: Build up visually as modifiers are added. Each +1d should feel like adding a die.
- **Proposal status change**: Brief satisfying transition when approved/rejected. The player waited for this — reward the moment.
- **Clock advancement**: Newly filled segment sweeps in. Completion gets a distinct animation.
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
