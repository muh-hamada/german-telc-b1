import { APP_CONFIGS } from '../config/apps.config';

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

// German B2
import germanB2ExamInfo from './german-b2/exam-info.json';
import germanB2ReadingPart1 from './german-b2/reading-part1.json';
import germanB2ReadingPart2 from './german-b2/reading-part2.json';
import germanB2ReadingPart3 from './german-b2/reading-part3.json';
import germanB2GrammarPart1 from './german-b2/grammar-part1.json';
import germanB2GrammarPart2 from './german-b2/grammar-part2.json';
import germanB2SpeakingImportantPhrases from './german-b2/speaking-important-phrases.json';
import germanB2GrammarStudyQuestions from './german-b2/grammer-study-questions.json';



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
}

interface AppDataMap {
  [key: string]: AppData;
}

export const appDataMap: AppDataMap = {
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
    },
    [APP_CONFIGS['german-b2'].id]: {
        'exam-info': germanB2ExamInfo,
        'grammar-study-questions': germanB2GrammarStudyQuestions,
        'reading-part1': germanB2ReadingPart1,
        'reading-part2': germanB2ReadingPart2,
        'reading-part3': germanB2ReadingPart3,
        'grammar-part1': germanB2GrammarPart1,
        'grammar-part2': germanB2GrammarPart2,
        'speaking-important-phrases': germanB2SpeakingImportantPhrases,
    },
}