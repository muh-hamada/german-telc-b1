// Type definitions for video generator functions

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
  collectionName: string;
  vocabularyCollection?: string;
  ttsLanguageCode?: string;
}

export interface QuestionData {
  appId: string;
  examId: number;
  questionIndex: number; // Changed from questionId to questionIndex
  question: ReadingPart2A1Question | ReadingPart3A1Question;
  exam: ReadingPart2A1Exam | ReadingPart3A1Exam;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
}

export interface ProcessedQuestion {
  processed_at: FirebaseFirestore.Timestamp;
  video_id?: string;
  video_url?: string;
  duration_seconds: number;
  processing_time_ms: number;
  error?: string;
}

export interface ScreenshotSet {
  intro: string[];
  question: string[];
  answer: string[];
  outro: string[];
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
  audioGeneratedAt?: FirebaseFirestore.Timestamp;
}

export interface VocabularyData {
  appId: string;
  wordId: string;
  word: VocabularyWord;
}

export interface ProcessedVocabulary {
  word: string;
  processed_at: FirebaseFirestore.Timestamp;
  video_id?: string;
  video_url?: string;
  audio_urls: {
    word: string;
    example: string;
  };
  duration_seconds: number;
  processing_time_ms: number;
  error?: string;
}

