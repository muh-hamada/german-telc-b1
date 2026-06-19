# Dynamic Exam Configuration — Architecture Report

## Executive Summary

The current codebase supports 8 exam configurations (German A1/A2/B1/B2, English B1/B2, DELE Spanish B1, Goethe German A1) through a mix of static config files and **hardcoded conditional logic** scattered across 15+ screens, 19 exam wrappers, the mock exam service, and the navigation stack. Every time a new exam is added, developers must edit multiple files, add new `if/else` branches, create level-specific screens, and duplicate wrapper components — a pattern that does not scale.

This report proposes extending the existing `ExamConfig` type with a **fully declarative exam structure definition** that drives menu rendering, question routing, mock exam orchestration, score calculation, and translation key resolution — all from configuration, with zero conditional branches in the UI code.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Pain Points & Risks](#2-pain-points--risks)
3. [Proposed Solution: Declarative Exam Sections Config](#3-proposed-solution-declarative-exam-sections-config)
4. [Extended ExamConfig Type Definition](#4-extended-examconfig-type-definition)
5. [Menu Rendering: Config-Driven](#5-menu-rendering-config-driven)
6. [Mock Exam Flow: Config-Driven](#6-mock-exam-flow-config-driven)
7. [Score Calculation: Config-Driven](#7-score-calculation-config-driven)
8. [Navigation & Screen Registry](#8-navigation--screen-registry)
9. [Translation Key Strategy](#9-translation-key-strategy)
10. [Data Service Abstraction](#10-data-service-abstraction)
11. [Migration Plan](#11-migration-plan)
12. [Example: Adding Goethe A2 German](#12-example-adding-goethe-a2-german)
13. [Files That Need Changes](#13-files-that-need-changes)

---

## 1. Current Architecture Analysis

### 1.1 What Works Well (Keep)

| Component | Location | Status |
|-----------|----------|--------|
| `ExamConfig` type with `id`, `provider`, `level`, `language` | `src/config/exam-config.types.ts` | ✅ Solid foundation |
| Per-exam config files | `src/config/exams/*.config.ts` | ✅ Good separation |
| Active exam selection via `active-exam.config.ts` | `src/config/active-exam.config.ts` | ✅ Clean build-time switch |
| `examStructure` field listing section → part numbers | Each config | ⚠️ Exists but underutilized |
| Firebase collection mapping | `firebaseCollections` in config | ✅ Already externalized |
| i18n with per-language JSON files | `src/locales/{en,de,es,...}.json` | ✅ Good i18n setup |

### 1.2 Where Conditional Logic Lives (Problem Areas)

#### Menu Screens — Hardcoded Level/Provider Checks

Every menu screen reads `activeExamConfig.level` and `activeExamConfig.provider` and branches:

| Screen | File | Conditionals |
|--------|------|--------------|
| **PracticeMenuScreen** | `src/screens/practice/PracticeMenuScreen.tsx` | `isA1`, `isA2`, `isDele` — hides Grammar card for A1/A2, changes writing flow for A1/A2/DELE |
| **ReadingMenuScreen** | `src/screens/practice/ReadingMenuScreen.tsx` | `isA1`, `isA2`, `isDele` — routes to `ReadingPart1A1`, `ReadingPart1A2`, or `ReadingPart1` per part; selects different translation keys per level |
| **ListeningMenuScreen** | `src/screens/practice/ListeningMenuScreen.tsx` | `isA1`, `isA2`, `isDele` — loads 3 vs 5 parts; routes to level-specific screens; different data service calls per provider |
| **WritingMenuScreen** | `src/screens/practice/WritingMenuScreen.tsx` | `isA1`, `isA2`, `isDele` — different data loading, different navigation targets |
| **SpeakingMenuScreen** | `src/screens/practice/SpeakingMenuScreen.tsx` | `isB1`, `isB2`, `isA1`, `isA2`, `isDele`, `isGoethe` — massive branching for 6+ variants, different data fetching, different navigation per level |
| **GrammarMenuScreen** | `src/screens/practice/GrammarMenuScreen.tsx` | `isDele` — different data service calls, different translation keys |

#### Exam Wrappers — 19 Separate Components

The `src/components/exam-wrappers/` directory contains **19 wrapper components**, many of which are near-duplicates that differ only in which data service method they call and which UI component they render:

- `ReadingPart1Wrapper` internally branches on `isA1`/`isA2` to pick `ReadingPart1UI` vs `ReadingPart1A1UI` vs `ReadingPart1A2UI`
- Separate `DeleReadingPart1Wrapper`, `DeleReadingPart2Wrapper`, `DeleReadingPart3Wrapper` etc. exist
- Separate `DeleListeningPart1-5Wrapper`, `DeleGrammarPart1-2Wrapper` exist

#### Mock Exam — 4 Hardcoded Step Arrays

`src/types/mock-exam.types.ts` defines **4 separate constant arrays**:
- `MOCK_EXAM_STEPS` (B1/B2)
- `MOCK_EXAM_STEPS_A1`
- `MOCK_EXAM_STEPS_A2`
- `MOCK_EXAM_STEPS_DELE_B1`

The `MockExamRunningScreen` (400+ lines) has a massive `renderStepContent()` method with:
- A top-level `if (isDele)` branch with 12 step-ID checks
- A fallback Telc branch with 9+ step-ID checks
- Level-specific `if (!isA1 && !isA2)` guards

The `mock-exam.service.ts` has a `generateRandomExamSelection()` function with **3 fully separate code paths** for DELE, A1/A2, and B1/B2.

Score calculation in `renderResults()` and `updateStepProgress()` has separate logic per provider and level with duplicated constants like `TOTAL_WRITTEN_MAX_POINTS`, `TOTAL_WRITTEN_MAX_POINTS_A1`, `TOTAL_WRITTEN_MAX_POINTS_A2`, `TOTAL_WRITTEN_MAX_POINTS_DELE_B1`.

#### Navigation Stack — Duplicated Screen Registrations

`HomeStackNavigator.tsx` registers **70+ screen routes**, many of which are level-specific duplicates:
- `ReadingPart1`, `ReadingPart1A1`, `ReadingPart1A2`
- `ListeningPart1`, `ListeningPart1A1`, `ListeningPart1A2`
- Same pattern for Part2, Part3 of both sections
- Each with level-specific translation key resolution: `isDele ? 'nav.practice.reading.dele.part3' : 'nav.practice.reading.part3'`

#### Navigation Types — Exploded Route Map

`src/types/navigation.types.ts` has **80+ route definitions** in `HomeStackParamList`, including all the level-specific variants.

---

## 2. Pain Points & Risks

| Pain Point | Impact | Current Files Affected |
|------------|--------|----------------------|
| Adding a new exam requires editing 15+ files | High — error-prone, slow | Menu screens, wrappers, mock exam types, mock exam service, navigation, locales |
| Duplicated screen components per level | High — code bloat, inconsistencies | 19 exam wrappers, 38 exam-UI components, 47 practice screens |
| Hardcoded mock exam steps | High — must create new constant array per exam | `mock-exam.types.ts`, `mock-exam.service.ts` |
| Hardcoded scoring constants | Medium — easy to miscalculate | `mock-exam.types.ts` (12 constants), `MockExamRunningScreen.tsx` |
| Translation keys resolved with if/else chains | Medium — inconsistent, easy to miss | All menu screens, `HomeStackNavigator.tsx` |
| Navigation routes explode with each new level | Medium — type safety degrades | `navigation.types.ts`, `HomeStackNavigator.tsx` |

---

## 3. Proposed Solution: Declarative Exam Sections Config

### Core Idea

Replace the current `examStructure: { [section]: number[] }` with a **rich, ordered, declarative `sections` array** in each `ExamConfig`. Each section fully describes:

1. **What** to render (section type, part count, UI component key)
2. **How** to label it (translation keys for titles and descriptions)
3. **How** to load data (data service method name)
4. **How** to score it (max points, scoring group, point scaling)
5. **How** to route it (screen component key)
6. **How** it behaves in mock exams (time, step ordering)

The UI code becomes a **generic renderer** that iterates the config array and renders accordingly.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  ExamConfig                         │
│  ┌───────────────────────────────────────────────┐  │
│  │  sections: ExamSectionConfig[]                │  │
│  │    ├─ id: "reading"                           │  │
│  │    ├─ parts: ExamPartConfig[]                 │  │
│  │    │    ├─ partNumber: 1                       │  │
│  │    │    ├─ screenKey: "ReadingPart1"           │  │
│  │    │    ├─ uiComponentKey: "reading-mcq"       │  │
│  │    │    ├─ dataLoader: "getReadingPart1Exams"  │  │
│  │    │    ├─ dataFetcher: "getReadingPart1ExamById"│ │
│  │    │    ├─ titleKey: "practice.reading.part1"  │  │
│  │    │    ├─ descriptionKey: "..."               │  │
│  │    │    ├─ navTitleKey: "nav.practice...."     │  │
│  │    │    ├─ maxPoints: 25                       │  │
│  │    │    ├─ timeMinutes: 30                     │  │
│  │    │    └─ scoringGroup: "written"             │  │
│  │    └─ ...                                     │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  mockExam: MockExamConfig                     │  │
│  │    ├─ stepOrder: string[]                     │  │
│  │    ├─ scoringGroups: ScoringGroupConfig[]     │  │
│  │    └─ skipSections: string[]                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  menuConfig: MenuConfig                       │  │
│  │    ├─ practiceMenu: PracticeMenuItemConfig[]  │  │
│  │    └─ sectionMenuBehavior: {...}              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Generic UI Components   │
│  ├─ PracticeMenuScreen   │  ← Iterates config.menuConfig.practiceMenu
│  ├─ SectionMenuScreen    │  ← Iterates section.parts
│  ├─ MockExamRunning      │  ← Iterates config.mockExam.stepOrder
│  └─ ScoreCalculator      │  ← Uses config.mockExam.scoringGroups
└──────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Screen/Component        │
│  Registry                │
│  Maps screenKey →        │
│  React Component         │
└──────────────────────────┘
```

---

## 4. Extended ExamConfig Type Definition

Below is the proposed type extension. It **adds** to the existing `ExamConfig`, preserving backward compatibility.

```typescript
// ─── NEW TYPES ───────────────────────────────────────

/** Identifies how a part loads its exam list and individual exams */
interface DataLoaderConfig {
  /** Method name on DataService to fetch the exam list for this part */
  listMethod: string; // e.g., "getReadingPart1Exams" or "getDeleReadingPart1Exams"
  /** Method name on DataService to fetch a single exam by ID */
  fetchMethod: string; // e.g., "getReadingPart1ExamById" or "getDeleReadingPart1ExamById"
}

/** Scoring group for pass/fail calculation */
type ScoringGroupId = string; // e.g., "written", "oral", "readingWriting", "listeningSpeaking"

/** Configuration for a single exam part (e.g., Reading Part 1) */
interface ExamPartConfig {
  /** Unique part identifier within the section, e.g., "reading-1" */
  id: string;
  /** Part number (1, 2, 3, ...) */
  partNumber: number;
  
  // ── UI Rendering ──
  /** Key to look up the screen component in the ScreenRegistry */
  screenKey: string; // e.g., "ReadingPart1", "ReadingPart1A1", "DeleReadingPart1"
  /** Key to look up the UI component in the UIComponentRegistry (for mock exam wrappers) */
  uiComponentKey: string; // e.g., "ReadingPart1UI", "ReadingPart1A1UI"
  /** Key to look up the wrapper component for mock exam */
  wrapperKey: string; // e.g., "ReadingPart1Wrapper", "DeleReadingPart1Wrapper"
  
  // ── Translation Keys ──
  /** Translation key for the card title in the section menu */
  titleKey: string; // e.g., "practice.reading.part1" or "practice.reading.a1.part1"
  /** Translation key for the card description in the section menu */
  descriptionKey: string; // e.g., "practice.reading.descriptions.part1"
  /** Translation key for the navigation header */
  navTitleKey: string; // e.g., "nav.practice.reading.part1"
  
  // ── Data Loading ──
  dataLoader: DataLoaderConfig;
  
  // ── Scoring (for mock exam) ──
  /** Maximum points for this part */
  maxPoints: number;
  /** Time in minutes allocated for this part in mock exam */
  timeMinutes: number;
  /** Which scoring group this part belongs to */
  scoringGroup: ScoringGroupId;
  /** 
   * Optional score scaling factor. 
   * For DELE writing: 0.5 (max 12.5 from evaluation out of 25)
   * For most parts: undefined (defaults to auto-calculation)
   */
  scoreScaling?: number;
  
  // ── Mock Exam Step Labels ──
  /** Section name displayed in the mock exam stepper (e.g., "Leseverstehen") */
  mockExamSectionName: string;
  /** Part name displayed in the mock exam stepper (e.g., "Teil 1: Globalverstehen") */
  mockExamPartName: string;
  /** Section number for grouping in mock exam results (1=reading, 2=grammar, 3=listening, etc.) */
  mockExamSectionNumber: number;
  
  // ── Behavioral Flags ──
  /** If true, this part shows an exam selection modal before navigating */
  hasExamSelection: boolean;
  /** If true, this part is skipped in mock exam (e.g., speaking) */
  skipInMockExam?: boolean;
  /** Navigation params factory for this part (for parts that need custom params) */
  navigationParamKey?: string; // e.g., "examId", "topicId", "scenarioId"
}

/** Configuration for an exam section (e.g., Reading, Listening) */
interface ExamSectionConfig {
  /** Section identifier: "reading", "listening", "grammar", "writing", "speaking" */
  id: string;
  /** Display order in the practice menu (lower = higher) */
  order: number;
  /** Whether this section is enabled */
  enabled: boolean;
  /** Translation key for the section card title in the practice menu */
  menuTitleKey: string; // e.g., "practice.reading.title"
  /** Translation key for the section card description in the practice menu */
  menuDescriptionKey: string; // e.g., "practice.reading.descriptions.main"
  /** Parts within this section */
  parts: ExamPartConfig[];
  /** 
   * Menu behavior: 
   * - "submenu": Navigate to a sub-menu that lists all parts (default for multi-part sections)
   * - "direct": Navigate directly to exam selection for single-part sections
   * - "modal": Show exam selection modal inline (e.g., B1/B2 writing)
   */
  menuBehavior: 'submenu' | 'direct' | 'modal';
  /** Extra items to show in the section menu (e.g., Grammar Study, Speaking Structure) */
  extraMenuItems?: ExtraMenuItem[];
}

/** Extra menu items within a section (e.g., "Grammar Study" card in Grammar menu) */
interface ExtraMenuItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  screenKey: string;
  /** If specified, these translation key params are passed (e.g., { count: 150 }) */
  titleParams?: Record<string, any>;
  descriptionParams?: Record<string, any>;
}

/** Scoring group configuration for mock exam results */
interface ScoringGroupConfig {
  id: ScoringGroupId;
  /** Translation key for the group name in results (e.g., "mockExam.writtenExam") */
  labelKey: string;
  /** Maximum points for this group */
  maxPoints: number;
  /** Points required to pass this group (60% default) */
  passingPoints: number;
  /** Which mockExamSectionNumbers belong to this group */
  sectionNumbers: number[];
}

/** Mock exam configuration */
interface MockExamConfig {
  /** Ordered list of part IDs that define the mock exam flow */
  stepOrder: string[]; // e.g., ["reading-1", "reading-2", "reading-3", "language-1", ...]
  /** Scoring groups for pass/fail calculation */
  scoringGroups: ScoringGroupConfig[];
  /** Total max points (sum of all non-skipped groups) */
  totalMaxPoints: number;
  /** Points required to pass overall */
  passingTotalPoints: number;
  /** Section numbers that are always skipped (e.g., [5] for speaking) */
  skipSectionNumbers: number[];
  /** Score multiplier for points-per-question calculation (3 for Telc, 1 for DELE) */
  scoreMultiplier: number;
}

// ─── EXTENDED EXAM CONFIG ────────────────────────────

interface ExamConfig {
  // ... all existing fields remain unchanged ...
  
  /** NEW: Full declarative exam structure replacing examStructure */
  sections: ExamSectionConfig[];
  
  /** NEW: Mock exam orchestration config */
  mockExam: MockExamConfig;
  
  /** 
   * DEPRECATED: Keep for backward compatibility during migration.
   * Will be removed once all code reads from `sections`.
   */
  examStructure: { [examType: string]: number[] };
}
```

---

## 5. Menu Rendering: Config-Driven

### 5.1 PracticeMenuScreen (Before → After)

**Before** (current code):
```tsx
const isA1 = activeExamConfig.level === 'A1';
const isA2 = activeExamConfig.level === 'A2';
const isDele = activeExamConfig.provider === 'dele';

// Hardcoded cards with conditional visibility
{!isA1 && !isA2 && (
  <Card onPress={handleGrammarPress}>...</Card>
)}
```

**After** (config-driven):
```tsx
const { sections } = activeExamConfig;

// Dynamically render section cards from config
{sections
  .filter(s => s.enabled)
  .sort((a, b) => a.order - b.order)
  .map(section => (
    <Card key={section.id} onPress={() => handleSectionPress(section)}>
      <Text>{t(section.menuTitleKey)}</Text>
      <Text>{t(section.menuDescriptionKey)}</Text>
    </Card>
  ))
}
```

### 5.2 Section Menu Screens (ReadingMenu, ListeningMenu, etc.)

Replace all 5 separate menu screens (`ReadingMenuScreen`, `ListeningMenuScreen`, `WritingMenuScreen`, `SpeakingMenuScreen`, `GrammarMenuScreen`) with **one generic `SectionMenuScreen`**:

```tsx
// SectionMenuScreen.tsx
const SectionMenuScreen: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const section = activeExamConfig.sections.find(s => s.id === sectionId);
  
  return (
    <ScrollView>
      <SectionStatsCard section={sectionId} />
      
      {section.parts.map(part => (
        <PartCard 
          key={part.id}
          part={part}
          onPress={() => handlePartPress(part)}
        />
      ))}
      
      {section.extraMenuItems?.map(item => (
        <ExtraMenuCard key={item.id} item={item} />
      ))}
    </ScrollView>
  );
};
```

No more `isA1`, `isA2`, `isDele` checks. The config determines what renders.

### 5.3 Translation Key Resolution (Before → After)

**Before** (scattered across every menu screen):
```tsx
const getCardTitle = (partNumber: number) => {
  if (isA2) return t('practice.reading.a2.part1');
  return isA1 ? t('practice.reading.a1.part1') : t('practice.reading.part1');
};
```

**After** (from config):
```tsx
// The part already has the correct translation key
<Text>{t(part.titleKey)}</Text>
```

The exam config specifies the exact translation key per part, per exam:
```typescript
// german-a1.config.ts → sections[0].parts[0]
{
  titleKey: 'practice.reading.a1.part1',
  descriptionKey: 'practice.reading.descriptions.a1.part1',
  navTitleKey: 'nav.practice.reading.a1.part1',
}

// german-b1.config.ts → sections[0].parts[0]
{
  titleKey: 'practice.reading.part1',
  descriptionKey: 'practice.reading.descriptions.part1',
  navTitleKey: 'nav.practice.reading.part1',
}
```

---

## 6. Mock Exam Flow: Config-Driven

### 6.1 Replace Hardcoded Step Arrays

**Before**: 4 separate constant arrays (`MOCK_EXAM_STEPS`, `MOCK_EXAM_STEPS_A1`, `MOCK_EXAM_STEPS_A2`, `MOCK_EXAM_STEPS_DELE_B1`) in `mock-exam.types.ts`.

**After**: The `sections` config already contains all the information. Generate mock exam steps from the config:

```typescript
// mock-exam.service.ts
export const generateMockExamSteps = (config: ExamConfig): MockExamStep[] => {
  const { mockExam, sections } = config;
  
  return mockExam.stepOrder
    .map(partId => {
      // Find the part config by ID across all sections
      for (const section of sections) {
        const part = section.parts.find(p => p.id === partId);
        if (part) {
          return {
            id: part.id,
            sectionNumber: part.mockExamSectionNumber,
            sectionName: part.mockExamSectionName,
            partNumber: part.partNumber,
            partName: part.mockExamPartName,
            maxPoints: part.maxPoints,
            timeMinutes: part.timeMinutes,
            isCompleted: false,
            skipInMockExam: part.skipInMockExam,
            scoreScaling: part.scoreScaling,
          };
        }
      }
      return null;
    })
    .filter(Boolean);
};
```

### 6.2 Replace renderStepContent() Branching

**Before**: A 60-line function with `if (isDele) { if (currentStep.id === 'reading-1') return <DeleReadingPart1Wrapper ...>` etc.

**After**: Use a **wrapper component registry** keyed by `wrapperKey`:

```typescript
// screen-registry.ts
import ReadingPart1Wrapper from '../components/exam-wrappers/ReadingPart1Wrapper';
import DeleReadingPart1Wrapper from '../components/exam-wrappers/DeleReadingPart1Wrapper';
// ... all wrappers

export const WRAPPER_REGISTRY: Record<string, React.ComponentType<WrapperProps>> = {
  'ReadingPart1Wrapper': ReadingPart1Wrapper,
  'ReadingPart2Wrapper': ReadingPart2Wrapper,
  'ReadingPart3Wrapper': ReadingPart3Wrapper,
  'DeleReadingPart1Wrapper': DeleReadingPart1Wrapper,
  'DeleReadingPart2Wrapper': DeleReadingPart2Wrapper,
  // ... etc.
  'LanguagePart1Wrapper': LanguagePart1Wrapper,
  'LanguagePart2Wrapper': LanguagePart2Wrapper,
  'ListeningPart1Wrapper': ListeningPart1Wrapper,
  'WritingWrapper': WritingWrapper,
};
```

```tsx
// MockExamRunningScreen.tsx — renderStepContent()
const renderStepContent = () => {
  if (!currentStep) return null;
  
  const testId = getTestIdForStep(currentStep.id, examProgress.selectedTests);
  
  // Find part config
  const partConfig = findPartConfig(activeExamConfig, currentStep.id);
  
  // Handle skipped sections (e.g., speaking)
  if (partConfig?.skipInMockExam) {
    return <SpeakingSkipView onSkip={() => handleCompleteStep(0, [])} />;
  }
  
  // Look up wrapper component from registry
  const WrapperComponent = WRAPPER_REGISTRY[partConfig.wrapperKey];
  if (!WrapperComponent) return null;
  
  return <WrapperComponent testId={testId} onComplete={handleCompleteStep} />;
};
```

### 6.3 Replace generateRandomExamSelection() Branching

**Before**: 3 completely separate code paths for DELE, A1/A2, and B1/B2 in `mock-exam.service.ts`.

**After**: Iterate `sections` from config:

```typescript
export const generateRandomExamSelection = async (config: ExamConfig) => {
  const selectedTests: Record<string, number | string> = {};
  
  for (const section of config.sections) {
    for (const part of section.parts) {
      if (part.skipInMockExam) continue;
      
      // Call the list method dynamically
      const exams = await (dataService as any)[part.dataLoader.listMethod]();
      selectedTests[part.id] = getRandomId(exams);
    }
  }
  
  return selectedTests;
};
```

---

## 7. Score Calculation: Config-Driven

### 7.1 Current Problems

Score calculation is hardcoded in multiple places:
- `MockExamRunningScreen.tsx` → `handleCompleteStep()` has DELE/A1/B1 branches
- `MockExamRunningScreen.tsx` → `renderResults()` has DELE/Telc branches with hardcoded max points
- `mock-exam.service.ts` → `updateStepProgress()` duplicates the same logic
- `mock-exam.types.ts` → 12 separate scoring constants

### 7.2 Config-Driven Scoring

All scoring information lives in `mockExam.scoringGroups`:

```typescript
// german-b1.config.ts
mockExam: {
  scoringGroups: [
    {
      id: 'written',
      labelKey: 'mockExam.writtenExam',
      maxPoints: 225,  // Reading(75) + Grammar(30) + Listening(75) + Writing(45)
      passingPoints: 135,
      sectionNumbers: [1, 2, 3, 4],
    },
    {
      id: 'oral',
      labelKey: 'mockExam.oralExam',
      maxPoints: 75,
      passingPoints: 45,
      sectionNumbers: [5],
    },
  ],
  totalMaxPoints: 300,
  passingTotalPoints: 180,
  scoreMultiplier: 3,
}

// dele-spanish-b1.config.ts
mockExam: {
  scoringGroups: [
    {
      id: 'readingWriting',
      labelKey: 'mockExam.deleReadingWriting',
      maxPoints: 50,
      passingPoints: 30,
      sectionNumbers: [1, 2, 4],
    },
    {
      id: 'listeningSpeaking',
      labelKey: 'mockExam.deleListeningSpeaking',
      maxPoints: 50,
      passingPoints: 30,
      sectionNumbers: [3, 5],
    },
  ],
  totalMaxPoints: 100,
  passingTotalPoints: 60,
  scoreMultiplier: 1,
}
```

Generic score calculator:

```typescript
// score-calculator.ts
export const calculateResults = (
  config: ExamConfig,
  steps: MockExamStep[]
) => {
  const { mockExam } = config;
  
  return mockExam.scoringGroups.map(group => {
    const groupSteps = steps.filter(s => group.sectionNumbers.includes(s.sectionNumber));
    const score = groupSteps.reduce((sum, s) => sum + (s.score || 0), 0);
    const passed = score >= group.passingPoints;
    
    return {
      groupId: group.id,
      labelKey: group.labelKey,
      score,
      maxPoints: group.maxPoints,
      passingPoints: group.passingPoints,
      percentage: (score / group.maxPoints) * 100,
      passed,
    };
  });
};

export const calculateOverallResult = (
  config: ExamConfig,
  steps: MockExamStep[]
) => {
  const totalScore = steps.reduce((sum, s) => sum + (s.score || 0), 0);
  const groupResults = calculateResults(config, steps);
  const allGroupsPassed = groupResults.every(g => g.passed);
  const passedOverall = totalScore >= config.mockExam.passingTotalPoints && allGroupsPassed;
  
  return { totalScore, passedOverall, groupResults };
};
```

### 7.3 Step Score Calculation

Replace the per-step branching in `handleCompleteStep()`:

```typescript
const handleCompleteStep = async (correctCount: number, answers: UserAnswer[]) => {
  const partConfig = findPartConfig(activeExamConfig, currentStep.id);
  
  let score: number;
  if (partConfig.scoreScaling !== undefined) {
    // Custom scaling (e.g., DELE writing: correctCount * 0.5)
    score = correctCount * partConfig.scoreScaling;
  } else if (partConfig.maxPoints && answers.length > 0) {
    // Auto-scale: distribute maxPoints across questions
    const pointsPerQuestion = partConfig.maxPoints / answers.length;
    score = Math.round(correctCount * pointsPerQuestion * 10) / 10;
  } else {
    score = correctCount;
  }
  
  await updateStepProgress(currentStep.id, score, true, answers);
};
```

---

## 8. Navigation & Screen Registry

### 8.1 Problem

The navigation stack has 70+ screen definitions, many of which are level-specific duplicates. Adding a new exam requires adding new route types and screen registrations.

### 8.2 Proposed Approach

Keep the current navigation approach but use a **screen registry** that maps `screenKey` → component, and generate navigation routes from the config at startup.

```typescript
// screen-registry.ts
export const SCREEN_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Reading screens
  'ReadingPart1': ReadingPart1Screen,
  'ReadingPart1A1': ReadingPart1A1Screen,
  'ReadingPart1A2': ReadingPart1A2Screen,
  'ReadingPart2': ReadingPart2Screen,
  // ... etc.
  
  // DELE screens  
  'DeleReadingPart1': DeleReadingPart1Screen,  // if they exist as separate screens
  // ... etc.
  
  // Menu screens (generic)
  'SectionMenu': SectionMenuScreen,
};
```

For the navigator, instead of listing every possible screen, only register screens that the active exam config references:

```tsx
// HomeStackNavigator.tsx
const HomeStackNavigator = () => {
  const { sections } = activeExamConfig;
  
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PracticeMenu" component={PracticeMenuScreen} />
      
      {/* Dynamically register section menus and part screens */}
      {sections.filter(s => s.enabled).map(section => (
        <React.Fragment key={section.id}>
          {/* Section menu screen */}
          <Stack.Screen
            name={`${capitalize(section.id)}Menu`}
            component={SectionMenuScreen}
            initialParams={{ sectionId: section.id }}
            options={{ headerTitle: () => <HeaderTitle titleKey={section.menuTitleKey} /> }}
          />
          
          {/* Part screens */}
          {section.parts.map(part => {
            const ScreenComponent = SCREEN_REGISTRY[part.screenKey];
            return ScreenComponent ? (
              <Stack.Screen
                key={part.id}
                name={part.screenKey}
                component={ScreenComponent}
                options={{ headerTitle: () => <HeaderTitle titleKey={part.navTitleKey} /> }}
              />
            ) : null;
          })}
        </React.Fragment>
      ))}
      
      {/* Static screens */}
      <Stack.Screen name="MockExamRunning" ... />
    </Stack.Navigator>
  );
};
```

### 8.3 Navigation Types

Keep `HomeStackParamList` but auto-generate it or use a union type approach:

```typescript
// All screen keys used across all configs
type AllScreenKeys = 
  | 'Home' | 'PracticeMenu' | 'ExamStructure'
  | 'ReadingPart1' | 'ReadingPart1A1' | 'ReadingPart1A2'
  // ... etc. (keep existing for type safety)
  ;

// Or, for a more flexible approach:
type DynamicScreenParams = { examId: string } | { topicId: string } | { scenarioId: string };
```

---

## 9. Translation Key Strategy

### 9.1 Current State

Translation keys follow an inconsistent pattern, resolved with if/else chains:
- `practice.reading.part1` (B1/B2)
- `practice.reading.a1.part1` (A1)
- `practice.reading.a2.part1` (A2)
- `practice.reading.dele.part3` (DELE)

### 9.2 Proposed Strategy

**No change needed to translation files.** Simply put the correct translation key directly in the exam config for each part. This means:

1. **Existing translation keys stay as-is** in `en.json`, `de.json`, etc.
2. Each `ExamPartConfig.titleKey` points to the correct key for that exam's level/provider
3. No runtime resolution logic needed — the config *is* the resolution

For new exams, just add new translation keys following the existing pattern:
```json
// en.json (add for Goethe A2)
{
  "practice.reading.goethe.a2.part1": "Part 1: Understanding Notices",
  "practice.reading.goethe.a2.part2": "Part 2: Reading Comprehension",
  ...
}
```

And reference them in the config:
```typescript
// goethe-german-a2.config.ts
parts: [
  {
    titleKey: 'practice.reading.goethe.a2.part1',
    ...
  }
]
```

---

## 10. Data Service Abstraction

### 10.1 Current Problem

The `DataService` class has ~80 methods, many of which are level/provider-specific:
- `getReadingPart1Exams()` / `getReadingPart1A1Exams()` / `getReadingPart1A2Exams()` / `getDeleReadingPart1Exams()`
- Same pattern for every section and part

### 10.2 Proposed Approach

Keep existing DataService methods (they map to specific Firestore document structures), but use the config's `dataLoader.listMethod` and `dataLoader.fetchMethod` strings to call them dynamically:

```typescript
// Generic data loading utility
export const loadExamsForPart = async (part: ExamPartConfig): Promise<any[]> => {
  const method = (dataService as any)[part.dataLoader.listMethod];
  if (!method) {
    console.warn(`DataService method not found: ${part.dataLoader.listMethod}`);
    return [];
  }
  return method.call(dataService);
};

export const loadExamById = async (part: ExamPartConfig, examId: string | number): Promise<any> => {
  const method = (dataService as any)[part.dataLoader.fetchMethod];
  if (!method) {
    console.warn(`DataService method not found: ${part.dataLoader.fetchMethod}`);
    return null;
  }
  return method.call(dataService, examId);
};
```

This avoids rewriting `DataService` entirely while eliminating the branching at the call site.

### 10.3 Future Improvement

Long-term, consider making `DataService` generic by having a single method:
```typescript
getExams(docId: string): Promise<any[]>
getExamById(docId: string, examId: string | number): Promise<any>
```
Where `docId` comes from the config. But this is a larger refactor and not required for the initial implementation.

---

## 11. Migration Plan

### Phase 1: Add Config (Non-Breaking)
1. Add `sections` and `mockExam` fields to `ExamConfig` type (keep `examStructure` as deprecated)
2. Populate `sections` and `mockExam` in each existing exam config file
3. No UI changes yet — existing code continues to work

### Phase 2: Generic Section Menu
4. Create generic `SectionMenuScreen` component
5. Create screen and wrapper registries
6. Migrate `ReadingMenuScreen` to use config (as proof of concept)
7. Validate with all 8 exam configs
8. Migrate remaining section menus one at a time

### Phase 3: Generic Practice Menu
9. Make `PracticeMenuScreen` iterate `sections` from config
10. Remove `isA1`, `isA2`, `isDele` checks

### Phase 4: Config-Driven Mock Exam
11. Create `generateMockExamSteps()` from config
12. Create `score-calculator.ts` utility
13. Migrate `MockExamRunningScreen.renderStepContent()` to use wrapper registry
14. Migrate `handleCompleteStep()` to use config scoring
15. Migrate `renderResults()` to use config scoring groups
16. Remove `MOCK_EXAM_STEPS_*` constants
17. Remove scoring constants

### Phase 5: Config-Driven Navigation
18. Refactor `HomeStackNavigator` to register screens from config
19. Simplify `navigation.types.ts`
20. Remove hardcoded `isDele ? ... : ...` from screen options

### Phase 6: Cleanup
21. Remove `examStructure` field
22. Remove `isA1`/`isA2`/`isDele` checks from all files
23. Delete unused level-specific menu screens
24. Update documentation

---

## 12. Example: Adding Goethe A2 German

With the new system, adding a new exam requires **only**:

### Step 1: Create the exam config file

```typescript
// src/config/exams/goethe-german-a2.config.ts
export const goetheGermanA2Config: ExamConfig = {
  id: 'goethe-german-a2',
  language: 'german',
  level: 'A2',
  provider: 'goethe',
  
  // ... standard fields (bundleId, firebase, ads, premium, etc.) ...
  
  sections: [
    {
      id: 'reading',
      order: 1,
      enabled: true,
      menuTitleKey: 'practice.reading.title',
      menuDescriptionKey: 'practice.reading.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'reading-1',
          partNumber: 1,
          screenKey: 'ReadingPart1A2',  // reuse existing A2 screen
          uiComponentKey: 'ReadingPart1A2UI',
          wrapperKey: 'ReadingPart1Wrapper',
          titleKey: 'practice.reading.a2.part1',
          descriptionKey: 'practice.reading.descriptions.a2.part1',
          navTitleKey: 'nav.practice.reading.a2.part1',
          dataLoader: {
            listMethod: 'getReadingPart1A2Exams',
            fetchMethod: 'getReadingPart1A2ExamById',
          },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionNumber: 1,
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 1: Globalverstehen',
          hasExamSelection: true,
        },
        // ... parts 2, 3 ...
      ],
    },
    {
      id: 'listening',
      order: 2,
      enabled: true,
      // ...
      parts: [/* ... */],
    },
    {
      id: 'writing',
      order: 3,
      enabled: true,
      menuBehavior: 'submenu', // A2 has 2 writing parts
      parts: [/* ... */],
    },
    {
      id: 'speaking',
      order: 4,
      enabled: true,
      parts: [
        {
          id: 'speaking-1',
          // ...
          skipInMockExam: true,
        },
        // ...
      ],
    },
    // No grammar section for A2
  ],
  
  mockExam: {
    stepOrder: [
      'listening-1', 'listening-2', 'listening-3',
      'reading-1', 'reading-2', 'reading-3',
      'writing-part1', 'writing-part2',
      'speaking-1', 'speaking-2', 'speaking-3',
    ],
    scoringGroups: [
      {
        id: 'written',
        labelKey: 'mockExam.writtenExam',
        maxPoints: 45,
        passingPoints: 27,
        sectionNumbers: [1, 3, 4],
      },
      {
        id: 'oral',
        labelKey: 'mockExam.oralExam',
        maxPoints: 15,
        passingPoints: 9,
        sectionNumbers: [5],
      },
    ],
    totalMaxPoints: 60,
    passingTotalPoints: 36,
    skipSectionNumbers: [5],
    scoreMultiplier: 3,
  },
};
```

### Step 2: Register in index.ts

```typescript
// src/config/exams/index.ts
import { goetheGermanA2Config } from './goethe-german-a2.config';

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  // ... existing ...
  'goethe-german-a2': goetheGermanA2Config,
};
```

### Step 3: Add translation keys (if needed)

If the Goethe A2 reuses A2 question formats, the existing translation keys work. If new labels are needed, add them to the locale files.

### Step 4: Set active exam and build

```typescript
// active-exam.config.ts
const ACTIVE_EXAM_ID = 'goethe-german-a2';
```

**That's it.** No menu screen changes, no wrapper changes, no mock exam type changes, no navigation changes.

---

## 13. Files That Need Changes

### New Files to Create
| File | Purpose |
|------|---------|
| `src/utils/screen-registry.ts` | Maps `screenKey` → React component |
| `src/utils/wrapper-registry.ts` | Maps `wrapperKey` → wrapper component |
| `src/utils/score-calculator.ts` | Generic score calculation from config |
| `src/screens/practice/SectionMenuScreen.tsx` | Generic section menu screen |
| `src/utils/exam-config.utils.ts` | Helper functions (findPartConfig, generateMockExamSteps, etc.) |

### Files to Modify
| File | Change |
|------|--------|
| `src/config/exam-config.types.ts` | Add `ExamSectionConfig`, `ExamPartConfig`, `MockExamConfig`, etc. |
| `src/config/exams/*.config.ts` (8 files) | Add `sections` and `mockExam` fields |
| `src/screens/practice/PracticeMenuScreen.tsx` | Replace conditionals with config iteration |
| `src/screens/practice/ReadingMenuScreen.tsx` | Replace with generic `SectionMenuScreen` |
| `src/screens/practice/ListeningMenuScreen.tsx` | Replace with generic `SectionMenuScreen` |
| `src/screens/practice/WritingMenuScreen.tsx` | Replace with generic `SectionMenuScreen` |
| `src/screens/practice/SpeakingMenuScreen.tsx` | Replace with generic `SectionMenuScreen` |
| `src/screens/practice/GrammarMenuScreen.tsx` | Replace with generic `SectionMenuScreen` |
| `src/screens/MockExamScreen.tsx` | Read metadata from config instead of conditionals |
| `src/screens/MockExamRunningScreen.tsx` | Use wrapper registry + config-driven scoring |
| `src/services/mock-exam.service.ts` | Generate steps and selections from config |
| `src/types/mock-exam.types.ts` | Remove hardcoded step arrays and constants |
| `src/navigation/HomeStackNavigator.tsx` | Dynamic screen registration from config |
| `src/types/navigation.types.ts` | Simplify route types |

### Files That Can Be Deleted (Phase 6)
The 5 individual section menu screens can be removed once `SectionMenuScreen` replaces them. The 4 `MOCK_EXAM_STEPS_*` constant arrays and 12 scoring constants can be deleted. The exam wrappers that just branch on `isA1`/`isA2` internally can be consolidated.

---

## Summary

The key insight is that **all the conditional logic in the current code is really just configuration that was written as code**. By making the exam config the single source of truth for:

1. Which sections and parts exist
2. What they're called (translation keys)
3. How to load their data
4. Which UI components to render them with
5. How they're scored in mock exams
6. What order they appear in

...the UI code becomes a generic renderer that works for any exam structure, and adding a new exam becomes a purely declarative task of writing a config file.
