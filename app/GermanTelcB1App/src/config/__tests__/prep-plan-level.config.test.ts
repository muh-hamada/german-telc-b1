/**
 * Tests for Prep Plan Level Configuration
 */

import {
  PREP_PLAN_CONFIG_A1,
  PREP_PLAN_CONFIG_B1,
  PREP_PLAN_CONFIG_B2,
  getPrepPlanConfig,
  getEnabledSections,
  getTotalAssessmentPoints,
  calculateSectionLevel,
  calculateOverallLevel,
  isSectionEnabled,
  getMinimumWeeks,
} from '../prep-plan-level.config';

describe('Prep Plan Level Configuration', () => {
  describe('Config Structure', () => {
    it('should have valid A1 configuration', () => {
      expect(PREP_PLAN_CONFIG_A1).toBeDefined();
      expect(PREP_PLAN_CONFIG_A1.level).toBe('A1');
      expect(PREP_PLAN_CONFIG_A1.sections).toHaveLength(5);
      expect(PREP_PLAN_CONFIG_A1.totalAssessmentPoints).toBe(26);
    });

    it('should have valid B1 configuration', () => {
      expect(PREP_PLAN_CONFIG_B1).toBeDefined();
      expect(PREP_PLAN_CONFIG_B1.level).toBe('B1');
      expect(PREP_PLAN_CONFIG_B1.sections).toHaveLength(5);
      expect(PREP_PLAN_CONFIG_B1.totalAssessmentPoints).toBe(100);
    });

    it('should have valid B2 configuration', () => {
      expect(PREP_PLAN_CONFIG_B2).toBeDefined();
      expect(PREP_PLAN_CONFIG_B2.level).toBe('B2');
      expect(PREP_PLAN_CONFIG_B2.sections).toHaveLength(5);
      expect(PREP_PLAN_CONFIG_B2.totalAssessmentPoints).toBe(100);
    });

    it('should have grammar disabled for A1', () => {
      const grammarSection = PREP_PLAN_CONFIG_A1.sections.find(
        (s) => s.sectionName === 'grammar'
      );
      expect(grammarSection?.enabled).toBe(false);
    });

    it('should have grammar enabled for B1 and B2', () => {
      const b1Grammar = PREP_PLAN_CONFIG_B1.sections.find(
        (s) => s.sectionName === 'grammar'
      );
      const b2Grammar = PREP_PLAN_CONFIG_B2.sections.find(
        (s) => s.sectionName === 'grammar'
      );
      expect(b1Grammar?.enabled).toBe(true);
      expect(b2Grammar?.enabled).toBe(true);
    });
  });

  describe('getPrepPlanConfig', () => {
    it('should return correct config for A1', () => {
      const config = getPrepPlanConfig('A1');
      expect(config).toEqual(PREP_PLAN_CONFIG_A1);
    });

    it('should return correct config for B1', () => {
      const config = getPrepPlanConfig('B1');
      expect(config).toEqual(PREP_PLAN_CONFIG_B1);
    });

    it('should return correct config for B2', () => {
      const config = getPrepPlanConfig('B2');
      expect(config).toEqual(PREP_PLAN_CONFIG_B2);
    });

    it('should throw error for unsupported level', () => {
      expect(() => getPrepPlanConfig('A2')).toThrow();
      expect(() => getPrepPlanConfig('C1')).toThrow();
    });
  });

  describe('getEnabledSections', () => {
    it('should return 4 enabled sections for A1 (no grammar)', () => {
      const sections = getEnabledSections('A1');
      expect(sections).toHaveLength(4);
      expect(sections.map((s) => s.sectionName)).not.toContain('grammar');
    });

    it('should return 5 enabled sections for B1', () => {
      const sections = getEnabledSections('B1');
      expect(sections).toHaveLength(5);
      expect(sections.map((s) => s.sectionName)).toContain('grammar');
    });

    it('should return 5 enabled sections for B2', () => {
      const sections = getEnabledSections('B2');
      expect(sections).toHaveLength(5);
    });
  });

  describe('getTotalAssessmentPoints', () => {
    it('should return correct total for A1', () => {
      expect(getTotalAssessmentPoints('A1')).toBe(26);
    });

    it('should return correct total for B1', () => {
      expect(getTotalAssessmentPoints('B1')).toBe(100);
    });

    it('should return correct total for B2', () => {
      expect(getTotalAssessmentPoints('B2')).toBe(100);
    });
  });

  describe('calculateSectionLevel', () => {
    const testSection = PREP_PLAN_CONFIG_B1.sections[0]; // Use reading as example

    it('should return "weak" for low percentage', () => {
      expect(calculateSectionLevel(30, testSection)).toBe('weak');
      expect(calculateSectionLevel(49, testSection)).toBe('weak');
    });

    it('should return "moderate" for medium percentage', () => {
      expect(calculateSectionLevel(50, testSection)).toBe('moderate');
      expect(calculateSectionLevel(69, testSection)).toBe('moderate');
    });

    it('should return "strong" for high percentage', () => {
      expect(calculateSectionLevel(70, testSection)).toBe('strong');
      expect(calculateSectionLevel(100, testSection)).toBe('strong');
    });
  });

  describe('calculateOverallLevel', () => {
    const config = PREP_PLAN_CONFIG_B1;

    it('should return "beginner" for low percentage', () => {
      expect(calculateOverallLevel(30, config)).toBe('beginner');
      expect(calculateOverallLevel(49, config)).toBe('beginner');
    });

    it('should return "intermediate" for medium percentage', () => {
      expect(calculateOverallLevel(50, config)).toBe('intermediate');
      expect(calculateOverallLevel(69, config)).toBe('intermediate');
    });

    it('should return "advanced" for high percentage', () => {
      expect(calculateOverallLevel(70, config)).toBe('advanced');
      expect(calculateOverallLevel(100, config)).toBe('advanced');
    });
  });

  describe('isSectionEnabled', () => {
    it('should return false for grammar on A1', () => {
      expect(isSectionEnabled('A1', 'grammar')).toBe(false);
    });

    it('should return true for grammar on B1', () => {
      expect(isSectionEnabled('B1', 'grammar')).toBe(true);
    });

    it('should return true for reading on all levels', () => {
      expect(isSectionEnabled('A1', 'reading')).toBe(true);
      expect(isSectionEnabled('B1', 'reading')).toBe(true);
      expect(isSectionEnabled('B2', 'reading')).toBe(true);
    });

    it('should return true for speaking on all levels', () => {
      expect(isSectionEnabled('A1', 'speaking')).toBe(true);
      expect(isSectionEnabled('B1', 'speaking')).toBe(true);
      expect(isSectionEnabled('B2', 'speaking')).toBe(true);
    });
  });

  describe('getMinimumWeeks', () => {
    it('should return 4 for all supported levels', () => {
      expect(getMinimumWeeks('A1')).toBe(4);
      expect(getMinimumWeeks('B1')).toBe(4);
      expect(getMinimumWeeks('B2')).toBe(4);
    });
  });

  describe('Task Distribution', () => {
    it('should have valid task distribution percentages', () => {
      [PREP_PLAN_CONFIG_A1, PREP_PLAN_CONFIG_B1, PREP_PLAN_CONFIG_B2].forEach(
        (config) => {
          const { weaknessPriority, moderatePriority, strengthPriority } =
            config.taskDistribution;
          const total = weaknessPriority + moderatePriority + strengthPriority;
          expect(total).toBeCloseTo(1.0, 2); // Sum should be 1.0 (100%)
        }
      );
    });

    it('should prioritize weaknesses over strengths', () => {
      [PREP_PLAN_CONFIG_A1, PREP_PLAN_CONFIG_B1, PREP_PLAN_CONFIG_B2].forEach(
        (config) => {
          expect(config.taskDistribution.weaknessPriority).toBeGreaterThan(
            config.taskDistribution.strengthPriority
          );
        }
      );
    });
  });

  describe('Section Thresholds', () => {
    it('should have consistent thresholds across all sections', () => {
      [PREP_PLAN_CONFIG_A1, PREP_PLAN_CONFIG_B1, PREP_PLAN_CONFIG_B2].forEach(
        (config) => {
          config.sections
            .filter((s) => s.enabled)
            .forEach((section) => {
              expect(section.thresholds.weak).toBeLessThan(
                section.thresholds.moderate
              );
              expect(section.thresholds.moderate).toBeLessThan(
                section.thresholds.strong
              );
            });
        }
      );
    });
  });
});

