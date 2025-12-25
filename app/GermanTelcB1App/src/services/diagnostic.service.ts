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
          speaking: {} as SpeakingAssessmentDialogue, // Will be generated
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
            exam.sections.writing = await this.selectRandomWritingTask();
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
            sectionAssessment = await this.evaluateWritingSection(
              answers.answers.writing,
              section
            );
            sections.writing = sectionAssessment;
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
        ? await dataService.getAllReadingPart1A1Exams()
        : await dataService.getAllReadingPart1Exams();
      
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
      // Get all listening practice interviews
      const allInterviews = await dataService.getAllListeningPractice();
      
      if (!allInterviews || allInterviews.length === 0) {
        console.warn('[DiagnosticService] No listening interviews found, using fallback');
        return [1];
      }
      
      const selectedIndices = this.getRandomIndices(allInterviews.length, Math.min(count, allInterviews.length));
      return selectedIndices.map(i => allInterviews[i].id);
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
      const allExams = await dataService.getAllGrammarPart1Exams();
      
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
      const allExams = await dataService.getAllWritingExams();
      
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
    level: 'A1' | 'B1' | 'B2'
  ): Promise<SpeakingAssessmentDialogue> {
    try {
      // Speaking dialogue will be generated via Cloud Function when user starts speaking section
      // For now, return a placeholder structure
      return {
        dialogueId: `speaking-diagnostic-${Date.now()}`,
        partNumber: 1,
        level,
        turns: [],
        totalTurns: 5, // Diagnostic uses 5 turns
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
              if (userAnswer === q.is_correct) {
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
              if (userAnswer === text.correct) {
                correctCount++;
              }
            });
          }
        }
      }
      
      const maxScore = section.assessmentMaxPoints;
      const score = Math.round((correctCount / totalQuestions) * maxScore);
      const percentage = (score / maxScore) * 100;

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
      
      for (const interviewId of questionIds) {
        const interview = await dataService.getListeningPracticeById(interviewId);
        if (interview && interview.questions) {
          totalQuestions += interview.questions.length;
          interview.questions.forEach((q: any) => {
            const userAnswer = answers[`${interviewId}-${q.id || q.question_id}`];
            if (userAnswer === q.correct || userAnswer === q.is_correct) {
              correctCount++;
            }
          });
        }
      }
      
      const maxScore = section.assessmentMaxPoints;
      const score = Math.round((correctCount / totalQuestions) * maxScore);
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
        const exam = await dataService.getGrammarPart1ExamById(examId);
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
      // TODO: Implement AI-based speaking evaluation via Cloud Function
      // For now, give a moderate score if they completed the dialogue
      const maxScore = section.assessmentMaxPoints;
      let score = 0;
      
      if (speakingAnswer.audioUrls && speakingAnswer.audioUrls.length > 0) {
        score = Math.round(maxScore * 0.6); // 60% for attempting the speaking task
      }
      
      const percentage = (score / maxScore) * 100;

      return {
        sectionName: 'speaking',
        score,
        maxScore,
        percentage,
        level: calculateSectionLevel(percentage, section),
      };
    } catch (error) {
      console.error('[DiagnosticService] Error evaluating speaking section:', error);
      const maxScore = section.assessmentMaxPoints;
      return {
        sectionName: 'speaking',
        score: 0,
        maxScore,
        percentage: 0,
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

