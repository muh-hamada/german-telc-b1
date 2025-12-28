/**
 * Diagnostic Service
 * 
 * Handles generation and evaluation of diagnostic assessments
 * to determine user's current level and create personalized study plans.
 */

import {
  DiagnosticExam,
  DiagnosticAssessment,
  DiagnosticAnswers,
  SectionAssessment,
  SpeakingAssessmentDialogue,
} from '../types/prep-plan.types';
import { activeExamConfig } from '../config/active-exam.config';
import {
  getPrepPlanConfig,
  getEnabledSections,
  calculateSectionLevel,
  calculateOverallLevel,
} from '../config/prep-plan-level.config';
import { dataService } from './data.service';
import { AnalyticsEvents, logEvent } from './analytics.events';
import axios from 'axios';
import { Platform } from 'react-native';
import { ExamLevel } from '../config/exam-config.types';

// API Configuration for Cloud Functions
const IS_DEV = __DEV__;
const testPath = (Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost') + ':5001/telc-b1-german/us-central1';
const GENERATE_DIALOGUE_URL = IS_DEV 
  ? testPath + '/generateSpeakingDialogue'
  : 'https://us-central1-telc-b1-german.cloudfunctions.net/generateSpeakingDialogue';
const BATCH_EVALUATE_URL = IS_DEV
  ? testPath + '/batchEvaluateSpeaking'
  : 'https://us-central1-telc-b1-german.cloudfunctions.net/batchEvaluateSpeaking';

class DiagnosticService {
  /**
   * Generate a diagnostic exam based on current exam level
   */
  async generateDiagnosticExam(): Promise<DiagnosticExam> {
    try {
      const examLevel = activeExamConfig.level;
      const levelConfig = getPrepPlanConfig(examLevel);
      const enabledSections = getEnabledSections(examLevel);

      logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_STARTED, { examLevel });

      const exam: DiagnosticExam = {
        examId: `diagnostic-${Date.now()}`,
        level: examLevel,
        sections: {
          reading: undefined,
          listening: undefined,
          grammar: undefined,
          writing: 0, // Will be set below
        },
        estimatedMinutes: levelConfig.assessmentTimeMinutes,
        createdAt: Date.now(),
      };

      // Generate questions for each enabled section
      for (const section of enabledSections) {
        switch (section.sectionName) {
          case 'reading':
            exam.sections.reading = await this.selectRandomReadingQuestions(
              section.assessmentQuestions
            );
            break;
          case 'listening':
            exam.sections.listening = await this.selectRandomListeningQuestions(
              section.assessmentQuestions
            );
            break;
          case 'grammar':
            exam.sections.grammar = await this.selectRandomGrammarQuestions(
              section.assessmentQuestions
            );
            break;
          case 'writing':
            // Only generate one writing task (even if A1 has 2 parts, they share the same task)
            if (!exam.sections.writing) {
              exam.sections.writing = await this.selectRandomWritingTask();
            }
            break;
          case 'speaking':
            exam.sections.speaking = await this.generateSpeakingDialogue(examLevel);
            break;
        }
      }

      return exam;
    } catch (error) {
      console.error('[DiagnosticService] Error generating diagnostic exam:', error);
      throw error;
    }
  }

  /**
   * Evaluate diagnostic exam and generate assessment
   */
  async evaluateDiagnostic(
    exam: DiagnosticExam,
    answers: DiagnosticAnswers
  ): Promise<DiagnosticAssessment> {
    try {
      const levelConfig = getPrepPlanConfig(exam.level);
      const enabledSections = getEnabledSections(exam.level);

      const sections: DiagnosticAssessment['sections'] = {
        writing: {} as SectionAssessment, // Will be set below
        speaking: {} as SectionAssessment, // Will be set below
      };

      let totalScore = 0;
      let totalMaxScore = 0;

      // Evaluate each section
      for (const section of enabledSections) {
        let sectionAssessment: SectionAssessment;

        switch (section.sectionName) {
          case 'reading':
            if (exam.sections.reading && answers.answers.reading) {
              sectionAssessment = await this.evaluateReadingSection(
                exam.sections.reading,
                answers.answers.reading,
                section
              );
              sections.reading = sectionAssessment;
            }
            break;
          case 'listening':
            if (exam.sections.listening && answers.answers.listening) {
              sectionAssessment = await this.evaluateListeningSection(
                exam.sections.listening,
                answers.answers.listening,
                section
              );
              sections.listening = sectionAssessment;
            }
            break;
          case 'grammar':
            if (exam.sections.grammar && answers.answers.grammar) {
              sectionAssessment = await this.evaluateGrammarSection(
                exam.sections.grammar,
                answers.answers.grammar,
                section
              );
              sections.grammar = sectionAssessment;
            }
            break;
          case 'writing':
            // For writing, evaluate once and use for all writing sections (A1 has 2 parts)
            if (!sections.writing || !sections.writing.score) {
              sectionAssessment = await this.evaluateWritingSection(
                answers.answers.writing,
                section
              );
              sections.writing = sectionAssessment;
            } else {
              // For subsequent writing sections (A1 Part 2), add to the existing score
              sectionAssessment = await this.evaluateWritingSection(
                answers.answers.writing,
                section
              );
              // Merge the scores
              sections.writing.score += sectionAssessment.score;
              sections.writing.maxScore += sectionAssessment.maxScore;
              sections.writing.percentage = (sections.writing.score / sections.writing.maxScore) * 100;
              sections.writing.level = calculateSectionLevel(sections.writing.percentage, section);
            }
            break;
          case 'speaking':
            sectionAssessment = await this.evaluateSpeakingSection(
              answers.answers.speaking,
              section
            );
            sections.speaking = sectionAssessment;
            break;
        }

        if (sectionAssessment!) {
          totalScore += sectionAssessment.score;
          totalMaxScore += sectionAssessment.maxScore;
        }
      }

      const overallPercentage = (totalScore / totalMaxScore) * 100;
      const overallLevel = calculateOverallLevel(overallPercentage, levelConfig);

      // Identify strengths and weaknesses
      const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(sections);

      const assessment: DiagnosticAssessment = {
        assessmentId: exam.examId,
        completedAt: Date.now(),
        examLevel: exam.level,
        sections,
        overallScore: totalScore,
        overallMaxScore: totalMaxScore,
        overallPercentage,
        overallLevel,
        strengths,
        weaknesses,
      };

      logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_COMPLETED, {
        examLevel: exam.level,
        overallScore: totalScore,
        overallMaxScore: totalMaxScore,
        overallPercentage,
        overallLevel,
      });

      return assessment;
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating diagnostic:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * QUESTION SELECTION METHODS
   * ===================================
   */

  /**
   * Select random reading questions
   */
  private async selectRandomReadingQuestions(count: number): Promise<number[]> {
    try {
      // Get all available reading exams
      const examLevel = activeExamConfig.level;
      const allExams = examLevel === 'A1' 
        ? await dataService.getReadingPart1A1Exams()
        : await dataService.getReadingPart1Exams();
      
      if (!allExams || allExams.length === 0) {
        console.warn('[DiagnosticService] No reading exams found, using fallback');
        return [1]; // Fallback to first exam
      }
      
      // Select random exams (up to count, but usually just 1-2 for diagnostic)
      const selectedIndices = this.getRandomIndices(allExams.length, Math.min(count, allExams.length));
      return selectedIndices.map(i => allExams[i].id);
    } catch (error) {
      console.error('[DiagnosticService] Error selecting reading questions:', error);
      return [1]; // Fallback
    }
  }

  /**
   * Select random listening questions
   */
  private async selectRandomListeningQuestions(count: number): Promise<number[]> {
    try {
      // Get listening part 1 exams (this has the exams array)
      const listeningData = await dataService.getListeningPart1Content();
      
      if (!listeningData?.exams || !Array.isArray(listeningData.exams) || listeningData.exams.length === 0) {
        console.warn('[DiagnosticService] No listening exams found in listening-part1, using fallback');
        return [1];
      }
      
      const selectedIndices = this.getRandomIndices(listeningData.exams.length, Math.min(count, listeningData.exams.length));
      return selectedIndices.map(i => listeningData.exams[i].id);
    } catch (error) {
      console.error('[DiagnosticService] Error selecting listening questions:', error);
      return [1];
    }
  }

  /**
   * Select random grammar questions
   */
  private async selectRandomGrammarQuestions(count: number): Promise<number[]> {
    try {
      const allExams = await dataService.getGrammarPart1Exams();
      
      if (!allExams || allExams.length === 0) {
        console.warn('[DiagnosticService] No grammar exams found, using fallback');
        return [1];
      }
      
      const selectedIndices = this.getRandomIndices(allExams.length, Math.min(count, allExams.length));
      return selectedIndices.map(i => allExams[i].id);
    } catch (error) {
      console.error('[DiagnosticService] Error selecting grammar questions:', error);
      return [1];
    }
  }

  /**
   * Select random writing task
   */
  private async selectRandomWritingTask(): Promise<number> {
    try {
      const allExams = await dataService.getWritingExams();
      
      if (!allExams || allExams.length === 0) {
        console.warn('[DiagnosticService] No writing exams found, using fallback');
        return 1;
      }
      
      const randomIndex = Math.floor(Math.random() * allExams.length);
      return allExams[randomIndex].id;
    } catch (error) {
      console.error('[DiagnosticService] Error selecting writing task:', error);
      return 1;
    }
  }

  /**
   * Generate speaking dialogue for assessment
   */
  private async generateSpeakingDialogue(
    level: ExamLevel
  ): Promise<SpeakingAssessmentDialogue> {
    try {
      const examConfig = activeExamConfig;
      const language = examConfig.language as 'german' | 'english';
      
      console.log('[DiagnosticService] Generating diagnostic speaking dialogue...');
      
      // Call Cloud Function to generate diagnostic dialogue
      const response = await axios.post(GENERATE_DIALOGUE_URL, {
        level,
        partNumber: 1, // Not used for diagnostic, but required by interface
        language,
        isDiagnostic: true, // Flag for unified diagnostic dialogue
      });

      const { dialogueId, dialogue, estimatedMinutes } = response.data as {
        dialogueId: string;
        dialogue: any[];
        estimatedMinutes: number;
      };

      return {
        dialogueId,
        partNumber: 1,
        level,
        turns: dialogue,
        totalTurns: dialogue.length,
        currentTurn: 0,
        isComplete: false,
      };
    } catch (error) {
      console.error('[DiagnosticService] Error generating speaking dialogue:', error);
      throw error;
    }
  }

  /**
   * Get random indices from array
   */
  private getRandomIndices(arrayLength: number, count: number): number[] {
    const indices: number[] = [];
    const available = Array.from({ length: arrayLength }, (_, i) => i);
    
    for (let i = 0; i < count && available.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      indices.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    
    return indices;
  }

  /**
   * ===================================
   * EVALUATION METHODS
   * ===================================
   */

  /**
   * Evaluate reading section
   */
  private async evaluateReadingSection(
    questionIds: number[],
    answers: { [questionId: string]: any },
    section: any
  ): Promise<SectionAssessment> {
    try {
      // Count correct answers
      let correctCount = 0;
      let totalQuestions = 0;
      
      // Fetch exam data to check correctness
      const examLevel = activeExamConfig.level;
      for (const examId of questionIds) {
        let exam: any;
        if (examLevel === 'A1') {
          exam = await dataService.getReadingPart1A1ExamById(examId);
          if (exam && exam.questions) {
            totalQuestions += exam.questions.length;
            exam.questions.forEach((q: any) => {
              const userAnswer = answers[`${examId}-${q.id}`];
              // For A1, is_correct is the correct answer (true/false)
              if (userAnswer === q.is_correct || String(userAnswer) === String(q.is_correct)) {
                correctCount++;
              }
            });
          }
        } else {
          exam = await dataService.getReadingPart1ExamById(examId);
          if (exam && exam.texts) {
            totalQuestions += exam.texts.length;
            exam.texts.forEach((text: any) => {
              const userAnswer = answers[`${examId}-${text.id}`];
              // For B1/B2, correct field contains the correct answer
              if (userAnswer === text.correct || String(userAnswer) === String(text.correct)) {
                correctCount++;
              }
            });
          }
        }
        
        if (!exam) {
          console.warn(`[DiagnosticService] Reading exam ${examId} not found`);
        }
      }
      
      const maxScore = section.assessmentMaxPoints;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * maxScore) : 0;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      return {
        sectionName: 'reading',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating reading section:', error);
      const maxScore = section.assessmentMaxPoints;
      return {
        sectionName: 'reading',
        score: 0,
        maxScore,
        percentage: 0,
        level: 'weak',
      };
    }
  }

  /**
   * Evaluate listening section
   */
  private async evaluateListeningSection(
    questionIds: number[],
    answers: { [questionId: string]: any },
    section: any
  ): Promise<SectionAssessment> {
    try {
      let correctCount = 0;
      let totalQuestions = 0;
      
      // Fetch the listening exam data (listening-part1 has exams array)
      const listeningData = await dataService.getListeningPart1Content();
      
      for (const examId of questionIds) {
        // Find the exam by ID in the exams array
        const exam = listeningData.exams?.find((e: any) => e.id === examId);
        
        if (exam) {
          // Check if this is A1 (questions array) or B1/B2 (statements array)
          const questionsOrStatements = exam.questions || exam.statements;
          
          if (questionsOrStatements && Array.isArray(questionsOrStatements)) {
            totalQuestions += questionsOrStatements.length;
            
            questionsOrStatements.forEach((q: any) => {
              // For A1: q.id and q.is_correct
              // For B1/B2: statement.id and statement.is_correct
              const questionId = q.id || q.question_id;
              const userAnswer = answers[`${examId}-${questionId}`];
              const correctAnswer = q.is_correct !== undefined ? q.is_correct : q.correct;
              
              if (userAnswer === correctAnswer || userAnswer === String(correctAnswer)) {
                correctCount++;
              }
            });
          }
        } else {
          console.warn(`[DiagnosticService] Listening exam ${examId} not found`);
        }
      }
      
      const maxScore = section.assessmentMaxPoints;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * maxScore) : 0;
      const percentage = (score / maxScore) * 100;

      return {
        sectionName: 'listening',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating listening section:', error);
      const maxScore = section.assessmentMaxPoints;
      return {
        sectionName: 'listening',
        score: 0,
        maxScore,
        percentage: 0,
        level: 'weak',
      };
    }
  }

  /**
   * Evaluate grammar section
   */
  private async evaluateGrammarSection(
    questionIds: number[],
    answers: { [questionId: string]: any },
    section: any
  ): Promise<SectionAssessment> {
    try {
      let correctCount = 0;
      let totalQuestions = 0;
      
      for (const examId of questionIds) {
        const exam = await dataService.getGrammarPart1Exam(examId);
        if (exam && exam.questions) {
          totalQuestions += exam.questions.length;
          exam.questions.forEach((q: any) => {
            const userAnswer = answers[`${examId}-${q.id}`];
            const correctAnswer = q.answers?.find((a: any) => a.correct);
            if (userAnswer === correctAnswer?.text) {
              correctCount++;
            }
          });
        }
      }
      
      const maxScore = section.assessmentMaxPoints;
      const score = Math.round((correctCount / totalQuestions) * maxScore);
      const percentage = (score / maxScore) * 100;

      return {
        sectionName: 'grammar',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating grammar section:', error);
      const maxScore = section.assessmentMaxPoints;
      return {
        sectionName: 'grammar',
        score: 0,
        maxScore,
        percentage: 0,
        level: 'weak',
      };
    }
  }

  /**
   * Evaluate writing section (will use AI)
   */
  private async evaluateWritingSection(
    writingAnswer: { text: string; wordCount: number },
    section: any
  ): Promise<SectionAssessment> {
    try {
      // TODO: Implement AI-based writing evaluation via Cloud Function
      // For now, give a moderate score based on word count
      const maxScore = section.assessmentMaxPoints;
      let score = 0;
      
      if (writingAnswer.wordCount >= 50) {
        score = Math.round(maxScore * 0.6); // 60% for completing the task
      } else if (writingAnswer.wordCount >= 30) {
        score = Math.round(maxScore * 0.4); // 40% for partial completion
      }
      
      const percentage = (score / maxScore) * 100;

      return {
        sectionName: 'writing',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating writing section:', error);
      const maxScore = section.assessmentMaxPoints;
      return {
        sectionName: 'writing',
        score: 0,
        maxScore,
        percentage: 0,
        level: 'weak',
      };
    }
  }

  /**
   * Evaluate speaking section (will use AI)
   */
  private async evaluateSpeakingSection(
    speakingAnswer: {
      dialogueId: string;
      audioUrls: string[];
      transcriptions: string[];
    },
    section: any
  ): Promise<SectionAssessment> {
    try {
      const examConfig = activeExamConfig;
      const language = examConfig.language as 'german' | 'english';
      const level = examConfig.level as 'A1' | 'B1' | 'B2';
      
      console.log('[DiagnosticService] Evaluating speaking section...', {
        audioUrlCount: speakingAnswer.audioUrls.length,
        dialogueId: speakingAnswer.dialogueId,
      });

      // If no audio responses, return minimal score
      if (!speakingAnswer.audioUrls || speakingAnswer.audioUrls.length === 0) {
        const maxScore = section.assessmentMaxPoints;
        return {
          sectionName: 'speaking',
          score: 0,
          maxScore,
          percentage: 0,
          level: 'weak',
        };
      }

      // Extract expected contexts from dialogue (stored in session or need to reconstruct)
      // For now, we'll use generic contexts based on turn count
      const expectedContexts = speakingAnswer.audioUrls.map((_, index) => {
        if (index < 2) return 'Personal introduction';
        return 'Conversation task response';
      });

      // Call Cloud Function for batch evaluation
      const response = await axios.post(BATCH_EVALUATE_URL, {
        audioUrls: speakingAnswer.audioUrls,
        expectedContexts,
        level,
        language,
        dialogueId: speakingAnswer.dialogueId,
      });

      const evaluation = response.data as {
        overallScore: number;
        pronunciation: number;
        fluency: number;
        grammar: number;
        vocabulary: number;
        contentRelevance: number;
      };
      
      const maxScore = section.assessmentMaxPoints;
      // Map 0-100 overall score to section max score
      const score = Math.round((evaluation.overallScore / 100) * maxScore);
      const percentage = (score / maxScore) * 100;

      return {
        sectionName: 'speaking',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
        details: {
          pronunciation: evaluation.pronunciation,
          fluency: evaluation.fluency,
          grammarAccuracy: evaluation.grammar,
          vocabularyRange: evaluation.vocabulary,
          contentRelevance: evaluation.contentRelevance,
        },
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating speaking section:', error);
      const maxScore = section.assessmentMaxPoints;
      
      // Give partial credit if they attempted
      const attemptScore = speakingAnswer.audioUrls.length > 0 
        ? Math.round(maxScore * 0.4) 
        : 0;
      
      return {
        sectionName: 'speaking',
        score: attemptScore,
        maxScore,
        percentage: (attemptScore / maxScore) * 100,
        level: 'weak',
      };
    }
  }

  /**
   * ===================================
   * ANALYSIS METHODS
   * ===================================
   */

  /**
   * Identify strengths and weaknesses from section results
   */
  private identifyStrengthsAndWeaknesses(sections: DiagnosticAssessment['sections']): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      if (!sectionData) return;

      if (sectionData.level === 'strong') {
        strengths.push(sectionName);
      } else if (sectionData.level === 'weak') {
        weaknesses.push(sectionName);
      }
    });

    return { strengths, weaknesses };
  }
}

export const diagnosticService = new DiagnosticService();

