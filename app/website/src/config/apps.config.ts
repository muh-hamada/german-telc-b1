/**
 * App Configuration for Website
 * Contains store links and metadata for all available apps
 */

export type AppLanguage = 'german' | 'english' | 'spanish';
export type AppLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type ExamType = 'telc' | 'dele';

export interface AppConfig {
  id: string;
  language: AppLanguage;
  level: AppLevel;
  examType: ExamType;
  displayName: string;
  flag: string;
  isAvailable: boolean;
  storeLinks: {
    android: string;
    ios: string;
  };
  packageName: string;
  iosAppId: string;
}

export const appsConfig: AppConfig[] = [
  {
    id: 'german-a1',
    language: 'german',
    level: 'A1',
    examType: 'telc',
    displayName: 'German TELC A1',
    flag: '🇩🇪',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telca1german',
      ios: 'https://apps.apple.com/app/id6756783649',
    },
    packageName: 'com.mhamada.telca1german',
    iosAppId: '6756783649',
  },
  {
    id: 'german-a2',
    language: 'german',
    level: 'A2',
    examType: 'telc',
    displayName: 'German TELC A2',
    flag: '🇩🇪',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telca2german',
      ios: 'https://apps.apple.com/app/id6756783649',
    },
    packageName: 'com.mhamada.telca2german',
    iosAppId: '',
  },
  {
    id: 'german-b1',
    language: 'german',
    level: 'B1',
    examType: 'telc',
    displayName: 'German TELC B1',
    flag: '🇩🇪',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telcb1german',
      ios: 'https://apps.apple.com/app/id6754566955',
    },
    packageName: 'com.mhamada.telcb1german',
    iosAppId: '6754566955',
  },
  {
    id: 'german-b2',
    language: 'german',
    level: 'B2',
    examType: 'telc',
    displayName: 'German TELC B2',
    flag: '🇩🇪',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telcb2german',
      ios: 'https://apps.apple.com/app/id6755521000',
    },
    packageName: 'com.mhamada.telcb2german',
    iosAppId: '6755521000',
  },
  {
    id: 'english-b1',
    language: 'english',
    level: 'B1',
    examType: 'telc',
    displayName: 'English TELC B1',
    flag: '🇬🇧',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telcb1english',
      ios: 'https://apps.apple.com/app/id6755912773',
    },
    packageName: 'com.mhamada.telcb1english',
    iosAppId: '6755912773',
  },
  {
    id: 'english-b2',
    language: 'english',
    level: 'B2',
    examType: 'telc',
    displayName: 'English TELC B2',
    flag: '🇬🇧',
    isAvailable: true,
    storeLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.mhamada.telcb2english',
      ios: 'https://apps.apple.com/app/id6756295159',
    },
    packageName: 'com.mhamada.telcb2english',
    iosAppId: '6756295159',
  },
];

export const getAppConfig = (language: AppLanguage, level: AppLevel): AppConfig | undefined => {
  return appsConfig.find(app => app.language === language && app.level === level);
};

export const getAppById = (id: string): AppConfig | undefined => {
  return appsConfig.find(app => app.id === id);
};

