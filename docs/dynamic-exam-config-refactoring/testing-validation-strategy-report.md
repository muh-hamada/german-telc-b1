# Testing & Validation Strategy for Dynamic Exam Configuration Migration

## Executive Summary

The dynamic exam configuration refactor touches **every user-facing flow** in 8 production apps across 2 platforms (16 builds). Manual testing alone would require testing ~120 distinct user flows per exam variant, totaling **~960 manual test scenarios**. This report outlines a layered testing strategy combining unit tests, snapshot tests, integration tests, and automated E2E tests to provide confidence without requiring weeks of manual QA.

---

## Table of Contents

1. [Current Testing State](#1-current-testing-state)
2. [Risk Assessment](#2-risk-assessment)
3. [Testing Strategy Overview](#3-testing-strategy-overview)
4. [Layer 1: Unit Tests (Config Validation)](#4-layer-1-unit-tests-config-validation)
5. [Layer 2: Component Snapshot Tests](#5-layer-2-component-snapshot-tests)
6. [Layer 3: Integration Tests (Behavior)](#6-layer-3-integration-tests-behavior)
7. [Layer 4: E2E Testing (Maestro)](#7-layer-4-e2e-testing-maestro)
8. [Layer 5: Firebase Test Lab AI Testing](#8-layer-5-firebase-test-lab-ai-testing)
9. [Why Maestro, Not Playwright/Detox/Appium](#9-why-maestro-not-playwrightdetoxappium)
10. [Mock Exam Validation Strategy](#10-mock-exam-validation-strategy)
11. [Score Calculation Validation](#11-score-calculation-validation)
12. [Regression Safety Net: Before/After Comparison](#12-regression-safety-net-beforeafter-comparison)
13. [CI/CD Integration](#13-cicd-integration)
14. [Phased Testing Rollout](#14-phased-testing-rollout)
15. [Test Matrix](#15-test-matrix)
16. [Effort Estimation](#16-effort-estimation)

---

## 1. Current Testing State

| Category | Current State | Coverage |
|----------|--------------|----------|
| Unit tests (Jest) | 1 trivial `App.test.tsx` + 1 config test | ~1% |
| Snapshot tests | None | 0% |
| Integration tests | None | 0% |
| E2E tests (Detox/Maestro/Appium) | None | 0% |
| Firebase AI Testing | `test-cases.yaml` with 15+ scenarios | Manual/AI-driven, not automated in CI |
| Linting | ESLint configured | Syntax only |
| Type checking | TypeScript strict | Catches type errors |

**Conclusion**: The project relies almost entirely on manual testing and TypeScript for correctness. This is the biggest risk factor for the refactor.

---

## 2. Risk Assessment

### 2.1 What Can Break

| Risk Area | Severity | Likelihood | Impact |
|-----------|----------|------------|--------|
| Wrong questions displayed for an exam | **Critical** | Medium | Users get A1 questions in B2 app |
| Mock exam score miscalculation | **Critical** | High | Users see wrong pass/fail result |
| Missing menu items for an exam | **High** | Medium | Users can't access sections they paid for |
| Wrong navigation (screen renders blank) | **High** | Medium | App appears broken |
| Translation keys showing raw keys | **Medium** | Medium | UI looks unprofessional |
| Data service calling wrong method | **Critical** | Medium | Wrong/empty data loaded |
| Mock exam step order wrong | **High** | Low | Confusing exam flow |
| Exam wrapper renders wrong UI component | **Critical** | Medium | A1 UI for B2 questions |

### 2.2 Most Dangerous Changes

1. **`renderStepContent()` → wrapper registry**: One wrong mapping = blank screen or crash in mock exam
2. **Score calculation refactor**: Off-by-one in `scoreScaling` = wrong pass/fail for thousands of users
3. **Menu section iteration**: If config order/enabled flags are wrong, sections disappear
4. **`dataLoader.listMethod` string mapping**: Typo = no data loads, blank exam list
5. **Navigation changes**: Wrong `screenKey` = crash on navigation

---

## 3. Testing Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 5: Firebase AI Testing (Exploratory, per release)            │
│  ─── Catches unexpected issues across real devices ───              │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: E2E Tests - Maestro (Critical paths, per exam)            │
│  ─── Validates real user flows on simulator/device ───              │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: Integration Tests - Jest + RTL (Behavior)                 │
│  ─── Tests component behavior with mocked services ───              │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Snapshot Tests - Jest (Visual regression)                  │
│  ─── Catches unintended UI structure changes ───                    │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Unit Tests - Jest (Config correctness)                     │
│  ─── Validates all configs are well-formed and consistent ───       │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle**: Catch the highest-severity bugs at the lowest (cheapest, fastest) test layer.

---

## 4. Layer 1: Unit Tests (Config Validation)

These are the **highest value, lowest cost** tests. They run in milliseconds, require no device, and catch the most dangerous class of bugs: misconfigured exams.

### 4.1 Config Schema Validation Tests

```typescript
// src/config/__tests__/exam-configs.test.ts

import { EXAM_CONFIGS } from '../exams';
import { SCREEN_REGISTRY } from '../../utils/screen-registry';
import { WRAPPER_REGISTRY } from '../../utils/wrapper-registry';
import { dataService } from '../../services/data.service';

describe('All Exam Configurations', () => {
  const examIds = Object.keys(EXAM_CONFIGS);

  describe.each(examIds)('Config: %s', (examId) => {
    const config = EXAM_CONFIGS[examId];

    it('has valid basic identity fields', () => {
      expect(config.id).toBe(examId);
      expect(config.language).toBeTruthy();
      expect(config.level).toMatch(/^(A1|A2|B1|B2|C1|C2)$/);
      expect(config.provider).toMatch(/^(telc|dele|goethe)$/);
    });

    it('has all required sections defined', () => {
      expect(config.sections).toBeDefined();
      expect(config.sections.length).toBeGreaterThan(0);
    });

    it('has no duplicate section IDs', () => {
      const ids = config.sections.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has no duplicate part IDs across all sections', () => {
      const allPartIds = config.sections.flatMap(s => s.parts.map(p => p.id));
      expect(new Set(allPartIds).size).toBe(allPartIds.length);
    });

    it('all section parts have valid screenKey in registry', () => {
      for (const section of config.sections) {
        for (const part of section.parts) {
          expect(SCREEN_REGISTRY).toHaveProperty(part.screenKey,
            `Config ${examId}: screenKey "${part.screenKey}" not found in SCREEN_REGISTRY`
          );
        }
      }
    });

    it('all section parts have valid wrapperKey in registry', () => {
      for (const section of config.sections) {
        for (const part of section.parts) {
          if (!part.skipInMockExam) {
            expect(WRAPPER_REGISTRY).toHaveProperty(part.wrapperKey,
              `Config ${examId}: wrapperKey "${part.wrapperKey}" not found in WRAPPER_REGISTRY`
            );
          }
        }
      }
    });

    it('all dataLoader methods exist on DataService', () => {
      for (const section of config.sections) {
        for (const part of section.parts) {
          expect(typeof (dataService as any)[part.dataLoader.listMethod]).toBe('function',
            `Config ${examId}: listMethod "${part.dataLoader.listMethod}" not found on DataService`
          );
          expect(typeof (dataService as any)[part.dataLoader.fetchMethod]).toBe('function',
            `Config ${examId}: fetchMethod "${part.dataLoader.fetchMethod}" not found on DataService`
          );
        }
      }
    });

    it('examStructure matches sections (backward compatibility)', () => {
      // Verify that examStructure field matches the sections array
      for (const [sectionName, parts] of Object.entries(config.examStructure)) {
        const section = config.sections.find(s => s.id === sectionName);
        expect(section).toBeDefined();
        expect(section!.parts.map(p => p.partNumber).sort())
          .toEqual([...(parts as number[])].sort());
      }
    });
  });
});
```

### 4.2 Mock Exam Config Validation Tests

```typescript
// src/config/__tests__/mock-exam-config.test.ts

describe.each(examIds)('Mock Exam Config: %s', (examId) => {
  const config = EXAM_CONFIGS[examId];

  it('mockExam.stepOrder references valid part IDs', () => {
    const allPartIds = config.sections.flatMap(s => s.parts.map(p => p.id));
    for (const stepId of config.mockExam.stepOrder) {
      expect(allPartIds).toContain(stepId);
    }
  });

  it('mockExam.totalMaxPoints matches sum of non-skipped parts', () => {
    const sum = config.mockExam.stepOrder
      .map(id => findPart(config, id))
      .filter(p => !p.skipInMockExam)
      .reduce((acc, p) => acc + p.maxPoints, 0);
    expect(config.mockExam.totalMaxPoints).toBe(sum);
  });

  it('scoringGroups cover all section numbers', () => {
    const coveredSections = config.mockExam.scoringGroups
      .flatMap(g => g.sectionNumbers);
    const allSectionNumbers = [...new Set(
      config.sections.flatMap(s => s.parts.map(p => p.mockExamSectionNumber))
    )];
    for (const num of allSectionNumbers) {
      expect(coveredSections).toContain(num);
    }
  });

  it('passingTotalPoints is 60% of totalMaxPoints (or custom)', () => {
    // Most exams use 60% passing score
    const expected60Percent = Math.round(config.mockExam.totalMaxPoints * 0.6);
    // Allow some tolerance for rounding
    expect(config.mockExam.passingTotalPoints).toBeCloseTo(expected60Percent, 0);
  });

  it('each scoring group passingPoints is 60% of maxPoints', () => {
    for (const group of config.mockExam.scoringGroups) {
      const expected = Math.round(group.maxPoints * 0.6);
      expect(group.passingPoints).toBeCloseTo(expected, 0);
    }
  });
});
```

### 4.3 Translation Key Existence Tests

```typescript
// src/config/__tests__/translation-keys.test.ts

import en from '../../locales/en.json';

describe.each(examIds)('Translation Keys: %s', (examId) => {
  const config = EXAM_CONFIGS[examId];

  it('all titleKeys exist in English translations', () => {
    for (const section of config.sections) {
      expect(getNestedKey(en, section.menuTitleKey)).toBeDefined();
      for (const part of section.parts) {
        expect(getNestedKey(en, part.titleKey)).toBeDefined();
        expect(getNestedKey(en, part.descriptionKey)).toBeDefined();
        expect(getNestedKey(en, part.navTitleKey)).toBeDefined();
      }
    }
  });
});

function getNestedKey(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}
```

### 4.4 Cross-Config Consistency Tests

```typescript
// Verify configs that SHOULD match (e.g., telc B1 German and B1 English share structure)
describe('Cross-config consistency', () => {
  it('german-b1 and english-b1 have same section IDs', () => {
    const germanSections = EXAM_CONFIGS['german-b1'].sections.map(s => s.id);
    const englishSections = EXAM_CONFIGS['english-b1'].sections.map(s => s.id);
    expect(germanSections).toEqual(englishSections);
  });

  it('german-b1 and english-b1 have same mock exam step order', () => {
    expect(EXAM_CONFIGS['german-b1'].mockExam.stepOrder)
      .toEqual(EXAM_CONFIGS['english-b1'].mockExam.stepOrder);
  });
  
  it('german-a1 and goethe-german-a1 have same section structure', () => {
    const telcSections = EXAM_CONFIGS['german-a1'].sections.map(s => s.id).sort();
    const goetheSections = EXAM_CONFIGS['goethe-german-a1'].sections.map(s => s.id).sort();
    expect(telcSections).toEqual(goetheSections);
  });
});
```

---

## 5. Layer 2: Component Snapshot Tests

Snapshot tests catch unintended changes in rendered component output. They are especially valuable during refactoring because they show exactly what changed.

### 5.1 Setup

Add `@testing-library/react-native` to devDependencies:

```bash
npm install --save-dev @testing-library/react-native
```

### 5.2 Menu Screen Snapshots (Before/After Guard)

**Strategy**: Create snapshots of each menu screen for each exam config BEFORE the refactor. After refactoring to config-driven rendering, the snapshots should produce identical output.

```typescript
// src/screens/practice/__tests__/PracticeMenuScreen.snapshot.test.tsx

import { render } from '@testing-library/react-native';
import PracticeMenuScreen from '../PracticeMenuScreen';
import { EXAM_CONFIGS } from '../../config/exams';

// Mock the active exam config for each test
jest.mock('../../config/active-exam.config', () => ({
  get activeExamConfig() {
    return currentConfig;
  },
}));

let currentConfig: any;

describe.each(Object.keys(EXAM_CONFIGS))('PracticeMenuScreen snapshot: %s', (examId) => {
  beforeEach(() => {
    currentConfig = EXAM_CONFIGS[examId];
  });

  it('renders correctly', () => {
    const { toJSON } = render(<PracticeMenuScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

**This is the single most important test for the refactor**: if the snapshot matches before and after, the UI is guaranteed identical.

### 5.3 Mock Exam Stepper Snapshot

```typescript
// Snapshot the ExamStepper component for each config to ensure steps display correctly
describe.each(Object.keys(EXAM_CONFIGS))('MockExam step list: %s', (examId) => {
  it('generates correct steps', () => {
    const config = EXAM_CONFIGS[examId];
    const steps = generateMockExamSteps(config);
    expect(steps).toMatchSnapshot();
  });
});
```

---

## 6. Layer 3: Integration Tests (Behavior)

These tests verify that user interactions produce correct outcomes.

### 6.1 Setup

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### 6.2 Menu Navigation Tests

```typescript
// src/screens/practice/__tests__/SectionMenuScreen.integration.test.tsx

import { render, fireEvent } from '@testing-library/react-native';
import SectionMenuScreen from '../SectionMenuScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('SectionMenuScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to correct screen when Part 1 is pressed (german-b1)', () => {
    currentConfig = EXAM_CONFIGS['german-b1'];
    const { getByText } = render(<SectionMenuScreen sectionId="reading" />);
    
    fireEvent.press(getByText('Part 1: Global Understanding'));
    
    expect(mockNavigate).toHaveBeenCalledWith('ReadingPart1', expect.any(Object));
  });

  it('navigates to A1 screen when Part 1 is pressed (german-a1)', () => {
    currentConfig = EXAM_CONFIGS['german-a1'];
    const { getByText } = render(<SectionMenuScreen sectionId="reading" />);
    
    fireEvent.press(getByText(expect.any(String))); // First part card
    
    expect(mockNavigate).toHaveBeenCalledWith('ReadingPart1A1', expect.any(Object));
  });
});
```

### 6.3 Score Calculation Integration Tests

```typescript
// src/utils/__tests__/score-calculator.test.ts

import { calculateResults, calculateOverallResult } from '../score-calculator';

describe('Score Calculator', () => {
  describe('German B1 scoring', () => {
    const config = EXAM_CONFIGS['german-b1'];

    it('calculates passing result correctly', () => {
      const steps = createMockSteps(config, { allCorrect: true });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(true);
    });

    it('calculates failing result at 50%', () => {
      const steps = createMockSteps(config, { correctPercentage: 0.5 });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(false);
    });

    it('fails if written section below 60% even if total is 60%', () => {
      // Scenario: high oral, low written
      const steps = createMockStepsWithSkew(config, {
        writtenPercentage: 0.55,
        oralPercentage: 0.80,
      });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(false);
    });
  });

  describe('DELE B1 scoring', () => {
    const config = EXAM_CONFIGS['dele-spanish-b1'];

    it('requires both groups to pass independently', () => {
      const steps = createMockStepsWithGroupScores(config, {
        readingWriting: 35, // > 30, pass
        listeningSpeaking: 20, // < 30, fail
      });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(false);
    });
  });

  // Compare old vs new calculation for each exam
  describe.each(Object.keys(EXAM_CONFIGS))('Backward compatibility: %s', (examId) => {
    it('produces same results as legacy calculation', () => {
      const config = EXAM_CONFIGS[examId];
      const steps = createMockSteps(config, { correctPercentage: 0.65 });
      
      const newResult = calculateOverallResult(config, steps);
      const legacyResult = legacyCalculateResult(examId, steps); // Keep old logic as reference
      
      expect(newResult.totalScore).toBeCloseTo(legacyResult.totalScore, 1);
      expect(newResult.passedOverall).toBe(legacyResult.passedOverall);
    });
  });
});
```

---

## 7. Layer 4: E2E Testing (Maestro)

### 7.1 Why Maestro

[Maestro](https://maestro.mobile.dev/) is the recommended E2E testing tool for this project because:

| Criteria | Maestro | Detox | Appium | Playwright |
|----------|---------|-------|--------|------------|
| React Native support | ✅ Native | ✅ Native | ✅ Via driver | ❌ Web only |
| Setup complexity | Low (single binary) | High (native build integration) | Very High | N/A for mobile |
| Test authoring | Simple YAML | JavaScript | Multiple languages | JavaScript |
| Speed | Fast | Fast | Slow | N/A |
| iOS Simulator support | ✅ | ✅ | ✅ | ❌ |
| Android Emulator support | ✅ | ✅ | ✅ | ❌ |
| CI integration | Simple | Complex | Complex | N/A |
| Learning curve | Very low | Medium | High | N/A |
| Flakiness | Low | Medium | High | N/A |
| Existing YAML test format | ✅ Compatible | ❌ | ❌ | ❌ |

**Playwright cannot test React Native apps** — it's for web/browser testing only. Your existing `test-cases.yaml` is already close to Maestro's format, making migration straightforward.

### 7.2 Maestro Installation & Setup

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### 7.3 Maestro Test Structure

```
app/GermanTelcB1App/
├── .maestro/
│   ├── config.yaml               # Global config
│   ├── shared/
│   │   ├── onboarding.yaml       # Reusable onboarding flow
│   │   └── login.yaml            # Reusable login flow
│   ├── practice-menu/
│   │   ├── german-b1.yaml        # Practice menu tests for German B1
│   │   ├── german-a1.yaml        # Practice menu tests for German A1
│   │   ├── dele-spanish-b1.yaml  # Practice menu tests for DELE
│   │   └── ...
│   ├── reading/
│   │   ├── reading-flow.yaml     # Generic reading part flow
│   │   └── ...
│   ├── mock-exam/
│   │   ├── start-exam.yaml
│   │   ├── complete-reading.yaml
│   │   ├── score-display.yaml
│   │   └── ...
│   └── regression/
│       ├── all-sections-visible.yaml
│       └── mock-exam-scoring.yaml
```

### 7.4 Example Maestro Tests

#### Practice Menu Validation (per exam config)

```yaml
# .maestro/practice-menu/german-b1.yaml
appId: com.mhamada.telcb1german
---
# Complete onboarding
- runFlow: ../shared/onboarding.yaml

# Navigate to Practice Menu
- tapOn: "Solve Questions"  # or match by testID
- assertVisible: "Reading"
- assertVisible: "Listening"
- assertVisible: "Grammar"   # B1 has grammar
- assertVisible: "Writing"
- assertVisible: "Speaking"

# Navigate to Reading Menu
- tapOn: "Reading"
- assertVisible: "Part 1"
- assertVisible: "Part 2"
- assertVisible: "Part 3"
- back

# Navigate to Listening Menu
- tapOn: "Listening"
- assertVisible: "Part 1"
- assertVisible: "Part 2"
- assertVisible: "Part 3"
- back
```

```yaml
# .maestro/practice-menu/german-a1.yaml
appId: com.mhamada.telca1german
---
- runFlow: ../shared/onboarding.yaml

- tapOn: "Solve Questions"
- assertVisible: "Reading"
- assertVisible: "Listening"
- assertNotVisible: "Grammar"   # A1 has NO grammar
- assertVisible: "Writing"
- assertVisible: "Speaking"

# Verify Reading has A1-specific part titles
- tapOn: "Reading"
- assertVisible:
    text: ".*Part 1.*"
    # A1 parts should show A1-specific descriptions
- back
```

```yaml
# .maestro/practice-menu/dele-spanish-b1.yaml
appId: com.mhamada.deleb1spanish
---
- runFlow: ../shared/onboarding.yaml

- tapOn: "Solve Questions"
- assertVisible: "Reading"
- assertVisible: "Listening"
- assertVisible: "Grammar"
- assertVisible: "Writing"
- assertVisible: "Speaking"

# DELE Listening should have 5 parts
- tapOn: "Listening"
- assertVisible: "Tarea 1"
- assertVisible: "Tarea 2"
- assertVisible: "Tarea 3"
- assertVisible: "Tarea 4"
- assertVisible: "Tarea 5"
- back
```

#### Mock Exam Flow Test

```yaml
# .maestro/mock-exam/start-and-complete-reading.yaml
appId: com.mhamada.telcb1german
---
- runFlow: ../shared/onboarding.yaml

# Navigate to Mock Exam
- tapOn:
    id: "mock-exam-tab"
    
# Start exam
- tapOn: "Start Exam"

# Verify first step is displayed (Reading Part 1)
- assertVisible: "Leseverstehen"
- assertVisible: "Teil 1"

# Answer questions (tap first option for each)
- tapOn:
    index: 0
    id: "answer-option"
# ... (abbreviated - would repeat for all questions)

# Submit answers
- tapOn: "Submit"

# Verify score is displayed
- assertVisible: "/"  # Shows "X / 25" format
```

#### Reading Part Navigation Test

```yaml
# .maestro/reading/complete-reading-part1.yaml
appId: com.mhamada.telcb1german
---
- runFlow: ../shared/onboarding.yaml

# Navigate to Reading Part 1
- tapOn: "Solve Questions"
- tapOn: "Reading"
- tapOn: "Part 1"

# Select first exam from modal
- assertVisible: "Exam 1"
- tapOn: "Exam 1"

# Verify exam content loaded
- assertVisible:
    id: "reading-content"
    
# Verify questions are displayed
- assertVisible:
    id: "question-1"
```

### 7.5 Running Maestro Tests

```bash
# Run single test
maestro test .maestro/practice-menu/german-b1.yaml

# Run all tests for a specific exam
maestro test .maestro/practice-menu/

# Run with a specific app build
maestro test --app-id com.mhamada.telcb1german .maestro/practice-menu/german-b1.yaml

# Run and record video
maestro record .maestro/practice-menu/german-b1.yaml
```

### 7.6 Multi-App Testing Script

Since you build multiple apps from the same codebase, create a script that tests each build:

```bash
#!/bin/bash
# scripts/run-e2e-tests.sh

set -e

EXAMS=("german-a1" "german-a2" "german-b1" "german-b2" "english-b1" "english-b2" "dele-spanish-b1" "goethe-german-a1")

for EXAM_ID in "${EXAMS[@]}"; do
  echo "========================================"
  echo "Testing: $EXAM_ID"
  echo "========================================"
  
  # Build the app for this exam
  ./scripts/build-config.sh "$EXAM_ID" ios
  npx react-native run-ios --scheme ExamPreparationApp --simulator "iPhone 16"
  
  # Wait for app to launch
  sleep 10
  
  # Run Maestro tests for this exam
  maestro test ".maestro/practice-menu/${EXAM_ID}.yaml"
  maestro test ".maestro/mock-exam/start-exam.yaml"
  
  echo "✅ $EXAM_ID passed"
done

echo "========================================"
echo "All E2E tests passed!"
echo "========================================"
```

---

## 8. Layer 5: Firebase Test Lab AI Testing

You already have `test-cases.yaml` in Firebase AI Testing format. This provides **exploratory testing** on real devices.

### 8.1 Extend Existing Test Cases

Add test cases specifically for the refactored areas:

```yaml
# Addition to test-cases.yaml

- displayName: Verify Practice Menu Sections Match Exam Level
  id: verify-practice-menu-sections
  prerequisiteTestCaseId: onboarding-complete
  steps:
    - goal: Open Practice Menu
      hint: Tap "Solve Questions" from Home
      successCriteria: Practice Menu is displayed
    - goal: Count visible sections
      hint: Scroll through all cards and note which are present
      successCriteria: |
        For B1/B2: Reading, Listening, Grammar, Writing, Speaking visible
        For A1/A2: Reading, Listening, Writing, Speaking visible (NO Grammar)
        For DELE: Reading, Listening, Grammar, Writing, Speaking visible
    - goal: Verify no unexpected sections are visible
      hint: Check there are no extra cards or duplicate sections
      successCriteria: Only expected sections are shown

- displayName: Mock Exam Score Calculation Validation
  id: mock-exam-score-validation
  prerequisiteTestCaseId: onboarding-complete
  steps:
    - goal: Start a mock exam
      hint: Go to Mock Exam tab and tap Start
      successCriteria: Mock exam begins
    - goal: Complete all reading questions (answer all correctly)
      hint: Answer each question correctly using the given options
      successCriteria: Each part shows green/correct indicators
    - goal: Complete all remaining sections
      hint: Continue through grammar, listening, writing
      successCriteria: All sections are completed
    - goal: Verify final score display
      hint: Check the results screen
      successCriteria: |
        Score should show correct total
        Pass/fail determination should be correct
        Written and oral sections should show separately
```

### 8.2 Upload to Firebase

```bash
# Upload test cases to Firebase Test Lab
firebase appdistribution:testers:add --file test-cases.yaml
```

---

## 9. Why Maestro, Not Playwright/Detox/Appium

### Playwright

**Cannot be used for this project.** Playwright tests web applications in browsers. React Native apps are native mobile apps — they don't run in a browser. There is no DOM, no CSS selectors, no browser context. Playwright is completely inapplicable here.

### Detox (by Wix)

Detox is a valid option for React Native E2E testing, but it has significant downsides:

- **Complex setup**: Requires native build system integration, modifying `metro.config.js`, adding native dependencies
- **Flaky on CI**: Known for intermittent failures due to synchronization issues
- **Slow feedback loop**: Tests are written in JavaScript, requiring compilation and bundling
- **Per-platform config**: Separate configuration for iOS and Android
- **Maintenance burden**: Breaking changes with React Native upgrades

### Appium

- **Very slow**: Uses WebDriver protocol, each command is an HTTP request
- **Complex setup**: Requires Appium server, platform-specific drivers, capabilities config
- **High flakiness**: Network latency between test runner and device causes timing issues
- **Overkill**: Designed for cross-platform automation with multiple languages, unnecessary complexity

### Maestro (Recommended)

- **Zero native integration**: No changes to app code, no native modules, no build modifications
- **YAML-based**: Already matches your `test-cases.yaml` format
- **Fast and stable**: Direct gRPC connection to simulator, no WebDriver overhead
- **Simple CI**: Single binary, runs on macOS/Linux, no server to manage
- **Visual testing**: Built-in screenshot comparison
- **Multi-app support**: Easy to switch between app IDs (your exact use case)

---

## 10. Mock Exam Validation Strategy

The mock exam is the highest-risk area. Here's a dedicated validation approach:

### 10.1 Golden File Testing

Before refactoring, capture the **exact mock exam behavior** for each exam config as "golden files":

```typescript
// scripts/generate-mock-exam-golden-files.ts

import { EXAM_CONFIGS } from '../src/config/exams';

for (const [examId, config] of Object.entries(EXAM_CONFIGS)) {
  // Generate what the mock exam SHOULD look like
  const golden = {
    examId,
    steps: getCurrentMockExamSteps(examId), // Use CURRENT logic
    totalMaxPoints: getCurrentTotalMaxPoints(examId),
    passingPoints: getCurrentPassingPoints(examId),
    scoringGroups: getCurrentScoringGroups(examId),
    // For a 100% correct mock exam:
    perfectScore: calculateCurrentPerfectScore(examId),
    // For a 60% correct mock exam:
    borderlineScore: calculateCurrentBorderlineScore(examId),
  };
  
  fs.writeFileSync(
    `src/config/__tests__/golden/${examId}.mock-exam.json`,
    JSON.stringify(golden, null, 2)
  );
}
```

After refactoring, run the new config-driven logic and compare output against golden files:

```typescript
// src/config/__tests__/mock-exam-golden.test.ts

describe.each(examIds)('Mock exam golden file comparison: %s', (examId) => {
  const golden = require(`./golden/${examId}.mock-exam.json`);
  const config = EXAM_CONFIGS[examId];

  it('generates same steps as before', () => {
    const newSteps = generateMockExamSteps(config);
    expect(newSteps.map(s => s.id)).toEqual(golden.steps.map(s => s.id));
    expect(newSteps.map(s => s.maxPoints)).toEqual(golden.steps.map(s => s.maxPoints));
    expect(newSteps.map(s => s.timeMinutes)).toEqual(golden.steps.map(s => s.timeMinutes));
  });

  it('calculates same perfect score', () => {
    const newPerfect = calculatePerfectScore(config);
    expect(newPerfect).toBe(golden.perfectScore);
  });

  it('calculates same borderline pass/fail', () => {
    const newBorderline = calculateBorderlineResult(config);
    expect(newBorderline.passedOverall).toBe(golden.borderlineScore.passedOverall);
  });
});
```

### 10.2 Step-by-Step Wrapper Rendering Test

```typescript
// Verify that each step in the mock exam renders the correct wrapper
describe.each(examIds)('Wrapper rendering: %s', (examId) => {
  const config = EXAM_CONFIGS[examId];
  
  it('each step resolves to a valid wrapper component', () => {
    for (const stepId of config.mockExam.stepOrder) {
      const part = findPartConfig(config, stepId);
      
      if (part.skipInMockExam) continue;
      
      const wrapper = WRAPPER_REGISTRY[part.wrapperKey];
      expect(wrapper).toBeDefined();
      expect(typeof wrapper).toBe('function'); // Is a React component
    }
  });
});
```

---

## 11. Score Calculation Validation

### 11.1 Property-Based Testing

Use `fast-check` for exhaustive score calculation testing:

```bash
npm install --save-dev fast-check
```

```typescript
// src/utils/__tests__/score-calculator.property.test.ts

import * as fc from 'fast-check';
import { calculateOverallResult } from '../score-calculator';

describe('Score calculator properties', () => {
  describe.each(examIds)('%s', (examId) => {
    const config = EXAM_CONFIGS[examId];

    it('total score is always >= 0 and <= totalMaxPoints', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 1 }), { 
            minLength: config.mockExam.stepOrder.length,
            maxLength: config.mockExam.stepOrder.length 
          }),
          (percentages) => {
            const steps = createStepsFromPercentages(config, percentages);
            const result = calculateOverallResult(config, steps);
            return result.totalScore >= 0 && result.totalScore <= config.mockExam.totalMaxPoints;
          }
        )
      );
    });

    it('100% correct always passes', () => {
      const steps = createMockSteps(config, { correctPercentage: 1.0 });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(true);
    });

    it('0% correct always fails', () => {
      const steps = createMockSteps(config, { correctPercentage: 0 });
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(false);
    });

    it('exactly 60% in all groups passes', () => {
      const steps = createMockStepsAllGroupsAt(config, 0.6);
      const result = calculateOverallResult(config, steps);
      expect(result.passedOverall).toBe(true);
    });

    it('59% in any group fails', () => {
      for (const group of config.mockExam.scoringGroups) {
        const steps = createMockStepsWithOneGroupAt(config, group.id, 0.59);
        const result = calculateOverallResult(config, steps);
        expect(result.passedOverall).toBe(false);
      }
    });
  });
});
```

### 11.2 Exact Score Reproduction Tests

Create tests with known question counts and verify exact point values:

```typescript
describe('Exact score values - German B1', () => {
  const config = EXAM_CONFIGS['german-b1'];

  it('reading-1: 5 correct out of 5 = 25 points', () => {
    const score = calculateStepScore(config, 'reading-1', 5, 5);
    expect(score).toBe(25);
  });

  it('reading-1: 3 correct out of 5 = 15 points', () => {
    const score = calculateStepScore(config, 'reading-1', 3, 5);
    expect(score).toBe(15);
  });

  it('language-1: 6 correct out of 6 = 15 points', () => {
    const score = calculateStepScore(config, 'language-1', 6, 6);
    expect(score).toBe(15);
  });
});

describe('Exact score values - DELE B1', () => {
  const config = EXAM_CONFIGS['dele-spanish-b1'];

  it('writing-1: score 20/25 with 0.5 scaling = 10 points', () => {
    const score = calculateStepScore(config, 'writing-1', 20, 25);
    expect(score).toBe(10);
  });
});
```

---

## 12. Regression Safety Net: Before/After Comparison

### 12.1 The "Dual-Run" Approach

During migration, keep the **old code** and **new config-driven code** running side-by-side in development mode, asserting they produce identical results:

```typescript
// src/utils/migration-validator.ts (TEMPORARY - remove after migration)

export const validateMigration = (examId: string) => {
  if (!__DEV__) return; // Only in development

  const config = EXAM_CONFIGS[examId];
  
  // OLD: hardcoded steps
  const oldSteps = getOldMockExamSteps(examId);
  // NEW: config-driven steps
  const newSteps = generateMockExamSteps(config);
  
  // Compare
  if (JSON.stringify(oldSteps) !== JSON.stringify(newSteps)) {
    console.error('⚠️ MIGRATION MISMATCH: Mock exam steps differ!');
    console.error('Old:', oldSteps);
    console.error('New:', newSteps);
  }
  
  // Validate score calculation
  const testScenarios = [0, 0.3, 0.59, 0.6, 0.61, 0.8, 1.0];
  for (const pct of testScenarios) {
    const oldResult = oldCalculateResult(examId, pct);
    const newResult = calculateOverallResult(config, createMockSteps(config, { correctPercentage: pct }));
    
    if (oldResult.passedOverall !== newResult.passedOverall) {
      console.error(`⚠️ SCORING MISMATCH at ${pct * 100}%: old=${oldResult.passedOverall}, new=${newResult.passedOverall}`);
    }
  }
};
```

Call this validator in `MockExamScreen` during development:

```typescript
useEffect(() => {
  if (__DEV__) {
    validateMigration(activeExamConfig.id);
  }
}, []);
```

### 12.2 Screenshot Comparison (Maestro)

Maestro supports visual screenshot comparison:

```yaml
# .maestro/regression/practice-menu-visual.yaml
appId: com.mhamada.telcb1german
---
- runFlow: ../shared/onboarding.yaml
- tapOn: "Solve Questions"
- takeScreenshot: practice-menu-german-b1
```

Run before and after, then compare:

```bash
# Before refactor
maestro test .maestro/regression/ --output screenshots/before/

# After refactor
maestro test .maestro/regression/ --output screenshots/after/

# Compare
maestro diff screenshots/before/ screenshots/after/
```

---

## 13. CI/CD Integration

### 13.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
    paths:
      - 'app/GermanTelcB1App/src/**'
      - 'app/GermanTelcB1App/package.json'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd app/GermanTelcB1App && npm ci
      - run: cd app/GermanTelcB1App && npm test -- --coverage
      
  e2e-tests:
    runs-on: macos-14  # M1 Mac for iOS simulator
    strategy:
      matrix:
        exam: [german-b1, german-a1, dele-spanish-b1]  # Critical subset
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd app/GermanTelcB1App && npm ci
      - run: cd app/GermanTelcB1App && ./scripts/build-config.sh ${{ matrix.exam }} ios
      - name: Build iOS app
        run: cd app/GermanTelcB1App/ios && xcodebuild -scheme ExamPreparationApp -sdk iphonesimulator -derivedDataPath build
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run E2E tests
        run: |
          cd app/GermanTelcB1App
          maestro test .maestro/practice-menu/${{ matrix.exam }}.yaml
          maestro test .maestro/mock-exam/start-exam.yaml
```

### 13.2 Test Pyramid in CI

| Layer | When | Duration | Blocking? |
|-------|------|----------|-----------|
| Unit + Config tests | Every PR | ~10s | ✅ Yes |
| Snapshot tests | Every PR | ~30s | ✅ Yes |
| Integration tests | Every PR | ~2min | ✅ Yes |
| E2E (3 key exams) | Every PR | ~15min | ✅ Yes |
| E2E (all 8 exams) | Nightly / pre-release | ~45min | ⚠️ Advisory |
| Firebase AI Testing | Pre-release | ~30min | ⚠️ Advisory |

---

## 14. Phased Testing Rollout

### Phase 0: Pre-Migration (Do This First)

| Step | Action | Purpose |
|------|--------|---------|
| 0.1 | Generate golden files for all 8 exam configs | Capture current correct behavior |
| 0.2 | Create snapshot tests for all menu screens (current code) | Baseline for comparison |
| 0.3 | Create unit tests for current score calculation | Ensure backward compat |
| 0.4 | Install Maestro, write 3 basic flows (onboarding, practice menu, mock exam start) | Validate tooling works |

### Phase 1: Config Validation Tests

| Step | Action | Tests Added |
|------|--------|-------------|
| 1.1 | Write config schema tests | ~40 tests (5 per exam × 8 exams) |
| 1.2 | Write translation key existence tests | ~8 tests |
| 1.3 | Write cross-config consistency tests | ~10 tests |
| 1.4 | Write mock exam config validation tests | ~32 tests |

### Phase 2: Score Calculator Tests (Before Refactoring Score Code)

| Step | Action | Tests Added |
|------|--------|-------------|
| 2.1 | Write exact score reproduction tests | ~24 tests |
| 2.2 | Write property-based tests | ~16 tests |
| 2.3 | Write golden file comparison tests | ~8 tests |

### Phase 3: Component Tests (During Menu Refactor)

| Step | Action | Tests Added |
|------|--------|-------------|
| 3.1 | Snapshot tests for new SectionMenuScreen | ~40 snapshots |
| 3.2 | Integration tests for navigation behavior | ~24 tests |
| 3.3 | Snapshot tests for PracticeMenuScreen | ~8 snapshots |

### Phase 4: E2E Tests (After Core Refactor)

| Step | Action | Tests Added |
|------|--------|-------------|
| 4.1 | Maestro practice menu tests (all 8 exams) | 8 flows |
| 4.2 | Maestro reading/listening navigation tests | 8 flows |
| 4.3 | Maestro mock exam start + first step tests | 3 flows |
| 4.4 | Maestro score display tests | 3 flows |

### Phase 5: Final Validation

| Step | Action |
|------|--------|
| 5.1 | Run full Maestro suite across all 8 builds |
| 5.2 | Run Firebase AI Testing on real devices |
| 5.3 | Manual smoke test of mock exam completion (3 exams: B1, A1, DELE) |
| 5.4 | Compare screenshots before/after |

---

## 15. Test Matrix

### Critical Paths to Test Per Exam Config

| Flow | german-b1 | german-a1 | german-a2 | german-b2 | english-b1 | english-b2 | dele-b1 | goethe-a1 |
|------|-----------|-----------|-----------|-----------|------------|------------|---------|-----------|
| Practice menu sections visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reading menu parts visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listening menu parts visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grammar visible/hidden correctly | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Writing menu parts visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Speaking menu parts visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock exam starts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock exam correct step order | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock exam score at 100% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock exam pass/fail at 60% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock exam pass/fail at 59% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Navigation to correct screens | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data loads for each section | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Total: 104 critical test scenarios**

### Minimum Viable Testing (3 representative exams)

If time is limited, testing these 3 exams covers all unique code paths:

1. **`german-b1`** — Standard B1/B2 Telc structure (covers English B1/B2, German B2)
2. **`german-a1`** — A1/A2 structure with no grammar (covers German A2, Goethe A1)
3. **`dele-spanish-b1`** — DELE structure with 5 listening parts, 4 speaking parts, different scoring

---

## 16. Effort Estimation

### Testing Infrastructure Setup

| Task | Effort | Priority |
|------|--------|----------|
| Install & configure `@testing-library/react-native` | 1 hour | High |
| Install & configure Maestro | 30 min | High |
| Create mock/fixture utilities for tests | 2 hours | High |
| Set up golden file generation script | 2 hours | High |
| Create shared Maestro flows (onboarding, login) | 1 hour | High |

### Test Writing

| Layer | Tests | Effort | Priority |
|-------|-------|--------|----------|
| Config validation (Layer 1) | ~90 tests | 4 hours | **Critical** |
| Snapshot tests (Layer 2) | ~50 snapshots | 3 hours | High |
| Integration tests (Layer 3) | ~40 tests | 6 hours | High |
| Score calculation tests | ~50 tests | 4 hours | **Critical** |
| Maestro E2E flows | ~20 flows | 8 hours | Medium |
| CI/CD integration | 1 workflow | 2 hours | Medium |

### Total

| Category | Effort |
|----------|--------|
| Infrastructure setup | ~6 hours |
| Critical tests (configs + scoring) | ~8 hours |
| Component tests | ~9 hours |
| E2E tests | ~8 hours |
| CI integration | ~2 hours |
| **Total** | **~33 hours** |

### Recommended Minimum Investment

If you can only invest limited time, prioritize in this order:

1. **Config validation tests** (4 hours) — Catches 80% of likely bugs
2. **Score calculation tests with golden files** (4 hours) — Prevents the most user-visible bugs
3. **Maestro practice menu tests for 3 key exams** (3 hours) — Validates UI end-to-end
4. **Snapshot tests for menu screens** (3 hours) — Ensures refactor doesn't change output

These 4 items (~14 hours) provide high confidence with minimal investment.

---

## Summary

| Question | Answer |
|----------|--------|
| Can we use Playwright? | **No** — Playwright is for web browsers, not React Native mobile apps |
| What E2E tool should we use? | **Maestro** — YAML-based, fast, works with React Native, matches your existing test-cases.yaml format |
| What's the highest-value test? | **Config validation unit tests** — catches 80% of refactoring bugs in milliseconds |
| What's the biggest risk? | **Score calculation** — wrong pass/fail affects user confidence |
| How do we prevent regression? | **Golden files** + **before/after snapshots** + **dual-run validator in dev mode** |
| How much testing is "enough"? | **14 hours minimum** (configs + scoring + 3-exam E2E) for high confidence |
| Do we need to test all 8 exams? | **3 representative exams** (B1, A1, DELE) cover all unique code paths; test all 8 before release |
