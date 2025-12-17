import { APP_CONFIGS } from '../config/apps.config';

// German A1
import germanA1ExamInfo from './german-a1/exam-info.json';
import germanA1ReadingPart1 from './german-a1/reading-part1.json';
import germanA1ReadingPart2 from './german-a1/reading-part2.json';
import germanA1ReadingPart3 from './german-a1/reading-part3.json';
import germanA1SpeakingPart1 from './german-a1/speaking-part1.json';
import germanA1SpeakingPart2 from './german-a1/speaking-part2.json';
import germanA1SpeakingPart3 from './german-a1/speaking-part3.json';
import germanA1WritingPart1 from './german-a1/writing-part1.json';
import germanA1WritingPart2 from './german-a1/writing-part2.json';


// German B1
import germanB1ExamInfo from './german-b1/exam-info.json';
import germanB1GrammarPart1 from './german-b1/grammar-part1.json';
import germanB1GrammarPart2 from './german-b1/grammar-part2.json';
import germanB1ListeningPart1 from './german-b1/listening-part1.json';
import germanB1ListeningPart2 from './german-b1/listening-part2.json';
import germanB1ListeningPart3 from './german-b1/listening-part3.json';
import germanB1ReadingPart1 from './german-b1/reading-part1.json';
import germanB1ReadingPart2 from './german-b1/reading-part2.json';
import germanB1ReadingPart3 from './german-b1/reading-part3.json';
import germanB1SpeakingPart1 from './german-b1/speaking-part1.json';
import germanB1SpeakingPart2 from './german-b1/speaking-part2.json';
import germanB1SpeakingPart3 from './german-b1/speaking-part3.json';
import germanB1Writing from './german-b1/writing.json';
import germanB1SpeakingImportantPhrases from './german-b1/speaking-important-phrases.json';
import germanB1GrammarStudyQuestions from './german-b1/grammer-study-questions.json';
import germanB1ListeningPractice from './german-b1/listening-practice.json';

// German B2
import germanB2ExamInfo from './german-b2/exam-info.json';
import germanB2ReadingPart1 from './german-b2/reading-part1.json';
import germanB2ReadingPart2 from './german-b2/reading-part2.json';
import germanB2ReadingPart3 from './german-b2/reading-part3.json';
import germanB2GrammarPart1 from './german-b2/grammar-part1.json';
import germanB2GrammarPart2 from './german-b2/grammar-part2.json';
import germanB2ListeningPart1 from './german-b2/listening-part1.json';
import germanB2ListeningPart2 from './german-b2/listening-part2.json';
import germanB2ListeningPart3 from './german-b2/listening-part3.json';
import germanB2Writing from './german-b2/writing.json';
import germanB2SpeakingImportantPhrases from './german-b2/speaking-important-phrases.json';
import germanB2OralExamStructure from './german-b2/oral-exam-structure.json';
import germanB2SpeakingPart1 from './german-b2/speaking-part1.json';
import germanB2SpeakingPart2 from './german-b2/speaking-part2.json';
import germanB2SpeakingPart3 from './german-b2/speaking-part3.json';
import germanB2GrammarStudyQuestions from './german-b2/grammer-study-questions.json';
import germanB2ListeningPractice from './german-b2/listening-practice.json';

// English B1
import englishB1ExamInfo from './english-b1/exam-info.json';
import englishB1GrammarPart1 from './english-b1/grammar-part1.json';
import englishB1GrammarPart2 from './english-b1/grammar-part2.json';
import englishB1ListeningPart1 from './english-b1/listening-part1.json';
import englishB1ListeningPart2 from './english-b1/listening-part2.json';
import englishB1ListeningPart3 from './english-b1/listening-part3.json';
import englishB1ReadingPart1 from './english-b1/reading-part1.json';
import englishB1ReadingPart2 from './english-b1/reading-part2.json';
import englishB1ReadingPart3 from './english-b1/reading-part3.json';
import englishB1SpeakingPart1 from './english-b1/speaking-part1.json';
import englishB1SpeakingPart2 from './english-b1/speaking-part2.json';
import englishB1SpeakingPart3 from './english-b1/speaking-part3.json';
import englishB1Writing from './english-b1/writing.json';
import englishB1SpeakingImportantPhrases from './english-b1/speaking-important-phrases.json';
import englishB1GrammarStudyQuestions from './english-b1/grammer-study-questions.json';
import englishB1ListeningPractice from './english-b1/listening-practice.json';


// English B2
import englishB2ExamInfo from './english-b2/exam-info.json';
import englishB2GrammarStudyQuestions from './english-b2/grammer-study-questions.json';
import englishB2ReadingPart1 from './english-b2/reading-part1.json';
import englishB2ReadingPart2 from './english-b2/reading-part2.json';
import englishB2ReadingPart3 from './english-b2/reading-part3.json';
import englishB2GrammarPart1 from './english-b2/grammar-part1.json';
import englishB2GrammarPart2 from './english-b2/grammar-part2.json';
import englishB2Writing from './english-b2/writing.json';
import englishB2ListeningPart1 from './english-b2/listening-part1.json';
import englishB2ListeningPart2 from './english-b2/listening-part2.json';
import englishB2ListeningPart3 from './english-b2/listening-part3.json';
import englishB2OralExamStructure from './english-b2/oral-exam-structure.json';
import englishB2SpeakingPart1 from './english-b2/speaking-part1.json';
import englishB2SpeakingPart2 from './english-b2/speaking-part2.json';
import englishB2SpeakingPart3 from './english-b2/speaking-part3.json';
import englishB2SpeakingImportantPhrases from './english-b2/speaking-important-phrases.json';
import englishB2ListeningPractice from './english-b2/listening-practice.json';

interface AppData {
    'exam-info'?: any;
    'grammar-part1'?: any;
    'grammar-part2'?: any;
    'listening-part1'?: any;
    'listening-part2'?: any;
    'listening-part3'?: any;
    'reading-part1'?: any;
    'reading-part2'?: any;
    'reading-part3'?: any;
    'speaking-part1'?: any;
    'speaking-part2'?: any;
    'speaking-part3'?: any;
    'writing'?: any;
    'speaking-important-phrases'?: any;
    'grammar-study-questions'?: any;
    'oral-exam-structure'?: any;
    'listening-practice'?: any;
    'writing-part1'?: any;
    'writing-part2'?: any;
}

interface AppDataMap {
  [key: string]: AppData;
}

export const appDataMap: AppDataMap = {
    [APP_CONFIGS['german-a1'].id]: {
        'exam-info': germanA1ExamInfo,
        'reading-part1': germanA1ReadingPart1,
        'reading-part2': germanA1ReadingPart2,
        'reading-part3': germanA1ReadingPart3,
        'speaking-part1': germanA1SpeakingPart1,
        'speaking-part2': germanA1SpeakingPart2,
        'speaking-part3': germanA1SpeakingPart3,
        'writing-part1': germanA1WritingPart1,
        'writing-part2': germanA1WritingPart2,
    },
    [APP_CONFIGS['german-b1'].id]: {
        'exam-info': germanB1ExamInfo,
        'grammar-part1': germanB1GrammarPart1,
        'grammar-part2': germanB1GrammarPart2,
        'listening-part1': germanB1ListeningPart1,
        'listening-part2': germanB1ListeningPart2,
        'listening-part3': germanB1ListeningPart3,
        'reading-part1': germanB1ReadingPart1,
        'reading-part2': germanB1ReadingPart2,
        'reading-part3': germanB1ReadingPart3,
        'speaking-part1': germanB1SpeakingPart1,
        'speaking-part2': germanB1SpeakingPart2,
        'speaking-part3': germanB1SpeakingPart3,
        'writing': germanB1Writing,
        'grammar-study-questions': germanB1GrammarStudyQuestions,
        'speaking-important-phrases': germanB1SpeakingImportantPhrases,
        'listening-practice': germanB1ListeningPractice,
    },
    [APP_CONFIGS['german-b2'].id]: {
        'exam-info': germanB2ExamInfo,
        'grammar-study-questions': germanB2GrammarStudyQuestions,
        'reading-part1': germanB2ReadingPart1,
        'reading-part2': germanB2ReadingPart2,
        'reading-part3': germanB2ReadingPart3,
        'grammar-part1': germanB2GrammarPart1,
        'grammar-part2': germanB2GrammarPart2,
        'listening-part1': germanB2ListeningPart1,
        'listening-part2': germanB2ListeningPart2,
        'listening-part3': germanB2ListeningPart3,
        'speaking-important-phrases': germanB2SpeakingImportantPhrases,
        'writing': germanB2Writing,
        'oral-exam-structure': germanB2OralExamStructure,
        'speaking-part1': germanB2SpeakingPart1,
        'speaking-part2': germanB2SpeakingPart2,
        'speaking-part3': germanB2SpeakingPart3,
        'listening-practice': germanB2ListeningPractice,
    },
    [APP_CONFIGS['english-b1'].id]: {
        'exam-info': englishB1ExamInfo,
        'grammar-part1': englishB1GrammarPart1,
        'grammar-part2': englishB1GrammarPart2,
        'listening-part1': englishB1ListeningPart1,
        'listening-part2': englishB1ListeningPart2,
        'listening-part3': englishB1ListeningPart3,
        'reading-part1': englishB1ReadingPart1,
        'reading-part2': englishB1ReadingPart2,
        'reading-part3': englishB1ReadingPart3,
        'speaking-part1': englishB1SpeakingPart1,
        'speaking-part2': englishB1SpeakingPart2,
        'speaking-part3': englishB1SpeakingPart3,
        'writing': englishB1Writing,
        'speaking-important-phrases': englishB1SpeakingImportantPhrases,
        'listening-practice': englishB1ListeningPractice,
        'grammar-study-questions': englishB1GrammarStudyQuestions,
    },
    [APP_CONFIGS['english-b2'].id]: {
        'exam-info': englishB2ExamInfo,
        'grammar-study-questions': englishB2GrammarStudyQuestions,
        'reading-part1': englishB2ReadingPart1,
        'reading-part2': englishB2ReadingPart2,
        'reading-part3': englishB2ReadingPart3,
        'grammar-part1': englishB2GrammarPart1,
        'grammar-part2': englishB2GrammarPart2,
        'writing': englishB2Writing,
        'listening-part1': englishB2ListeningPart1,
        'listening-part2': englishB2ListeningPart2,
        'listening-part3': englishB2ListeningPart3,
        'oral-exam-structure': englishB2OralExamStructure,
        'speaking-part1': englishB2SpeakingPart1,
        'speaking-part2': englishB2SpeakingPart2,
        'speaking-part3': englishB2SpeakingPart3,
        'speaking-important-phrases': englishB2SpeakingImportantPhrases,
        'listening-practice': englishB2ListeningPractice,
    },
}