// Type definitions for the video generator frontend

export interface ReadingPart2A1Option {
  id: number;
  text?: string;
  option?: string;
  is_correct: boolean;
}

export interface ReadingPart2A1Question {
  id: number;
  situation: string;
  options: ReadingPart2A1Option[];
}

export interface ReadingPart2A1Exam {
  id: number;
  title: string;
  questions: ReadingPart2A1Question[];
}

export interface ReadingPart3A1Question {
  id: number;
  text: string;
  question: string;
  is_correct: boolean;
}

export interface ReadingPart3A1Exam {
  id: number;
  title: string;
  questions: ReadingPart3A1Question[];
}

export interface AppConfig {
  id: string;
  displayName: string;
  language: string;
  level: string;
  logo?: string;
  vocabularyCollection?: string;
}

export interface QuestionData {
  appId: string;
  examId: number;
  questionId: number;
  question: ReadingPart2A1Question | ReadingPart3A1Question;
  appConfig: AppConfig;
}

// Vocabulary types
export interface VocabularyWord {
  word: string;
  article: string;
  type: string; // 'noun', 'verb', 'adjective', etc.
  translations: {
    en: string;
    [key: string]: string;
  };
  exampleSentences: Array<{
    text: string;
    translations: {
      en: string;
      [key: string]: string;
    };
  }>;
  audioUrls?: {
    word: string;
    exampleSentence: string;
  };
}

export interface VocabularyData {
  appId: string;
  wordId: string;
  word: VocabularyWord;
  appConfig: AppConfig;
}

