// Base types for exam content
export interface Answer {
  text: string;
  correct: boolean;
}

export interface Question {
  id: number;
  question?: string; // Question text for Reading Part 2
  answers: Answer[];
  explanation?: Record<string, string>;
}

export interface Word {
  key: string;
  word: string;
}

export interface Text {
  id: number;
  text: string;
  correct?: string; // For reading comprehension
  explanation?: Record<string, string>;
}

// Grammar Part 1 (Multiple Choice Gap Fill)
export interface GrammarPart1Exam {
  id: number;
  title: string;
  text: string;
  questions: Question[];
}

// Grammar Part 2 (Word List Gap Fill)
export interface GrammarPart2Exam {
  id: number;
  title: string;
  words: Word[];
  text: string;
  answers: Record<string, string>; // gap ID -> word key
  explanation?: Record<string, Record<string, string>>; // gap ID -> explanation object
}

// Reading Part 1 (Matching Headings) - B1/B2
export interface ReadingPart1Exam {
  id: number;
  headings: string[];
  texts: Text[];
}

// Reading Part 1 A1 (True/False Questions)
export interface ReadingPart1A1Question {
  id: number;
  question: string;
  is_correct: boolean;
  explanation?: Record<string, string>;
}

export interface ReadingPart1A1Exam {
  id: number;
  title: string;
  text: string;
  questions: ReadingPart1A1Question[];
}

// Reading Part 2 (Multiple Choice) - B1/B2
export interface ReadingPart2Exam {
  id: number;
  title: string;
  text: string;
  questions: Question[];
}

// Reading Part 2 A1 (Matching Situations to Options)
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
  explanation?: Record<string, string>;
}

export interface ReadingPart2A1Exam {
  id: number;
  title: string;
  questions: ReadingPart2A1Question[];
}

// Reading Part 3 (Advertisement Matching) - B1/B2
export interface ReadingPart3Situation {
  id: number;
  text: string;
  answer: string;
  explanation?: Record<string, string>;
}

export interface ReadingPart3Exam {
  id: number;
  title: string;
  advertisements: Record<string, string>; // a-l, x
  situations: ReadingPart3Situation[];
}

// Reading Part 3 A1 (True/False Questions with Context)
export interface ReadingPart3A1Question {
  id: number;
  text: string;
  question: string;
  is_correct: boolean;
  explanation?: Record<string, string>;
}

export interface ReadingPart3A1Exam {
  id: number;
  title: string;
  questions: ReadingPart3A1Question[];
}

// Writing Section
export interface WritingExam {
  id: number;
  title: string;
  incomingEmail: string;
  writingPoints: string[];
  modalAnswer?: string;
  themeNumber?: number;
  themeName?: string;
  uiStrings?: {
    instructionTitle?: string;
    instructionDescription?: string;
    taskDescription?: string;
    taskFooter?: string;
  };
}

// Speaking Part 1 (Personal Introduction)
export interface SpeakingPart1Content {
  id: number;
  title: string;
  personalInfo: {
    name: string;
    age: number;
    origin: string;
    livingSince: string;
    family: string;
  };
  familyInfo: {
    location: string;
    children: Array<{
      name: string;
      age: number;
      activity: string;
    }>;
  };
  professionalInfo: {
    job: string;
    company: string;
    hobbies: string[];
  };
  vocabulary: Array<{
    german: string;
    english: string;
  }>;
  questions: Array<{
    formal: string;
    informal: string;
    answer: string;
  }>;
  personalInfoPlaceholderText: {
    name: string;
    age: string;
    birthCity: string;
    origin: string;
    livingSince: string;
    maritalStatus: string;
    familySize: string;
    location: string;
    child1Age: string;
    child1Grade: string;
    child2Age: string;
    profession: string;
    company: string;
    hobbies: string;
  },
  personalInfoStrings: {
    name: string;
    age: string;
    birthCity: string;
    origin: string;
    livingSince: string;
    maritalStatus: string;
    familySize: string;
    location: string;
    child1Age: string;
    child1Grade: string;
    child2Age: string;
    profession: string;
    company: string;
    hobbies: string;
  },
}

// Speaking Part 2 (Topic Presentation)
export interface SpeakingPart2Content {
  id: number;
  title: string;
  questions: Array<any>;
  topics: Array<{
    id: string;
    title: string;
    description: string;
    keyPoints: string[];
    vocabulary: Array<{
      german: string;
      english: string;
    }>;
  }>;
}

// Speaking Part 3 (Planning Together)
export interface SpeakingPart3Content {
  id: number;
  title: string;
  questions: Array<any>;
  scenarios: Array<{
    id: string;
    title: string;
    description: string;
    options: string[];
    vocabulary: Array<{
      german: string;
      english: string;
    }>;
  }>;
}

// Speaking Important Phrases (Part 4)
export interface SpeakingImportantPhrasesGroup {
  id: number;
  name: string; // not localized
  phrases: string[]; // simple list of sentences
}

export interface SpeakingImportantPhrasesContent {
  title?: string;
  note?: string;
  groups: SpeakingImportantPhrasesGroup[];
}

// Listening Practice
export interface ListeningPracticeQuestion {
  question: string;
  correct: boolean;
  explanation: string;
}

export interface ListeningPracticeInterview {
  id: number;
  title: string;
  audio_url: string;
  image_url: string;
  questions: ListeningPracticeQuestion[];
  duration: string;
  transcription_url?: string;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  probability: number;
  line_number: number;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: TranscriptionWord[];
}

export interface Transcription {
  createdAt: string;
  segments: TranscriptionSegment[];
}

// User Progress Types
export interface UserAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
  timestamp: number;
  correctAnswer?: string;
  explanation?: Record<string, string>;
  transcript?: string;
}

export type ExamType = 'grammar-part1' | 'grammar-part2' | 'reading-part1' | 'reading-part2' | 'reading-part3' | 'writing' | 'writing-part1' | 'writing-part2' | 'speaking-part1' | 'speaking-part2' | 'speaking-part3' | 'listening-practice' | 'listening-part1' | 'listening-part2' | 'listening-part3';

// Historical record for individual exam attempts
export interface HistoricalResult {
  timestamp: number;
  score: number;
  maxScore: number;
}

// Historical record for aggregated progress
export interface HistoricalTotalScore {
  timestamp: number;
  totalScore: number;
  totalMaxScore: number;
}

export interface ExamProgress {
  examId: number;
  examType: ExamType;
  answers: UserAnswer[];
  completed: boolean;
  score?: number;
  maxScore?: number;
  lastAttempt: number;
  historicalResults?: HistoricalResult[];
}

export interface UserProgress {
  userId?: string;
  exams: ExamProgress[];
  totalScore: number;
  totalMaxScore: number;
  lastUpdated: number;
  historicalTotalScores?: HistoricalTotalScore[];
}

// Exam Section Types
export interface ExamSection {
  id: string;
  title: string;
  description: string;
  type: 'grammar-part1' | 'grammar-part2' | 'reading-part1' | 'reading-part2' | 'reading-part3' | 'writing' | 'writing-part1' | 'writing-part2' | 'speaking-part1' | 'speaking-part2' | 'speaking-part3' | 'listening-practice' | 'listening-part1' | 'listening-part2' | 'listening-part3';
  available: boolean;
  examCount: number;
}

// Results Types
export interface ExamResult {
  examId: number;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: UserAnswer[];
  timestamp: number;
}
