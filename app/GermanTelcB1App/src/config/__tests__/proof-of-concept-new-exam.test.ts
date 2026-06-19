/**
 * Step 7.2: Proof of Concept — Adding a New Exam Config
 *
 * This test proves that a new exam config can be created by:
 * 1. Importing an existing config as a base
 * 2. Overriding only the identity fields
 * 3. Everything works without modifying any other files
 *
 * This simulates adding a "Goethe German A2" exam using the existing
 * German A2 exam's sections/parts (same screens, same data loaders).
 */
import { germanA2Config } from '../exams/german-a2.config';
import { ExamConfig } from '../exam-config.types';
import { generateMockExamSteps, findPartConfig, findExtraMenuItem } from '../../utils/exam-config.utils';
import { calculateOverallResult } from '../../utils/score-calculator';
import { MockExamStep } from '../../types/mock-exam.types';

// Known valid screen keys from screen-registry (avoid importing the actual registry which pulls in React Navigation)
const KNOWN_SCREEN_KEYS = [
  'ReadingPart1', 'ReadingPart2', 'ReadingPart3',
  'ReadingPart1A1', 'ReadingPart2A1', 'ReadingPart3A1',
  'ReadingPart1A2', 'ReadingPart2A2', 'ReadingPart3A2',
  'GrammarPart1', 'GrammarPart2',
  'ListeningPart1', 'ListeningPart2', 'ListeningPart3',
  'ListeningPart1A1', 'ListeningPart2A1', 'ListeningPart3A1',
  'ListeningPart1A2', 'ListeningPart2A2', 'ListeningPart3A2',
  'WritingPart1', 'WritingPart2',
  'SpeakingPart1', 'SpeakingPart2', 'SpeakingPart3', 'SpeakingPart4',
  'A1SpeakingPart1', 'A1SpeakingPart2', 'A1SpeakingPart3',
];

const KNOWN_WRAPPER_KEYS = [
  'ReadingPart1Wrapper', 'ReadingPart2Wrapper', 'ReadingPart3Wrapper',
  'GrammarPart1Wrapper', 'GrammarPart2Wrapper',
  'ListeningPart1Wrapper', 'ListeningPart2Wrapper', 'ListeningPart3Wrapper',
  'WritingWrapper',
  'SpeakingPart1Wrapper', 'SpeakingPart2Wrapper', 'SpeakingPart3Wrapper', 'SpeakingPart4Wrapper',
  'A1SpeakingPart1Wrapper', 'A1SpeakingPart2Wrapper', 'A1SpeakingPart3Wrapper',
];

// Simulate creating a new config by overriding identity fields
const goetheGermanA2Config: ExamConfig = {
  ...germanA2Config,
  id: 'goethe-german-a2',
  provider: 'goethe',
  appName: 'GoetheGermanA2',
  displayName: 'Goethe German A2',
  bundleId: {
    android: 'com.mhamada.goethea2german',
    ios: 'com.mhamada.goethea2german',
  },
};

describe('Proof of Concept: New Exam Config (Goethe German A2)', () => {
  it('config is valid ExamConfig with required fields', () => {
    expect(goetheGermanA2Config.id).toBe('goethe-german-a2');
    expect(goetheGermanA2Config.sections).toBeDefined();
    expect(goetheGermanA2Config.sections.length).toBeGreaterThan(0);
    expect(goetheGermanA2Config.mockExam).toBeDefined();
    expect(goetheGermanA2Config.mockExam.stepOrder.length).toBeGreaterThan(0);
  });

  it('all screenKeys exist in SCREEN_REGISTRY', () => {
    for (const section of goetheGermanA2Config.sections) {
      for (const part of section.parts) {
        expect(KNOWN_SCREEN_KEYS).toContain(part.screenKey);
      }
    }
  });

  it('all wrapperKeys exist in WRAPPER_REGISTRY', () => {
    for (const section of goetheGermanA2Config.sections) {
      for (const part of section.parts) {
        expect(KNOWN_WRAPPER_KEYS).toContain(part.wrapperKey);
      }
    }
  });

  it('generateMockExamSteps produces valid steps', () => {
    const steps = generateMockExamSteps(goetheGermanA2Config);
    expect(steps.length).toBeGreaterThan(0);

    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.maxPoints).toBeGreaterThan(0);
      expect(step.timeMinutes).toBeGreaterThan(0);
    }
  });

  it('findPartConfig works for all stepOrder entries', () => {
    for (const partId of goetheGermanA2Config.mockExam.stepOrder) {
      const part = findPartConfig(goetheGermanA2Config, partId);
      expect(part).toBeDefined();
      expect(part!.id).toBe(partId);
    }
  });

  it('scoring works correctly', () => {
    const steps = generateMockExamSteps(goetheGermanA2Config);
    const perfectSteps: MockExamStep[] = steps.map(step => ({
      ...step,
      isCompleted: true,
      score: step.maxPoints,
      startTime: 1000,
      endTime: 2000,
      answers: [],
    }));

    const result = calculateOverallResult(goetheGermanA2Config, perfectSteps);
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.groupResults.length).toBeGreaterThan(0);
  });

  it('practice menu would show correct enabled sections', () => {
    const enabledSections = goetheGermanA2Config.sections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);

    expect(enabledSections.length).toBeGreaterThan(0);
    // Each section has a menu title key
    for (const section of enabledSections) {
      expect(section.menuTitleKey).toBeTruthy();
      expect(section.menuBehavior).toBeTruthy();
    }
  });

  it('no code changes needed — config reuses existing screens and wrappers', () => {
    // This test documents that the ONLY change needed is:
    // 1. Create config file (what we simulated above)
    // 2. Register in index.ts
    // 3. Set as active exam
    // No navigation, screen, or wrapper changes required.

    for (const section of goetheGermanA2Config.sections) {
      for (const part of section.parts) {
        expect(KNOWN_SCREEN_KEYS).toContain(part.screenKey);
        expect(KNOWN_WRAPPER_KEYS).toContain(part.wrapperKey);
      }
    }
  });
});
