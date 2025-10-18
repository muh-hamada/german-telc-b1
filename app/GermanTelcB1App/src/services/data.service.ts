import {
  GrammarPart1Exam,
  GrammarPart2Exam,
  ReadingPart1Exam,
  ReadingPart2Exam,
  ReadingPart3Exam,
  WritingExam,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
} from '../types/exam.types';

// Import JSON data
import grammarPart1Data from '../data/grammar-part1.json';
import grammarPart2Data from '../data/grammar-part2.json';
import readingPart1Data from '../data/reading-part1.json';
import readingPart2Data from '../data/reading-part2.json';
import readingPart3Data from '../data/reading-part3.json';
import writingData from '../data/writing.json';
import speakingPart1Data from '../data/speaking-part1.json';
import speakingPart2Data from '../data/speaking-part2.json';
import speakingPart3Data from '../data/speaking-part3.json';

class DataService {
  // Grammar Part 1
  getGrammarPart1Exams(): GrammarPart1Exam[] {
    return grammarPart1Data.exams;
  }

  getGrammarPart1Exam(id: number): GrammarPart1Exam | undefined {
    return this.getGrammarPart1Exams().find(exam => exam.id === id);
  }

  // Grammar Part 2
  getGrammarPart2Exams(): GrammarPart2Exam[] {
    return grammarPart2Data.exams;
  }

  getGrammarPart2Exam(id: number): GrammarPart2Exam | undefined {
    return this.getGrammarPart2Exams().find(exam => exam.id === id);
  }

  // Reading Part 1
  getReadingPart1Exams(): ReadingPart1Exam[] {
    return readingPart1Data as ReadingPart1Exam[];
  }

  getReadingPart1ExamById(id: number): ReadingPart1Exam | undefined {
    return this.getReadingPart1Exams().find(exam => exam.id === id);
  }

  // Reading Part 2
  getReadingPart2Exams(): ReadingPart2Exam[] {
    return readingPart2Data.exams;
  }

  getReadingPart2Exam(id: number): ReadingPart2Exam | undefined {
    return this.getReadingPart2Exams().find(exam => exam.id === id);
  }

  // Reading Part 3
  getReadingPart3Exams(): ReadingPart3Exam[] {
    return readingPart3Data.exams;
  }

  getReadingPart3Exam(id: number): ReadingPart3Exam | undefined {
    return this.getReadingPart3Exams().find(exam => exam.id === id);
  }

  // Writing
  getWritingExams(): WritingExam[] {
    return writingData.exams;
  }

  getWritingExam(id: number): WritingExam | undefined {
    return this.getWritingExams().find(exam => exam.id === id);
  }

  // Speaking Part 1
  getSpeakingPart1Content(): SpeakingPart1Content {
    return speakingPart1Data.content;
  }

  // Speaking Part 2
  getSpeakingPart2Content(): SpeakingPart2Content {
    return speakingPart2Data.content;
  }

  // Speaking Part 3
  getSpeakingPart3Content(): SpeakingPart3Content {
    return speakingPart3Data.content;
  }

  // Utility methods
  getExamCount(examType: string): number {
    switch (examType) {
      case 'grammar-part1':
        return this.getGrammarPart1Exams().length;
      case 'grammar-part2':
        return this.getGrammarPart2Exams().length;
      case 'reading-part1':
        return this.getReadingPart1Exams().length;
      case 'reading-part2':
        return this.getReadingPart2Exams().length;
      case 'reading-part3':
        return this.getReadingPart3Exams().length;
      case 'writing':
        return this.getWritingExams().length;
      case 'speaking-part1':
      case 'speaking-part2':
      case 'speaking-part3':
        return 1; // These are content-based, not exam-based
      default:
        return 0;
    }
  }

  isExamAvailable(examType: string): boolean {
    const count = this.getExamCount(examType);
    return count > 0;
  }

  // Generic method to get all exams of a specific type
  getAllExamsByType(type: string): any[] {
    switch (type) {
      case 'grammar-part1':
        return this.getGrammarPart1Exams();
      case 'grammar-part2':
        return this.getGrammarPart2Exams();
      case 'reading-part1':
        return this.getReadingPart1Exams();
      case 'reading-part2':
        return this.getReadingPart2Exams();
      case 'reading-part3':
        return this.getReadingPart3Exams();
      case 'writing':
        return this.getWritingExams();
      case 'speaking-part1':
        return [this.getSpeakingPart1Content()];
      case 'speaking-part2':
        return [this.getSpeakingPart2Content()];
      case 'speaking-part3':
        return [this.getSpeakingPart3Content()];
      default:
        return [];
    }
  }

  // Get a specific exam by type and ID
  getExamByTypeAndId(type: string, id: number): any | undefined {
    const exams = this.getAllExamsByType(type);
    return exams.find(exam => exam.id === id);
  }
}

const dataService = new DataService();
export { dataService };
