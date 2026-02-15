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

// ==========================================
// GERMAN A2 READING EXAM TYPES
// ==========================================

// Reading Part 1 A2 (Store Directory Lookup - 3-option MCQ)
export interface ReadingPart1A2Option {
  id: number;
  text?: string;
  option?: string;
  is_correct: boolean;
}

export interface ReadingPart1A2Question {
  id: number;
  question: string;
  options: ReadingPart1A2Option[];
  explanation?: Record<string, string>;
}

export interface ReadingPart1A2Exam {
  id: string;
  title: string;
  information: Record<string, string>;
  questions: ReadingPart1A2Question[];
}

// Reading Part 2 A2 (True/False with Article Text)
export interface ReadingPart2A2Question {
  id: number;
  statement: string;
  is_correct: boolean;
  explanation?: Record<string, string>;
}

export interface ReadingPart2A2Exam {
  id: string;
  title: string;
  text: string;
  questions: ReadingPart2A2Question[];
}

// Reading Part 3 A2 (Advertisement Matching)
export interface ReadingPart3A2Question {
  id: number;
  question: string;
  answer: string;
  explanation?: Record<string, string>;
}

export interface ReadingPart3A2Exam {
  id: string;
  title: string;
  advertisements: Record<string, string>;
  questions: ReadingPart3A2Question[];
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
  assessment?: any; // For storing WritingAssessment data
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
  examId: string;
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
  type: 'grammar-part1' | 'grammar-part2' | 'reading-part1' | 'reading-part2' | 'reading-part3' | 'writing' | 'writing-part1' | 'writing-part2' | 'speaking-part1' | 'speaking-part2' | 'speaking-part3' | 'listening-practice' | 'listening-part1' | 'listening-part2' | 'listening-part3' | 'listening-part4' | 'listening-part5';
  available: boolean;
  examCount: number;
}

// Results Types
export interface ExamResult {
  examId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: UserAnswer[];
  timestamp: number;
}

// ==========================================
// DELE SPANISH EXAM TYPES
// ==========================================

// DELE Reading Part 1 (Matching Programs to Personas)
export interface DeleReadingPart1Question {
  id: number;
  persona: string;
  statement: string;
  answer: string;
  explanation?: Record<string, string>;
}

export interface DeleReadingPart1Exam {
  id: string;
  title: string;
  programs: Record<string, string>; // a-j
  questions: DeleReadingPart1Question[];
}

// DELE Reading Part 2 (Text Comprehension with MCQ)
export interface DeleReadingPart2Option {
  id: number;
  text?: string;
  option?: string;
  is_correct: boolean;
}

export interface DeleReadingPart2Question {
  id: number;
  question: string;
  options: DeleReadingPart2Option[];
  explanation?: Record<string, string>;
}

export interface DeleReadingPart2Exam {
  id: string;
  title: string;
  text: string;
  questions: DeleReadingPart2Question[];
}

// DELE Reading Part 3 (Multiple Texts Matching)
export interface DeleReadingPart3Text {
  person: string;
  text: string;
}

export interface DeleReadingPart3Question {
  id: number;
  question: string;
  answer: string;
  explanation?: Record<string, string>;
}

export interface DeleReadingPart3Exam {
  id: string;
  title: string;
  texts: Record<string, DeleReadingPart3Text>; // a, b, c
  questions: DeleReadingPart3Question[];
}

// DELE Grammar Part 1 (Text with Fragments to Insert)
export interface DeleGrammarPart1Exam {
  id: string;
  title: string;
  text: string;
  fragments: Record<string, string>; // a-h
  answers: Record<string, string>; // 19-24 -> a-h
  explanation?: Record<string, Record<string, string>>; // answer number -> explanation object
}

// DELE Grammar Part 2 (Grammar Exercises)
export interface DeleGrammarPart2Question {
  id: number;
  question: string;
  options: Array<{
    id: number;
    text: string;
    correct: boolean;
  }>;
  explanation?: Record<string, string>;
}

export interface DeleGrammarPart2Exam {
  id: string;
  title: string;
  text?: string;
  questions: DeleGrammarPart2Question[];
}

// DELE Listening Parts (Audio-based Questions)
export interface DeleListeningOption {
  text?: string;
  option?: string;
  is_correct: boolean;
}

export interface DeleListeningQuestion {
  id: number;
  question: string;
  audio_transcription?: string;
  options: DeleListeningOption[];
  explanation?: Record<string, string>;
}

export interface DeleListeningSectionDetails {
  title: string;
  instructions_es?: string;
  instructions_en?: string;
  instructions_de?: string;
  instructions_fr?: string;
  instructions_ar?: string;
  instructions_ru?: string;
  duration_minutes?: number;
  prep_time_seconds?: number;
}

export interface DeleListeningExam {
  title: string;
  id: string;
  audio_url?: string; // Optional: if provided, use this; otherwise construct from part and id
  questions: DeleListeningQuestion[];
}

export interface DeleListeningPart {
  section_details: DeleListeningSectionDetails;
  exams: DeleListeningExam[];
}

// DELE Writing Parts
export interface DeleWritingExam {
  title: string;
  id: string;
  modalAnswer: string;
  writingPoints: string[];
  incomingEmail: string;
}

export interface DeleWritingPart {
  exams: DeleWritingExam[];
}

// DELE Speaking Parts - Each part has different schema

// Part 1: Monólogo (2-3 min presentation + discussion)
export interface DeleSpeakingPart1Topic {
  title: string;
  examplePresentation: string;
  exampleDiscussion: Array<{
    question: string;
    answer: string;
  }>;
}

export interface DeleSpeakingPart1Content {
  topics: DeleSpeakingPart1Topic[];
}

// Part 2: Conversación (Follow-up conversation)
export interface DeleSpeakingPart2Question {
  title: string;
  content: string;
  exampleQuestions: string[];
  exampleDialogue: Array<{
    speaker: string;
    text: string;
  }>;
}

export interface DeleSpeakingPart2Content {
  questions: DeleSpeakingPart2Question[];
}

// Part 3: Descripción de fotografía (Photo description)
export interface DeleSpeakingPart3Question {
  title: string;
  question: string;
  image_url: string;
  exampleDescription: string;
  exampleDiscussion: Array<{
    speaker: string;
    text: string;
  }>;
}

export interface DeleSpeakingPart3Content {
  questions: DeleSpeakingPart3Question[];
}

// Part 4: Diálogo en situación simulada (Role-play)
export interface DeleSpeakingPart4Question {
  title: string;
  situation: string;
  roleInstructions: string;
  exampleDialogue: Array<{
    speaker: string;
    text: string;
  }>;
}

export interface DeleSpeakingPart4Content {
  questions: DeleSpeakingPart4Question[];
}

// Legacy type - kept for backwards compatibility
export interface DeleSpeakingTopic {
  title: string;
  examplePresentation: string;
  exampleDiscussion: Array<{
    question: string;
    answer: string;
  }>;
}

export interface DeleSpeakingPart {
  topics: DeleSpeakingTopic[];
}

