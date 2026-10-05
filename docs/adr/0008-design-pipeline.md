# 0008 - Design pipeline: Design System, canvas, tokens, Codex assets

- Status: Accepted
- Date: 2026-10-05

## Context

The UI has hardcoded colors (`constants/theme.ts` duplicates hex values from `tailwind.config.js`), a single dark palette and no illustrated assets, while v1 needs light and dark themes and a layered isometric Castle. Agents write screen code well but should not invent visual language per ticket, and image generation is a different tool chain from the code waves.

## Decision

**Order.** No screen is implemented before its design exists:
1. A "JAA Design System" artifact (Claude Design System type) defines semantic tokens, type scale, spacing, radius, elevation, iconography and component specs.
2. Screen designs for every screen and state in `docs/prd/v1.md` live in a Claude Design canvas built on that system.
3. Tokens flow into `tailwind.config.js` as CSS variables with light and dark values, consumed through NativeWind `className`. Screens use semantic tokens only.

**Themes.** Light and dark follow the system setting. Minimum token set: `background`, `surface`, `surface-raised`, `border`, `text`, `text-muted`, `primary`, `gold`, `danger`, `warning`, `success`, `on-primary`. Every text/background pair meets WCAG AA (4.5:1 body, 3:1 large text and icons) in both themes.

**Art style.** Isometric flat illustration with soft shadows. The Castle is a stack of transparent layers on one shared canvas and anchor: base per state (`HEALTHY`, `UNDER_ATTACK`, `RUINS`) plus one layer per owned Mejora tier.

**Assets.** Every image asset (Castle layers, category icons, empty-state illustrations, app icon) is requested as a GitHub issue labelled `ready-for-codex`; the owner feeds it to Codex. These issues never go through `/wave`. Each issue states: prompt, style reference (Design System artifact link and an existing asset), size, format (PNG or SVG), transparent background, destination path under `assets/`, and whether light and dark variants are needed. Layout: `docs/agents/issue-tracker.md`.

## Consequences

- Phase 2 (design) runs in parallel with phase 1 (data) and blocks phase 3 screens.
- `constants/theme.ts` hex values are removed when the token set lands; a hex literal outside the token files is a review finding.
- Screen tickets reference the canvas frame they implement; asset tickets block the screen tickets that use them.
