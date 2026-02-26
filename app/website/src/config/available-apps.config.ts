/**
 * Available Apps Configuration
 * Define which languages and levels are available for each exam type
 */

import { AppLanguage, AppLevel, ExamType, ExamProvider } from './apps.config';

export interface LanguageOption {
  id: AppLanguage;
  flag: string;
  label: string;
  availableLevels: {
    level: AppLevel;
    label: string;
    isAvailable: boolean;
    examProvider?: ExamProvider;
  }[];
}

export interface ExamTypeAvailableApps {
  examType: ExamType;
  examProvider?: ExamProvider;
  languages: LanguageOption[];
}

export const availableAppsConfig: ExamTypeAvailableApps[] = [
  {
    examType: 'telc',
    examProvider: 'telc',
    languages: [
      {
        id: 'german',
        flag: '🇩🇪',
        label: 'German',
        availableLevels: [
          { level: 'A1', label: 'Beginner', isAvailable: true, examProvider: 'telc' },
          { level: 'B1', label: 'Intermediate', isAvailable: true, examProvider: 'telc' },
          { level: 'B2', label: 'Upper Intermediate', isAvailable: true, examProvider: 'telc' },
        ],
      },
      {
        id: 'english',
        flag: '🇬🇧',
        label: 'English',
        availableLevels: [
          { level: 'B1', label: 'Intermediate', isAvailable: true, examProvider: 'telc' },
          { level: 'B2', label: 'Upper Intermediate', isAvailable: true, examProvider: 'telc' },
        ],
      },
    ],
  },
  {
    examType: 'dele',
    examProvider: 'dele',
    languages: [
      {
        id: 'spanish',
        flag: '🇪🇸',
        label: 'Spanish',
        availableLevels: [
          { level: 'B1', label: 'Intermediate', isAvailable: true, examProvider: 'dele' },
        ],
      },
    ],
  },
  {
    examType: 'telc',
    examProvider: 'goethe',
    languages: [
      {
        id: 'german',
        flag: '🇩🇪',
        label: 'German',
        availableLevels: [
          { level: 'A1', label: 'Beginner', isAvailable: true, examProvider: 'goethe' },
        ],
      },
    ],
  },
];

/**
 * Get available apps configuration for a specific exam type
 * If examProvider is 'all', return all apps
 */
export const getAvailableAppsForExamType = (examType: ExamType, examProvider?: ExamProvider | 'all'): LanguageOption[] => {
  // If examProvider is 'all', merge all configurations for all providers
  if (examProvider === 'all') {
    const allLanguages: Map<AppLanguage, LanguageOption> = new Map();
    
    availableAppsConfig.forEach(config => {
      config.languages.forEach(lang => {
        const existing = allLanguages.get(lang.id);
        if (existing) {
          // Merge levels from different providers
          const existingLevels = new Set(existing.availableLevels.map(l => `${l.level}-${l.examProvider}`));
          lang.availableLevels.forEach(level => {
            const key = `${level.level}-${level.examProvider}`;
            if (!existingLevels.has(key)) {
              existing.availableLevels.push(level);
            }
          });
        } else {
          allLanguages.set(lang.id, { ...lang, availableLevels: [...lang.availableLevels] });
        }
      });
    });
    
    return Array.from(allLanguages.values());
  }
  
  // Filter by examType and optionally examProvider
  const configs = availableAppsConfig.filter(c => {
    if (c.examType !== examType) return false;
    if (examProvider && c.examProvider !== examProvider) return false;
    return true;
  });
  
  // Merge languages from all matching configs
  const languagesMap: Map<AppLanguage, LanguageOption> = new Map();
  configs.forEach(config => {
    config.languages.forEach(lang => {
      const existing = languagesMap.get(lang.id);
      if (existing) {
        // Merge levels
        const existingLevels = new Set(existing.availableLevels.map(l => `${l.level}-${l.examProvider}`));
        lang.availableLevels.forEach(level => {
          const key = `${level.level}-${level.examProvider}`;
          if (!existingLevels.has(key)) {
            existing.availableLevels.push(level);
          }
        });
      } else {
        languagesMap.set(lang.id, { ...lang, availableLevels: [...lang.availableLevels] });
      }
    });
  });
  
  return Array.from(languagesMap.values());
};
