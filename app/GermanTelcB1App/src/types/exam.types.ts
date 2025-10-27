// Base types for exam content
export interface Answer {
  text: string;
  correct: boolean;
}

export interface Question {
  id: number;
  question?: string; // Question text for Reading Part 2
  answers: Answer[];
}

export interface Word {
  key: string;
  word: string;
}

export interface Text {
  id: number;
  text: string;
  correct?: string; // For reading comprehension
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
}

// Reading Part 1 (Matching Headings)
export interface ReadingPart1Exam {
  id: number;
  headings: string[];
  texts: Text[];
}

// Reading Part 2 (Multiple Choice)
export interface ReadingPart2Exam {
  id: number;
  title: string;
  text: string;
  questions: Question[];
}

// Reading Part 3 (Advertisement Matching)
export interface ReadingPart3Situation {
  id: number;
  text: string;
  answer: string;
}

export interface ReadingPart3Exam {
  id: number;
  title: string;
  advertisements: Record<string, string>; // a-l, x
  situations: ReadingPart3Situation[];
}

// Writing Section
export interface WritingExam {
  id: number;
  title: string;
  incomingEmail: string;
  writingPoints: string[];
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
}

// Speaking Part 2 (Topic Presentation)
export interface SpeakingPart2Content {
  id: number;
  title: string;
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

// User Progress Types
export interface UserAnswer {
  questionId: number;
  answer: string;
  isCorrect?: boolean;
  timestamp: number;
}

export type ExamType = 'grammar-part1' | 'grammar-part2' | 'reading-part1' | 'reading-part2' | 'reading-part3' | 'writing' | 'speaking-part1' | 'speaking-part2' | 'speaking-part3';

export interface ExamProgress {
  examId: number;
  examType: ExamType;
  answers: UserAnswer[];
  completed: boolean;
  score?: number;
  maxScore?: number;
  lastAttempt: number;
}

export interface UserProgress {
  userId?: string;
  exams: ExamProgress[];
  totalScore: number;
  totalMaxScore: number;
  lastUpdated: number;
}

// Exam Section Types
export interface ExamSection {
  id: string;
  title: string;
  description: string;
  type: 'grammar-part1' | 'grammar-part2' | 'reading-part1' | 'reading-part2' | 'reading-part3' | 'writing' | 'speaking-part1' | 'speaking-part2' | 'speaking-part3';
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
  answers: Array<{
    questionId: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  timestamp: number;
}
