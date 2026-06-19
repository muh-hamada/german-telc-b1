# Development Plan: Brain Warm-up

## PRD Reference
- File: `brain-warm-up.md`
- Status: Complete

## Overview
Add a "Brain Warm-up" button on the home screen that opens a full-screen modal from the `rn-app-lib` library, allowing users to play brain training games before studying.

## Scope
- `app/GermanTelcB1App/package.json` — add `rn-app-lib` dependency
- `app/GermanTelcB1App/metro.config.js` — add watchFolders for lib resolution
- `app/GermanTelcB1App/tsconfig.json` — add paths for type resolution
- `app/GermanTelcB1App/assets/games/` — game thumbnail images
- `app/GermanTelcB1App/src/screens/HomeScreen.tsx` — integrate BrainGamesWrapper

## Implementation Tasks
- [x] Organize feature folder and create development plan
- [x] Install `rn-app-lib` package
- [x] Create placeholder game thumbnail assets
- [x] Update Metro config for lib resolution
- [x] Update tsconfig for type resolution from source
- [x] Add BrainGamesWrapper to HomeScreen

## Progress Log

### 2026-06-14 — Setup
- Organized feature folder
- Created development plan
- Reviewed HomeScreen structure — uses Cards, navigation, theme system

### 2026-06-14 — Implementation
- Installed `rn-app-lib` from `muh-hamada/rn-app-lib` via npm
- Created 200x200 placeholder PNG thumbnails for identical-items and odd-one-out games
- Updated `metro.config.js` to add `watchFolders` for the library path
- Updated `tsconfig.json` with `paths` mapping to resolve types from source (package doesn't ship built types)
- Added `BrainGamesWrapper` to HomeScreen between the progress card and exam structure card
- Styled the trigger button with primary purple color and rounded corners
- Used `i18n.language` for dynamic language prop (cast to `SupportedLanguage`)
- TypeScript compiles cleanly (no errors in HomeScreen)

## Decisions & Notes
- Placed the brain warm-up button after HomeProgressCard and before the exam structure card for high visibility
- Used `theme="purple"` to match the app's primary color scheme
- The game thumbnail PNGs are solid-color placeholders — replace with actual game preview images later
- The library resolves via `react-native` field in package.json (source), but types needed a `paths` workaround since `lib/` wasn't published

## Open Questions
- None

## Completion Summary
Feature fully integrated. The "🧠 Warm up your brain" button appears on the home screen. When tapped, it opens the BrainGamesWrapper modal which shows a motivational message, games hub with 2 games (Identical Items, Odd One Out), and dismiss option. All handled internally by the library. Replace placeholder game thumbnails with actual preview images when available.
