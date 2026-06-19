import {
  ExamConfig,
  ExamPartConfig,
  ExamSectionConfig,
  ExtraMenuItem,
} from '../config/exam-config.types';
import { MockExamStep } from '../types/mock-exam.types';

/**
 * Finds a part config by its ID across all sections.
 * Returns undefined if not found.
 */
export const findPartConfig = (
  config: ExamConfig,
  partId: string,
): ExamPartConfig | undefined => {
  for (const section of config.sections) {
    for (const part of section.parts) {
      if (part.id === partId) return part;
    }
  }
  return undefined;
};

/**
 * Finds which section a part belongs to.
 * Returns undefined if not found.
 */
export const findSectionForPart = (
  config: ExamConfig,
  partId: string,
): ExamSectionConfig | undefined => {
  for (const section of config.sections) {
    if (section.parts.some(part => part.id === partId)) {
      return section;
    }
  }
  return undefined;
};

/**
 * Generates mock exam steps from the config.
 * Iterates config.mockExam.stepOrder, looks up each part in config.sections,
 * and builds a MockExamStep object. Filters out parts where
 * mockExamSectionNumber is in config.mockExam.skipSectionNumbers.
 */
export const generateMockExamSteps = (
  config: ExamConfig,
): Omit<MockExamStep, 'isCompleted' | 'score' | 'startTime' | 'endTime' | 'answers'>[] => {
  if (!config.mockExam) return [];

  const steps: Omit<MockExamStep, 'isCompleted' | 'score' | 'startTime' | 'endTime' | 'answers'>[] = [];

  for (const partId of config.mockExam.stepOrder) {
    const part = findPartConfig(config, partId);
    if (!part) continue;
    if (config.mockExam.skipSectionNumbers.includes(part.mockExamSectionNumber)) continue;

    steps.push({
      id: part.id,
      sectionNumber: part.mockExamSectionNumber,
      sectionName: part.mockExamSectionName,
      partNumber: part.partNumber,
      partName: part.mockExamPartName,
      maxPoints: part.maxPoints,
      timeMinutes: part.timeMinutes,
    });
  }

  return steps;
};

/**
 * Finds an extra menu item by ID across all sections.
 * Returns undefined if not found.
 */
export const findExtraMenuItem = (
  config: ExamConfig,
  itemId: string,
): ExtraMenuItem | undefined => {
  for (const section of config.sections) {
    if (section.extraMenuItems) {
      const item = section.extraMenuItems.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  return undefined;
};
