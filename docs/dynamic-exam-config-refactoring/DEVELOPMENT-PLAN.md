# Dynamic Exam Configuration — Development Plan

## AI Implementation Instructions

> **When continuing this implementation, follow these rules:**
>
> 1. Read this file first to understand the current state of the refactoring.
> 2. Find the first phase/step with status `pending` — that is your next task.
> 3. Before starting work, change the status to `in-progress`.
> 4. Implement **only** the scope described in that step. Do not look ahead or make changes for future steps.
> 5. After completing code changes, change the status to `to-verify`.
> 6. Run the validation described in the step (unit tests are mandatory; Maestro is optional based on what the step specifies).
> 7. If validation passes, change the status to `completed-and-verified`.
> 8. If validation fails, fix the issue before moving the status to `completed-and-verified`.
> 9. Move to the next step and repeat.
>
> **Status values:**
> - `pending` — Not yet started
> - `in-progress` — Currently being implemented
> - `to-verify` — Code changes done, needs validation
> - `completed-and-verified` — Implemented and validated, ready to move on
>
> **Reference documents (READ BEFORE IMPLEMENTING):**
> - [Architecture Proposal](./dynamic-exam-configuration-report.md) — Full design with exact TypeScript interfaces, algorithms, and code patterns. **DO NOT invent schemas or guess field names. If a step has a "Design reference" pointing to a section, read that section and implement what it specifies verbatim.**
> - [Testing Strategy](./testing-validation-strategy-report.md) — Testing approach and tool recommendations
>
> **Critical rule**: Each step below may include a **"Design reference"** field. When present, you MUST read the referenced section of the architecture report before writing any code. The referenced section contains the exact types, function signatures, algorithms, or code patterns to implement. Do not deviate from the specification unless you encounter a compilation error or type mismatch with existing code — in that case, document the deviation in a comment.

---

## Overview

This plan refactors the app from hardcoded conditional logic (if/else on `isA1`/`isA2`/`isDele`/etc.) to a **fully declarative exam configuration** that drives menu rendering, question routing, mock exam orchestration, and score calculation.

**Goal**: Adding a new exam (e.g., Goethe A2 German) requires only creating a config file and registering it — zero changes to UI code, navigation, or mock exam logic.

**Approach**: Gradual, phase-by-phase. Each phase produces a working app. We validate after each step before proceeding.

---

## Phase 1: Foundation — Types, Registries, and Config Population

This phase adds the new types and populates configs without changing any UI code. The app continues to work exactly as before.

---

### Step 1.1: Add New Type Definitions

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 4](./dynamic-exam-configuration-report.md#4-extended-examconfig-type-definition) for the **exact** type definitions to implement. Copy them verbatim.

**Scope**: Add the new TypeScript interfaces to `src/config/exam-config.types.ts`. Extend `ExamConfig` to include `sections` and `mockExam` as **optional** fields (to avoid breaking existing configs before they're populated).

**Exact interfaces to add** (all must be exported):

```typescript
export interface DataLoaderConfig {
  listMethod: string;   // DataService method name for fetching exam list
  fetchMethod: string;  // DataService method name for fetching single exam by ID
}

export type ScoringGroupId = string;

export interface ExamPartConfig {
  id: string;                    // Unique part ID, e.g., "reading-1"
  partNumber: number;            // 1, 2, 3, ...
  screenKey: string;             // Key in SCREEN_REGISTRY
  uiComponentKey: string;        // Key in UI component registry
  wrapperKey: string;            // Key in WRAPPER_REGISTRY
  titleKey: string;              // i18n key for menu card title
  descriptionKey: string;        // i18n key for menu card description
  navTitleKey: string;           // i18n key for navigation header
  dataLoader: DataLoaderConfig;
  maxPoints: number;
  timeMinutes: number;
  scoringGroup: ScoringGroupId;
  scoreScaling?: number;         // e.g., 0.5 for DELE writing
  mockExamSectionName: string;   // e.g., "Leseverstehen"
  mockExamPartName: string;      // e.g., "Teil 1: Globalverstehen"
  mockExamSectionNumber: number; // Grouping number for results
  hasExamSelection: boolean;     // true = show modal, false = direct nav
  skipInMockExam?: boolean;      // true for speaking parts
  navigationParamKey?: string;   // e.g., "examId", "topicId"
}

export interface ExtraMenuItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  screenKey: string;
  titleParams?: Record<string, any>;
  descriptionParams?: Record<string, any>;
}

export interface ExamSectionConfig {
  id: string;                              // "reading", "listening", etc.
  order: number;                           // Display order (lower = first)
  enabled: boolean;                        // false = not shown in menu
  menuTitleKey: string;                    // i18n key
  menuDescriptionKey: string;              // i18n key
  parts: ExamPartConfig[];
  menuBehavior: 'submenu' | 'direct' | 'modal';
  extraMenuItems?: ExtraMenuItem[];
}

export interface ScoringGroupConfig {
  id: ScoringGroupId;
  labelKey: string;              // i18n key for results display
  maxPoints: number;
  passingPoints: number;         // Usually 60% of maxPoints
  sectionNumbers: number[];      // Which mockExamSectionNumbers belong here
}

export interface MockExamConfig {
  stepOrder: string[];           // Ordered part IDs for mock exam flow
  scoringGroups: ScoringGroupConfig[];
  totalMaxPoints: number;
  passingTotalPoints: number;
  skipSectionNumbers: number[];  // e.g., [5] for speaking
  scoreMultiplier: number;       // 3 for Telc, 1 for DELE
}
```

**Changes to existing `ExamConfig` interface**: Add these two optional fields at the end:
```typescript
  sections?: ExamSectionConfig[];
  mockExam?: MockExamConfig;
```

**Files to change**:
- `src/config/exam-config.types.ts`

**Expected outcome**:
- All interfaces above are defined and exported
- `ExamConfig` interface has `sections?: ExamSectionConfig[]` and `mockExam?: MockExamConfig`
- Existing code compiles without errors (fields are optional)
- No runtime behavior change

**Validation**:
- Unit test: TypeScript compilation passes (`npx tsc --noEmit`)
- Unit test: Create `src/config/__tests__/exam-config-types.test.ts` — import each new type, create a mock object conforming to it, and assert TypeScript doesn't error

---

### Step 1.2: Create Utility Functions

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 6.1](./dynamic-exam-configuration-report.md#61-replace-hardcoded-step-arrays) for the `generateMockExamSteps` logic.

**Scope**: Create a utility module with helper functions that will be used across the refactored code. These are pure functions with no side effects.

**Files to create**:
- `src/utils/exam-config.utils.ts`

**Functions to implement with exact signatures**:

```typescript
import { ExamConfig, ExamPartConfig, ExamSectionConfig } from '../config/exam-config.types';
import { MockExamStep } from '../types/mock-exam.types';

/**
 * Finds a part config by its ID across all sections.
 * Returns undefined if not found.
 */
export const findPartConfig = (
  config: ExamConfig,
  partId: string
): ExamPartConfig | undefined => {
  // Iterate config.sections, then each section.parts, return first match on part.id === partId
};

/**
 * Finds which section a part belongs to.
 * Returns undefined if not found.
 */
export const findSectionForPart = (
  config: ExamConfig,
  partId: string
): ExamSectionConfig | undefined => {
  // Iterate config.sections, return the section that contains a part with part.id === partId
};

/**
 * Generates mock exam steps from the config.
 * Iterates config.mockExam.stepOrder, looks up each part in config.sections,
 * and builds a MockExamStep object. Filters out parts where
 * mockExamSectionNumber is in config.mockExam.skipSectionNumbers.
 */
export const generateMockExamSteps = (
  config: ExamConfig
): Omit<MockExamStep, 'isCompleted' | 'score' | 'startTime' | 'endTime' | 'answers'>[] => {
  // For each partId in config.mockExam!.stepOrder:
  //   1. Find the part via findPartConfig(config, partId)
  //   2. If part not found, skip (or throw in dev)
  //   3. If part.mockExamSectionNumber is in config.mockExam!.skipSectionNumbers, skip
  //   4. Build and return: { id: part.id, sectionNumber: part.mockExamSectionNumber,
  //      sectionName: part.mockExamSectionName, partNumber: part.partNumber,
  //      partName: part.mockExamPartName, maxPoints: part.maxPoints,
  //      timeMinutes: part.timeMinutes }
};
```

**Expected outcome**:
- Utility module is importable
- Functions work with mock data
- No runtime behavior change (nothing uses these yet)

**Validation**:
- Unit test: Create `src/utils/__tests__/exam-config.utils.test.ts` — test each function with hand-crafted config objects, verifying correct output for various scenarios (part found, part not found, empty sections, part in skipSectionNumbers is excluded, etc.)

---

### Step 1.3: Create Score Calculator

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 7](./dynamic-exam-configuration-report.md#7-score-calculation-config-driven) for the scoring logic design. Also read the current scoring implementation in `src/screens/MockExamRunningScreen.tsx` → `handleCompleteStep()` and `renderResults()` to understand the existing behavior that must be replicated.

**Scope**: Create the generic score calculator module that will replace the hardcoded scoring logic. This is a pure function module with no dependencies on the active exam config.

**Files to create**:
- `src/utils/score-calculator.ts`

**Exact scoring logic for `calculateStepScore`**:
```typescript
/**
 * Calculates the score for a single mock exam step.
 * 
 * Rules (derived from current MockExamRunningScreen.handleCompleteStep):
 * 1. If partConfig.scoreScaling is defined: score = correctCount * scoreScaling
 *    Example: DELE writing, scoreScaling=0.5, correctCount=20 → score=10
 * 2. Else if partConfig.maxPoints > 0 and totalQuestions > 0:
 *    pointsPerQuestion = partConfig.maxPoints / totalQuestions
 *    score = Math.round(correctCount * pointsPerQuestion * 10) / 10
 *    Example: B1 reading-1, maxPoints=25, 5 questions, 3 correct → 15.0
 * 3. Else: score = correctCount
 */
export const calculateStepScore = (
  partConfig: ExamPartConfig,
  correctCount: number,
  totalQuestions: number
): number => { ... };
```

**Exact logic for `calculateGroupResults`**:
```typescript
export interface GroupResult {
  groupId: string;
  labelKey: string;
  score: number;
  maxPoints: number;
  passingPoints: number;
  percentage: number;
  passed: boolean;
}

/**
 * For each scoring group in config.mockExam.scoringGroups:
 * 1. Filter steps where step.sectionNumber is in group.sectionNumbers
 * 2. Sum their scores
 * 3. Calculate percentage = (score / group.maxPoints) * 100
 * 4. passed = score >= group.passingPoints
 */
export const calculateGroupResults = (
  config: ExamConfig,
  steps: MockExamStep[]
): GroupResult[] => { ... };
```

**Exact logic for `calculateOverallResult`**:
```typescript
export interface OverallResult {
  totalScore: number;
  totalMaxPoints: number;
  totalPercentage: number;
  passedOverall: boolean;
  groupResults: GroupResult[];
}

/**
 * 1. totalScore = sum of all step scores
 * 2. groupResults = calculateGroupResults(config, steps)
 * 3. allGroupsPassed = every group.passed is true
 * 4. passedOverall = totalScore >= config.mockExam.passingTotalPoints AND allGroupsPassed
 */
export const calculateOverallResult = (
  config: ExamConfig,
  steps: MockExamStep[]
): OverallResult => { ... };
```

**Expected outcome**:
- Score calculator is importable and functional
- Matches the behavior of the current hardcoded scoring logic for all 8 exam configs
- No runtime behavior change (nothing uses these yet)

**Validation**:
- Unit test: Create `src/utils/__tests__/score-calculator.test.ts`
  - Test `calculateStepScore`: B1 reading (5/5 with maxPoints 25 → 25), B1 reading (3/5 with maxPoints 25 → 15), DELE writing (20/25 with scoreScaling 0.5 → 10), A1 writing (correctCount=8, no scoreScaling, maxPoints=5, totalQuestions=5 → 8.0 from raw count)
  - Test `calculateOverallResult` with 100% → passes, 0% → fails, exactly 60% → passes, 59% → fails
  - Test group independence: DELE config with readingWriting=35 (>30, pass) but listeningSpeaking=20 (<30, fail) → overall fail
  - Test Telc B1: written=140 (>135, pass) → overall pass even though oral is 0 (skipped)

---

### Step 1.4: Create Screen and Wrapper Registries

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 6.2](./dynamic-exam-configuration-report.md#62-replace-renderstepContent-branching) and [Section 8.2](./dynamic-exam-configuration-report.md#82-proposed-approach).

**Scope**: Create registry modules that map string keys to React components. These are lookup tables — no logic.

**Files to create**:
- `src/utils/screen-registry.ts`
- `src/utils/wrapper-registry.ts`

**How to determine the keys**: Scan the existing codebase:
- For `SCREEN_REGISTRY`: Look at all `<Stack.Screen name="..." component={...} />` entries in `src/navigation/HomeStackNavigator.tsx`. The `name` attribute becomes the key, the `component` value is the imported component.
- For `WRAPPER_REGISTRY`: Look at all files in `src/components/exam-wrappers/`. Each file's default export becomes a value, and the key should be the filename without extension (e.g., `ReadingPart1Wrapper.tsx` → key `"ReadingPart1Wrapper"`).

**Expected WRAPPER_REGISTRY keys** (based on existing `src/components/exam-wrappers/` files):
```typescript
export const WRAPPER_REGISTRY: Record<string, React.ComponentType<{ testId: any; onComplete: (score: number, answers: any[]) => void; stepId?: string }>> = {
  'ReadingPart1Wrapper': ReadingPart1Wrapper,
  'ReadingPart2Wrapper': ReadingPart2Wrapper,
  'ReadingPart3Wrapper': ReadingPart3Wrapper,
  'LanguagePart1Wrapper': LanguagePart1Wrapper,
  'LanguagePart2Wrapper': LanguagePart2Wrapper,
  'ListeningPart1Wrapper': ListeningPart1Wrapper,
  'ListeningPart2Wrapper': ListeningPart2Wrapper,
  'ListeningPart3Wrapper': ListeningPart3Wrapper,
  'WritingWrapper': WritingWrapper,
  'DeleReadingPart1Wrapper': DeleReadingPart1Wrapper,
  'DeleReadingPart2Wrapper': DeleReadingPart2Wrapper,
  'DeleReadingPart3Wrapper': DeleReadingPart3Wrapper,
  'DeleGrammarPart1Wrapper': DeleGrammarPart1Wrapper,
  'DeleGrammarPart2Wrapper': DeleGrammarPart2Wrapper,
  'DeleListeningPart1Wrapper': DeleListeningPart1Wrapper,
  'DeleListeningPart2Wrapper': DeleListeningPart2Wrapper,
  'DeleListeningPart3Wrapper': DeleListeningPart3Wrapper,
  'DeleListeningPart4Wrapper': DeleListeningPart4Wrapper,
  'DeleListeningPart5Wrapper': DeleListeningPart5Wrapper,
};
```

**Expected SCREEN_REGISTRY keys**: Scan `HomeStackNavigator.tsx` for all `<Stack.Screen name="X" component={Y}>` pairs. Register every `X` → `Y` mapping. There will be ~50+ entries covering all practice screens (ReadingPart1, ReadingPart1A1, ReadingPart1A2, etc.), speaking screens, writing screens, vocabulary screens, etc.

**Expected outcome**:
- Both registries export typed `Record<string, React.ComponentType<any>>`
- All existing screen and wrapper components from the codebase are registered
- No runtime behavior change

**Validation**:
- Unit test: Create `src/utils/__tests__/screen-registry.test.ts` and `wrapper-registry.test.ts`
  - Verify all expected keys exist (check against the list above for wrappers)
  - Verify all values are functions (React components): `typeof value === 'function'`
  - Verify no `undefined` values

---

### Step 1.5: Populate German B1 Config (Reference Implementation)

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 12](./dynamic-exam-configuration-report.md#12-example-adding-goethe-a2-german) for a complete example config. Use the same structure but with German B1 values.

**How to determine the correct values** — DO NOT GUESS. Read these source files to extract the exact values:
- **Section/part structure**: Read `src/config/exams/german-b1.config.ts` → `examStructure` field for which sections/parts exist
- **Screen keys**: Read `src/screens/practice/ReadingMenuScreen.tsx` → `handleSelectPart1Exam()` etc. to see which screen names are navigated to (e.g., `navigation.navigate('ReadingPart1', { examId })`) — the first argument is the `screenKey`
- **Wrapper keys**: Read `src/screens/MockExamRunningScreen.tsx` → `renderStepContent()` to see which wrapper is rendered for each step ID (e.g., `reading-1` → `<ReadingPart1Wrapper>` → wrapperKey is `"ReadingPart1Wrapper"`)
- **Data loader methods**: Read `src/screens/practice/ReadingMenuScreen.tsx` → `useEffect` to see which `dataService.getXxx()` methods are called (e.g., `dataService.getReadingPart1Exams()` → listMethod is `"getReadingPart1Exams"`). For fetchMethod, check the corresponding wrapper (e.g., `ReadingPart1Wrapper.tsx` calls `dataService.getReadingPart1ExamById(testId)` → fetchMethod is `"getReadingPart1ExamById"`)
- **Translation keys**: Read `src/screens/practice/ReadingMenuScreen.tsx` → `getCardTitle()` and `getCardDescription()` functions to see which `t('...')` keys are used for B1 (not A1, not DELE)
- **Nav title keys**: Read `src/navigation/HomeStackNavigator.tsx` → `examScreenOptions('nav.practice.reading.part1')` for each screen
- **Mock exam values (maxPoints, timeMinutes, sectionNumber, sectionName, partName)**: Read `src/types/mock-exam.types.ts` → `MOCK_EXAM_STEPS` constant — copy values directly
- **Scoring groups**: Read `src/screens/MockExamRunningScreen.tsx` → `renderResults()` — sections 1-4 are "written" (maxPoints 225, passing 135), section 5 is "oral" (maxPoints 75, passing 45)
- **menuBehavior**: Reading/Listening/Grammar/Speaking → `"submenu"`. Writing for B1 → `"modal"` (because PracticeMenuScreen opens modal directly, not navigating to WritingMenu)

**Scope**: Add the full `sections` and `mockExam` fields to the German B1 config.

**Files to change**:
- `src/config/exams/german-b1.config.ts`

**Expected outcome**:
- `germanB1Config` has complete `sections` array with reading (3 parts), grammar (2 parts), listening (3 parts), writing (1 part), speaking (3 parts)
- `germanB1Config` has complete `mockExam` config with `stepOrder`, `scoringGroups`, `totalMaxPoints`, `passingTotalPoints`
- Every `screenKey` exists in `SCREEN_REGISTRY`
- Every `wrapperKey` exists in `WRAPPER_REGISTRY`
- Every `dataLoader.listMethod` and `dataLoader.fetchMethod` exists on `DataService`
- Every `titleKey`, `descriptionKey`, `navTitleKey` exists in `en.json`
- TypeScript compiles
- No runtime behavior change

**Validation**:
- Unit test: Create `src/config/__tests__/exam-configs-validation.test.ts`
  - Validate schema completeness for `german-b1`
  - Validate all `screenKey` values exist in `SCREEN_REGISTRY`
  - Validate all `wrapperKey` values exist in `WRAPPER_REGISTRY`
  - Validate all `dataLoader` method names exist on DataService
  - Validate all translation keys exist in `en.json`
  - Validate `mockExam.stepOrder` references valid part IDs
  - Validate `mockExam.totalMaxPoints` matches sum of part maxPoints (excluding skipped sections)
  - Validate scoring groups cover all section numbers
- Unit test: Compare `generateMockExamSteps(germanB1Config)` output against the existing `MOCK_EXAM_STEPS` constant to ensure they produce identical step arrays

---

### Step 1.6: Populate All Remaining Configs

**Status**: `completed-and-verified`

**Design reference**: Follow the same approach described in Step 1.5. For each config, read the corresponding source files to extract values:
- **german-a1 / goethe-german-a1**: Read `MOCK_EXAM_STEPS_A1` from `src/types/mock-exam.types.ts`, read `ReadingMenuScreen.tsx` with A1 conditionals, note grammar is `enabled: false`
- **german-a2**: Read `MOCK_EXAM_STEPS_A2`, same approach as A1
- **german-b2 / english-b1 / english-b2**: Same structure as B1 (identical section/part layout), read the B2-specific maxPoints from `MOCK_EXAM_STEPS` variant or infer from B1
- **dele-spanish-b1**: Read `MOCK_EXAM_STEPS_DELE_B1`, note 5 listening parts, 4 speaking parts, 2 writing parts, and `scoreScaling` on writing parts. Scoring groups are `readingWriting` and `listeningSpeaking` (not written/oral)
- **Key difference**: DELE uses `scoreMultiplier: 1`, Telc uses `scoreMultiplier: 3`

**Scope**: Add `sections` and `mockExam` to all remaining 7 exam configs, following the same pattern established in Step 1.5.

**Files to change**:
- `src/config/exams/german-a1.config.ts`
- `src/config/exams/german-a2.config.ts`
- `src/config/exams/german-b2.config.ts`
- `src/config/exams/english-b1.config.ts`
- `src/config/exams/english-b2.config.ts`
- `src/config/exams/dele-spanish-b1.config.ts`
- `src/config/exams/goethe-german-a1.config.ts`

**Expected outcome**:
- All 8 configs have complete `sections` and `mockExam` fields
- All validation tests pass for all configs

**Validation**:
- Unit test: Extend `exam-configs-validation.test.ts` to run the same validation suite for all 8 configs using `describe.each`
- Unit test: For each config, compare `generateMockExamSteps()` output against the corresponding hardcoded `MOCK_EXAM_STEPS_*` constant
- Unit test: Cross-config consistency checks (German B1 and English B1 have same structure; German A1 and Goethe A1 have same structure)
- Unit test: Run score calculator with known percentages (0%, 59%, 60%, 100%) for each config and verify pass/fail matches current behavior

---

### Step 1.7: Generate Golden Files

**Status**: `completed-and-verified`

**Scope**: Create a script that captures the **current correct behavior** of the app as golden reference files. These will be used throughout later phases to detect regressions.

**Files to create**:
- `src/config/__tests__/golden/` directory
- `scripts/generate-golden-files.ts` — script to generate golden data
- Golden JSON files for each exam (auto-generated, not hand-written)

**What golden files capture**:
- Mock exam step arrays (id, sectionNumber, partName, maxPoints, timeMinutes) for each exam
- Score calculations at key percentages (0%, 30%, 59%, 60%, 61%, 80%, 100%) for each exam
- Pass/fail determination for each scoring group at boundary values
- Total max points and passing points for each exam

**Expected outcome**:
- Golden files are generated and committed
- A test suite compares the new config-driven output against golden files

**Validation**:
- Unit test: Create `src/config/__tests__/golden-comparison.test.ts` — for each exam, generate steps/scores from config and compare against golden files (should be 100% match)

---

## Phase 2: Config-Driven Practice Menu

This phase makes `PracticeMenuScreen` render sections from config instead of hardcoded cards with if/else.

---

### Step 2.1: Refactor PracticeMenuScreen to Use Config

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 5.1](./dynamic-exam-configuration-report.md#51-practicemenuscreen-refactoring) for the exact before/after code pattern. The "After" shows the complete replacement loop logic.

**Key transformation pattern**:
```typescript
// BEFORE (current code):
const isA1 = activeExamConfig.level === 'A1';
const isA2 = activeExamConfig.level === 'A2';
const isDele = activeExamConfig.provider === 'dele';
// ... hardcoded cards with conditional rendering ...

// AFTER (config-driven):
const sections = activeExamConfig.sections!.filter(s => s.enabled).sort((a, b) => a.order - b.order);
return sections.map(section => (
  <SectionCard
    key={section.id}
    title={t(section.menuTitleKey)}
    description={t(section.menuDescriptionKey)}
    onPress={() => handleSectionPress(section)}
  />
));

const handleSectionPress = (section: ExamSectionConfig) => {
  switch (section.menuBehavior) {
    case 'submenu': navigation.navigate('SectionMenu', { sectionId: section.id }); break;
    case 'modal': showExamSelectionModal(section.parts[0]); break;
    case 'direct': navigation.navigate(section.parts[0].screenKey); break;
  }
};
```

**Scope**: Replace the hardcoded section cards in `PracticeMenuScreen` with a dynamic loop over `activeExamConfig.sections`. The sections array determines which cards are shown, their order, titles, and descriptions. Remove `isA1`, `isA2`, `isDele` variables.

**Files to change**:
- `src/screens/practice/PracticeMenuScreen.tsx`

**Key behavior to preserve**:
- Grammar card is NOT shown for A1/A2 (config has `grammar` section with `enabled: false`)
- Writing behavior differs by level (config's `menuBehavior` field on the writing section: `"modal"` for B1/B2, `"submenu"` for A1/A2/DELE)
- Section order remains the same as current
- All navigation targets remain the same

**Expected outcome**:
- PracticeMenuScreen renders correctly for all 8 exam configs
- No visual difference for users
- No `isA1`/`isA2`/`isDele` variables in the file
- Code is shorter and cleaner

**Validation**:
- Unit test: Create snapshot tests for `PracticeMenuScreen` with each of the 8 exam configs mocked. Compare against snapshots taken BEFORE this change (take snapshots as the first action in this step, before modifying the component).
- Maestro (optional): Run practice menu visibility test for german-b1, german-a1, and dele-spanish-b1 to verify correct sections appear

---

### Step 2.2: Handle Writing Section Menu Behavior

**Status**: `completed-and-verified`

**Scope**: Ensure the writing section's `menuBehavior` from config drives the correct flow:
- `"modal"`: B1/B2 writing opens exam selection modal directly from PracticeMenuScreen
- `"submenu"`: A1/A2/DELE writing navigates to WritingMenuScreen

This may already work from Step 2.1 if the `handleSectionPress()` function respects `menuBehavior`. If not, implement the branching based on config's `menuBehavior` field (not on level/provider).

**Files to change**:
- `src/screens/practice/PracticeMenuScreen.tsx` (if not already handled in 2.1)

**Expected outcome**:
- Writing section navigation works correctly for all exam types
- The decision is based on `section.menuBehavior` not on `isA1`/`isA2`

**Validation**:
- Unit test: Integration test that mocks navigation and verifies correct navigation target based on config's `menuBehavior`
- Maestro (optional): Test writing section press for german-b1 (should show modal) and german-a1 (should navigate to WritingMenu)

---

## Phase 3: Config-Driven Section Menus

This phase replaces the 5 individual section menu screens with one generic component.

---

### Step 3.1: Create Generic SectionMenuScreen

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 5.2](./dynamic-exam-configuration-report.md#52-generic-sectionmenuscreen) for the complete component design including the rendering logic, data loading pattern, and exam selection modal interaction.

**Component structure**:
```typescript
const SectionMenuScreen = ({ route }: Props) => {
  const { sectionId } = route.params;
  const { activeExamConfig } = useExamConfig();
  const section = activeExamConfig.sections!.find(s => s.id === sectionId)!;
  
  // For each part: load exam list using dataService[part.dataLoader.listMethod]()
  // Store in state: Record<string, ExamListItem[]>
  
  // Render: SectionStatsCard + PartCards + ExtraMenuItems
  // On part press: if part.hasExamSelection → show modal; else → navigate directly
  // On exam selected: navigation.navigate(part.screenKey, { [part.navigationParamKey]: selectedId })
};
```

**Scope**: Create a new `SectionMenuScreen` component that:
1. Receives a `sectionId` parameter (via route params or props)
2. Looks up the section in `activeExamConfig.sections`
3. Renders a `SectionStatsCard` for that section
4. Renders a card for each part in `section.parts` with title/description from config translation keys
5. Shows exam selection modal when a part card is pressed
6. On exam selection, navigates to `part.screenKey` with the selected examId
7. Renders any `section.extraMenuItems` (e.g., Grammar Study)

**Files to create**:
- `src/screens/practice/SectionMenuScreen.tsx`

**Files to change**:
- None yet (old screens remain, new screen is created alongside them)

**Expected outcome**:
- Generic SectionMenuScreen works when rendered with any sectionId
- It loads data using `part.dataLoader.listMethod`
- It navigates to `part.screenKey`
- Old menu screens are NOT deleted yet

**Validation**:
- Unit test: Snapshot test the SectionMenuScreen for reading/listening/writing/grammar/speaking sections using german-b1 config
- Unit test: Integration test verifying navigation calls the correct screen for each part

---

### Step 3.2: Replace ReadingMenuScreen with SectionMenuScreen

**Status**: `completed-and-verified`

**Scope**: Wire up the navigation to use `SectionMenuScreen` instead of `ReadingMenuScreen` for the reading section. Update `HomeStackNavigator` to pass `sectionId: 'reading'` to the generic screen.

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx` — change ReadingMenu route to use SectionMenuScreen with `sectionId: 'reading'`

**Expected outcome**:
- Reading menu works identically to before for all 8 exams
- Parts show correct titles/descriptions
- Exam selection modal works
- Navigation to part screens works

**Validation**:
- Unit test: Snapshot comparison (SectionMenuScreen with sectionId='reading' should produce same output as old ReadingMenuScreen for each config)
- Maestro (optional): Run reading navigation test for german-b1, german-a1, dele-spanish-b1

---

### Step 3.3: Replace ListeningMenuScreen with SectionMenuScreen

**Status**: `completed-and-verified`

**Scope**: Same as 3.2 but for listening. Wire `ListeningMenu` route to SectionMenuScreen with `sectionId: 'listening'`.

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx`

**Expected outcome**:
- Listening menu works for all exams (3 parts for Telc/Goethe, 5 parts for DELE)
- Correct data loaded per part

**Validation**:
- Unit test: Snapshot comparison
- Maestro (optional): Verify DELE shows 5 listening parts, Telc shows 3

---

### Step 3.4: Replace WritingMenuScreen with SectionMenuScreen

**Status**: `completed-and-verified`

**Scope**: Wire `WritingMenu` route to SectionMenuScreen with `sectionId: 'writing'`. Note: Writing for B1/B2 uses `"modal"` behavior from PracticeMenuScreen and doesn't navigate here — this route is only used by A1/A2/DELE.

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx`

**Expected outcome**:
- Writing menu shows correct parts for A1 (2 parts), A2 (2 parts), DELE (2 parts)
- Navigation to WritingPart1/WritingPart2/Writing screens works correctly

**Validation**:
- Unit test: Snapshot comparison
- Unit test: Navigation target verification per config

---

### Step 3.5: Replace GrammarMenuScreen with SectionMenuScreen

**Status**: `completed-and-verified`

**Scope**: Wire `GrammarMenu` route to SectionMenuScreen with `sectionId: 'grammar'`. Handle `extraMenuItems` (Grammar Study card).

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx`

**Expected outcome**:
- Grammar menu shows 2 parts + Grammar Study card
- Grammar Study navigation works
- DELE-specific grammar titles/descriptions display correctly

**Validation**:
- Unit test: Snapshot comparison
- Unit test: Verify extraMenuItems render and navigate correctly

---

### Step 3.6: Replace SpeakingMenuScreen with SectionMenuScreen

**Status**: `completed-and-verified`

**Scope**: Speaking menu is the most complex due to the many variants (B1 Telc, B2, A1, A2, DELE). The config must handle:
- B1: Parts 1, 2, 3 + Important Phrases
- B2: Structure + Parts 1, 2, 3
- A1/A2: Parts 1, 2, 3 (direct navigation, no exam selection)
- DELE: Parts 1, 2, 3, 4 + Important Phrases

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx`
- Possibly `src/screens/practice/SectionMenuScreen.tsx` if speaking needs special handling for parts without exam selection (direct navigation)

**Expected outcome**:
- Speaking menu works for all 8 exam configs
- Parts with `hasExamSelection: true` show modal
- Parts with `hasExamSelection: false` navigate directly
- Extra menu items (Important Phrases, B2 Structure) appear correctly

**Validation**:
- Unit test: Snapshot comparison for all 8 configs
- Maestro (recommended): Test speaking menu for german-b1, german-a1, german-b2, dele-spanish-b1 as these all have different structures

---

### Step 3.7: Delete Old Section Menu Screens

**Status**: `completed-and-verified`

**Scope**: Remove the now-unused individual menu screen files.

**Files to delete**:
- `src/screens/practice/ReadingMenuScreen.tsx`
- `src/screens/practice/ListeningMenuScreen.tsx`
- `src/screens/practice/WritingMenuScreen.tsx`
- `src/screens/practice/GrammarMenuScreen.tsx`
- `src/screens/practice/SpeakingMenuScreen.tsx`

**Expected outcome**:
- No import errors
- TypeScript compiles
- App works identically

**Validation**:
- Unit test: `npx tsc --noEmit` passes
- Unit test: All existing tests pass
- Maestro (recommended): Full practice menu flow for 3 representative exams (german-b1, german-a1, dele-spanish-b1)

---

## Phase 4: Config-Driven Mock Exam

This phase replaces the hardcoded mock exam logic with config-driven behavior.

---

### Step 4.1: Refactor generateRandomExamSelection()

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 6.3](./dynamic-exam-configuration-report.md#63-generic-generateRandomExamSelection) for the replacement algorithm.

**New algorithm**:
```typescript
export const generateRandomExamSelection = async (
  config: ExamConfig,
  dataService: DataService
): Promise<Record<string, string>> => {
  const selection: Record<string, string> = {};
  for (const partId of config.mockExam!.stepOrder) {
    const part = findPartConfig(config, partId);
    if (!part || part.skipInMockExam) continue;
    const exams = await dataService[part.dataLoader.listMethod]();
    if (exams.length > 0) {
      const randomExam = exams[Math.floor(Math.random() * exams.length)];
      selection[partId] = randomExam.id;
    }
  }
  return selection;
};
```

**Scope**: Replace the 3 separate code paths in `mock-exam.service.ts` → `generateRandomExamSelection()` with a single generic loop over `config.sections` and `config.mockExam.stepOrder`.

**Files to change**:
- `src/services/mock-exam.service.ts`

**Key behavior to preserve**:
- For each non-skipped part in `stepOrder`, load exams using `part.dataLoader.listMethod` and pick a random ID
- Speaking parts are skipped (they have `skipInMockExam: true`)
- The returned object keys must match the step IDs exactly

**Expected outcome**:
- Same random selection behavior as before
- Single code path works for all 8 configs
- No `isA1`/`isA2`/`isDele` checks

**Validation**:
- Unit test: Mock DataService methods, call `generateRandomExamSelection` for each config, verify correct methods are called and correct keys are returned
- Unit test: Verify speaking-related keys are NOT included in selection

---

### Step 4.2: Refactor createInitialMockExamProgress()

**Status**: `completed-and-verified`

**Scope**: Replace the if/else branching that selects which `MOCK_EXAM_STEPS_*` array to use. Instead, call `generateMockExamSteps(activeExamConfig)`.

**Files to change**:
- `src/services/mock-exam.service.ts`

**Expected outcome**:
- Initial progress uses config-generated steps
- `totalMaxPoints` comes from `config.mockExam.totalMaxPoints`
- Speaking steps are filtered out (via `skipSectionNumbers`)
- Generated steps match the golden files exactly

**Validation**:
- Unit test: For each config, compare the initial progress steps against golden files
- Unit test: Verify `totalMaxPoints` matches config value

---

### Step 4.3: Refactor MockExamRunningScreen — renderStepContent()

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 6.2](./dynamic-exam-configuration-report.md#62-replace-renderstepContent-branching) for the exact replacement pattern.

**Scope**: Replace the massive `renderStepContent()` function (with isDele and step-ID matching) with the wrapper registry lookup pattern.

**Files to change**:
- `src/screens/MockExamRunningScreen.tsx`

**Exact replacement code**:
```typescript
const renderStepContent = () => {
  const part = findPartConfig(activeExamConfig, currentStep.id);
  if (!part) return null;
  
  if (part.skipInMockExam) {
    return renderSpeakingSkipView(part);
  }
  
  const WrapperComponent = WRAPPER_REGISTRY[part.wrapperKey];
  if (!WrapperComponent) {
    console.error(`No wrapper found for key: ${part.wrapperKey}`);
    return null;
  }
  
  return (
    <WrapperComponent
      testId={examSelection[currentStep.id]}
      onComplete={handleCompleteStep}
      stepId={currentStep.id}
    />
  );
};
```

**Expected outcome**:
- All exam parts render the correct wrapper component
- Speaking parts show skip view
- No `isDele`/`isA1`/`isA2` checks in renderStepContent
- Function is ~15 lines instead of ~60

**Validation**:
- Unit test: For each config, for each step in `mockExam.stepOrder`, verify that `WRAPPER_REGISTRY[findPartConfig(...).wrapperKey]` returns a defined component
- Maestro (recommended): Start mock exam for german-b1 and dele-spanish-b1, verify first step renders correctly

---

### Step 4.4: Refactor MockExamRunningScreen — handleCompleteStep() Scoring

**Status**: `completed-and-verified`

**Design reference**: See Step 1.3 above for the exact `calculateStepScore` algorithm. Also see [Architecture Proposal, Section 7.3](./dynamic-exam-configuration-report.md#73-step-level-scoring) for the integration pattern.

**Scope**: Replace the scoring branching in `handleCompleteStep()` with the config-driven `calculateStepScore()` function.

**Files to change**:
- `src/screens/MockExamRunningScreen.tsx`

**Exact replacement code**:
```typescript
const handleCompleteStep = (correctCount: number, answers: any[]) => {
  const part = findPartConfig(activeExamConfig, currentStep.id)!;
  const score = calculateStepScore(part, correctCount, answers.length);
  updateStepProgress(currentStep.id, score, answers);
  advanceToNextStep();
};
```

**Expected outcome**:
- Scores are calculated identically to before for all exam types
- No `isDele`/`isA1`/`isA2` checks in scoring logic

**Validation**:
- Unit test: Verify `calculateStepScore` produces same results as the old inline branching logic for known inputs across all exam types
- Unit test: Golden file comparison for boundary values

---

### Step 4.5: Refactor MockExamRunningScreen — renderResults()

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 7.2](./dynamic-exam-configuration-report.md#72-results-calculation) for the results rendering pattern. See Step 1.3 above for the exact `calculateOverallResult` and `GroupResult` interfaces.

**Scope**: Replace the results rendering logic that branches on isDele/isA1/isA2 with the generic `calculateOverallResult()` and `calculateGroupResults()` from the score calculator.

**Files to change**:
- `src/screens/MockExamRunningScreen.tsx`

**Exact replacement pattern**:
```typescript
const renderResults = () => {
  const result = calculateOverallResult(activeExamConfig, examProgress.steps);
  return (
    <ResultsView
      totalScore={result.totalScore}
      totalMaxPoints={result.totalMaxPoints}
      totalPercentage={result.totalPercentage}
      passedOverall={result.passedOverall}
      groups={result.groupResults.map(group => ({
        label: t(group.labelKey),
        score: group.score,
        maxPoints: group.maxPoints,
        passingPoints: group.passingPoints,
        percentage: group.percentage,
        passed: group.passed,
      }))}
    />
  );
};
```

**Expected outcome**:
- Results screen shows correct scores, pass/fail, and group breakdown for all exams
- No hardcoded max points, passing points, or section number checks
- DELE shows readingWriting + listeningSpeaking groups
- Telc shows written (+ oral skipped message)

**Validation**:
- Unit test: Snapshot test the results rendering for each config with known step scores
- Unit test: Golden file comparison for pass/fail at 59%/60%/61% for all configs

---

### Step 4.6: Refactor MockExamScreen — Overview Display

**Status**: `completed-and-verified`

**Scope**: Replace the hardcoded `getTotalPoints()`, `getPassingScore()`, and `getExamDuration()` functions in MockExamScreen with config-driven values.

**Files to change**:
- `src/screens/MockExamScreen.tsx`

**New logic**:
- Total duration: sum `timeMinutes` from `mockExam.stepOrder` parts
- Total points: `config.mockExam.totalMaxPoints`
- Passing score: `config.mockExam.passingTotalPoints`
- Steps: generated from config

**Expected outcome**:
- Overview screen shows correct numbers for all exams
- No `isA1`/`isA2`/`isDele` checks

**Validation**:
- Unit test: Verify computed values match golden files for each config

---

### Step 4.7: Refactor updateStepProgress() in mock-exam.service.ts

**Status**: `completed-and-verified`

**Scope**: Replace the scoring/pass-fail logic in `updateStepProgress()` (the exam completion tracking) with config-driven calls.

**Files to change**:
- `src/services/mock-exam.service.ts`

**Expected outcome**:
- Step progress updates use config for pass/fail determination
- Analytics events still fire with correct data
- No hardcoded passing points

**Validation**:
- Unit test: Mock AsyncStorage and verify correct progress is saved for various completion scenarios

---

### Step 4.8: Remove Hardcoded Mock Exam Constants

**Status**: `completed-and-verified`

**Scope**: Delete the 4 hardcoded step arrays and 12 scoring constants from `mock-exam.types.ts`.

**Files to change**:
- `src/types/mock-exam.types.ts`

**Constants to remove**:
- `MOCK_EXAM_STEPS`, `MOCK_EXAM_STEPS_A1`, `MOCK_EXAM_STEPS_A2`, `MOCK_EXAM_STEPS_DELE_B1`
- `TOTAL_WRITTEN_MAX_POINTS`, `TOTAL_ORAL_MAX_POINTS`, `TOTAL_MAX_POINTS`, `PASSING_WRITTEN_POINTS`, `PASSING_ORAL_POINTS`, `PASSING_TOTAL_POINTS`
- All A1, A2, and DELE variants of the above

**Expected outcome**:
- No import errors
- TypeScript compiles
- All logic now comes from config

**Validation**:
- Unit test: `npx tsc --noEmit` passes
- Unit test: All existing tests still pass
- Unit test: Golden file comparison still passes

---

## Phase 5: Config-Driven Navigation

This phase simplifies the navigation stack.

---

### Step 5.1: Refactor HomeStackNavigator — Dynamic Screen Registration

**Status**: `completed-and-verified`

**Design reference**: See [Architecture Proposal, Section 8.2](./dynamic-exam-configuration-report.md#82-proposed-approach) for the dynamic registration pattern.

**Scope**: Replace the 70+ hardcoded `<Stack.Screen>` definitions with dynamic registration from the active exam config's `sections`.

**Files to change**:
- `src/navigation/HomeStackNavigator.tsx`

**Exact replacement pattern**:
```typescript
// Keep these static screens as-is (they don't change per exam):
// Home, PracticeMenu, MockExam, MockExamRunning, ExamStructure, Settings,
// VocabularyOverview, VocabularyPractice, VocabularyList, Premium, etc.

// Dynamic section menu screens:
{activeExamConfig.sections!.filter(s => s.enabled).map(section => (
  <Stack.Screen
    key={`SectionMenu-${section.id}`}
    name={`${section.id}Menu`}  // e.g., "readingMenu", "listeningMenu"
    component={SectionMenuScreen}
    initialParams={{ sectionId: section.id }}
    options={{ title: t(section.menuTitleKey) }}
  />
))}

// Dynamic part screens:
{activeExamConfig.sections!.flatMap(section =>
  section.parts.map(part => (
    <Stack.Screen
      key={part.screenKey}
      name={part.screenKey}
      component={SCREEN_REGISTRY[part.screenKey]}
      options={{ title: t(part.navTitleKey) }}
    />
  ))
)}
```

**New logic**:
- Keep static screens (Home, PracticeMenu, ExamStructure, Vocabulary*, MockExamRunning, etc.)
- For section menus: register one `SectionMenu` screen per enabled section
- For part screens: iterate each section's parts and register their `screenKey` using `SCREEN_REGISTRY[part.screenKey]`
- Navigation header titles come from `part.navTitleKey`

**Expected outcome**:
- All navigation works identically
- Only screens relevant to the active config are registered
- No `isDele ? ... : ...` in screen options
- File is significantly shorter

**Validation**:
- Unit test: For each config, verify all required screen keys are present in SCREEN_REGISTRY
- Maestro (recommended): Full navigation flow test for german-b1, german-a1, dele-spanish-b1 (navigate to each section, open a part)

---

### Step 5.2: Simplify navigation.types.ts

**Status**: `completed-and-verified`

**Scope**: Clean up `HomeStackParamList` to remove level-specific duplicate routes that are now handled by the generic approach. Keep all screen keys that are referenced in `SCREEN_REGISTRY` as union type members.

**Files to change**:
- `src/types/navigation.types.ts`

**Expected outcome**:
- Type file is cleaner but still provides type safety
- All navigation calls still type-check correctly
- No runtime behavior change

**Validation**:
- Unit test: `npx tsc --noEmit` passes
- Unit test: All existing tests pass

---

## Phase 6: Cleanup

---

### Step 6.1: Remove isA1/isA2/isDele Checks from Remaining Files

**Status**: `completed-and-verified`

**Scope**: Search the codebase for any remaining `activeExamConfig.level === 'A1'`, `activeExamConfig.provider === 'dele'`, etc. patterns in screens and components that should now be config-driven. Fix any remaining instances.

**Files to change**: Various (grep search will identify them)

**Expected outcome**:
- No conditional logic based on level/provider in UI rendering code
- Config is the single source of truth

**Validation**:
- Unit test: `grep -r "isA1\|isA2\|isDele\|isB2\|isGoethe" src/screens/ src/components/` returns zero results (or only in legitimate places like wrapper internals that handle different data shapes)
- Maestro (recommended): Full regression for 3 representative exams

---

### Step 6.2: Consolidate Exam Wrappers (Optional)

**Status**: `pending`

**Scope**: Where exam wrappers (e.g., `ReadingPart1Wrapper`) internally branch on `isA1`/`isA2` to select different UI components, consider whether they can be unified. This is optional — wrappers that handle genuinely different data shapes (A1 true/false vs B1 matching) legitimately need different UI components and may need to stay separate.

**Files to change**: `src/components/exam-wrappers/*.tsx` (selective)

**Expected outcome**:
- Wrappers that were pure duplicates are consolidated
- Wrappers with genuinely different UI remain separate but are cleanly mapped via the registry

**Validation**:
- Unit test: All golden file tests pass
- Maestro (recommended): Complete a reading part for german-b1, german-a1, and dele-spanish-b1

---

### Step 6.3: Make ExamConfig Fields Required

**Status**: `completed-and-verified`

**Scope**: Change `sections` and `mockExam` from optional to required in the `ExamConfig` type. Remove the deprecated `examStructure` field.

**Files to change**:
- `src/config/exam-config.types.ts`
- All 8 config files (remove `examStructure` if still present)

**Expected outcome**:
- TypeScript enforces that all configs have the new fields
- Clean type definitions

**Validation**:
- Unit test: `npx tsc --noEmit` passes
- Unit test: All tests pass

---

### Step 6.4: Update Documentation

**Status**: `completed-and-verified`

**Scope**: Update `copilot-instructions.md` and any other project documentation to reflect the new architecture. Add a section explaining how to add a new exam.

**Files to change**:
- `.github/copilot-instructions.md`
- `docs/dynamic-exam-config-refactoring/` (update status in this plan)

**Expected outcome**:
- Documentation accurately describes the config-driven architecture
- Adding a new exam is documented as a simple process

**Validation**:
- Manual review

---

## Phase 7: Final Validation

---

### Step 7.1: Full Regression Test

**Status**: `pending`

**Scope**: Run the complete test suite and Maestro E2E tests across all 8 exam configs.

**Validation**:
- Unit test: All Jest tests pass
- Maestro: Practice menu + mock exam start for all 8 exams
- Manual: Complete a full mock exam for german-b1 and dele-spanish-b1
- Manual: Verify scores display correctly

---

### Step 7.2: Proof of Concept — Add a New Exam Config

**Status**: `pending`

**Scope**: As a final validation, create a new exam config (e.g., `goethe-german-a2`) that reuses existing screens/wrappers. Verify that:
1. Only a config file needs to be created
2. It's registered in index.ts
3. Set as active exam
4. App builds and works without any other code changes

**Files to create**:
- `src/config/exams/goethe-german-a2.config.ts`

**Files to change**:
- `src/config/exams/index.ts` (register)
- `src/config/active-exam.config.ts` (set active for testing)

**Expected outcome**:
- App builds and runs with the new config
- Practice menu shows correct sections
- Mock exam starts with correct steps
- No other files were modified

**Validation**:
- Unit test: Config validation tests pass for the new config
- Maestro: Practice menu shows correct sections for goethe-german-a2
- This step proves the refactoring goal is achieved

---

## Summary

| Phase | Steps | Risk | Key Validation |
|-------|-------|------|----------------|
| 1. Foundation | 7 steps | Low (no behavior change) | Config validation + golden files |
| 2. Practice Menu | 2 steps | Medium | Snapshot comparison |
| 3. Section Menus | 7 steps | Medium-High | Snapshot + Maestro |
| 4. Mock Exam | 8 steps | High | Golden files + score tests |
| 5. Navigation | 2 steps | Medium | Type checking + Maestro |
| 6. Cleanup | 4 steps | Low | Grep + type checking |
| 7. Final | 2 steps | Low | Full regression |

**Total: 32 steps**, each independently verifiable, each producing a working app.
