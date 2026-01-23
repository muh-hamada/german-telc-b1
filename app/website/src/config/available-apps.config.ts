/**
 * Available Apps Configuration
 * Define which languages and levels are available for each exam type
 */

import { AppLanguage, AppLevel, ExamType } from './apps.config';

export interface LanguageOption {
  id: AppLanguage;
  flag: string;
  label: string;
  availableLevels: {
    level: AppLevel;
    label: string;
    isAvailable: boolean;
  }[];
}

export interface ExamTypeAvailableApps {
  examType: ExamType;
  languages: LanguageOption[];
}

export const availableAppsConfig: ExamTypeAvailableApps[] = [
  {
    examType: 'telc',
    languages: [
      {
        id: 'german',
        flag: '🇩🇪',
        label: 'German',
        availableLevels: [
          { level: 'A1', label: 'Beginner', isAvailable: true },
          { level: 'B1', label: 'Intermediate', isAvailable: true },
          { level: 'B2', label: 'Upper Intermediate', isAvailable: true },
        ],
      },
      {
        id: 'english',
        flag: '🇬🇧',
        label: 'English',
        availableLevels: [
          { level: 'B1', label: 'Intermediate', isAvailable: true },
          { level: 'B2', label: 'Upper Intermediate', isAvailable: true },
        ],
      },
    ],
  },
  {
    examType: 'dele',
    languages: [
      {
        id: 'spanish',
        flag: '🇪🇸',
        label: 'Spanish',
        availableLevels: [
          { level: 'B1', label: 'Intermediate', isAvailable: true },
        ],
      },
    ],
  },
];

/**
 * Get available apps configuration for a specific exam type
 */
export const getAvailableAppsForExamType = (examType: ExamType): LanguageOption[] => {
  const config = availableAppsConfig.find(c => c.examType === examType);
  return config?.languages || [];
};
