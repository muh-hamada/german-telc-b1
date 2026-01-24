import { UserAnswer, ExamResult } from '../types/exam.types';
import StorageService from './storage.service';

class ProgressService {
  // Calculate score for different exam types
  calculateScore(
    examType: string,
    userAnswers: UserAnswer[],
    correctAnswers: any
  ): { score: number; maxScore: number; results: ExamResult['answers'] } {
    let correctCount = 0;
    const results: ExamResult['answers'] = [];

    switch (examType) {
      case 'grammar-part1':
      case 'grammar-part2':
      case 'reading-part1':
      case 'reading-part2':
      case 'reading-part3':
        // For these types, each question has one correct answer
        userAnswers.forEach(userAnswer => {
          const correctAnswer = this.getCorrectAnswer(examType, userAnswer.questionId, correctAnswers);
          const isCorrect = userAnswer.answer.toLowerCase() === correctAnswer?.toLowerCase();
          
          if (isCorrect) {
            correctCount++;
          }
          
          results.push({
            questionId: userAnswer.questionId,
            answer: userAnswer.answer,
            timestamp: userAnswer.timestamp,
            isCorrect: isCorrect,
            correctAnswer: correctAnswer || '',
          });
        });
        break;
      
      case 'writing':
        // Writing is evaluated differently - for now, give full points if completed
        const hasContent = userAnswers.some(answer => answer.answer.trim().length > 50);
        if (hasContent) {
          correctCount = 1;
        }
        results.push({
          questionId: 1,
          answer: userAnswers[0]?.answer || '',
          timestamp: userAnswers[0]?.timestamp || 0,
          correctAnswer: 'Content evaluated',
          isCorrect: hasContent,
        });
        break;
      
      case 'speaking-part1':
      case 'speaking-part2':
      case 'speaking-part3':
        // Speaking sections are practice-based, give completion points
        const hasAttempted = userAnswers.length > 0;
        if (hasAttempted) {
          correctCount = 1;
        }
        results.push({
          questionId: 1,
          answer: 'Completed',
          timestamp: Date.now(),
          correctAnswer: 'Practice completed',
          isCorrect: true,
        });
        break;
      
      default:
        // Default scoring
        userAnswers.forEach(userAnswer => {
          results.push({
            questionId: userAnswer.questionId,
            answer: userAnswer.answer,
            timestamp: userAnswer.timestamp,
            correctAnswer: '',
            isCorrect: false,
          });
        });
    }

    return {
      score: correctCount,
      maxScore: this.getMaxScore(examType, correctAnswers),
      results,
    };
  }

  private getCorrectAnswer(examType: string, questionId: number, correctAnswers: any): string | null {
    switch (examType) {
      case 'grammar-part1':
        // Find the correct answer from the questions array
        if (correctAnswers.questions) {
          const question = correctAnswers.questions.find((q: any) => q.id === questionId);
          if (question) {
            const correctAnswer = question.answers.find((a: any) => a.correct);
            return correctAnswer ? correctAnswer.text : null;
          }
        }
        break;
      
      case 'grammar-part2':
        // Get correct word key from answers object
        return correctAnswers.answers ? correctAnswers.answers[questionId.toString()] : null;
      
      case 'reading-part1':
        // Get correct heading letter from texts array
        if (correctAnswers.texts) {
          const text = correctAnswers.texts.find((t: any) => t.id === questionId);
          return text ? text.correct : null;
        }
        break;
      
      case 'reading-part2':
      case 'reading-part3':
        // Similar to grammar-part1
        if (correctAnswers.questions) {
          const question = correctAnswers.questions.find((q: any) => q.id === questionId);
          if (question) {
            const correctAnswer = question.answers.find((a: any) => a.correct);
            return correctAnswer ? correctAnswer.text : null;
          }
        }
        break;
    }
    
    return null;
  }

  private getMaxScore(examType: string, correctAnswers: any): number {
    switch (examType) {
      case 'grammar-part1':
        return correctAnswers.questions ? correctAnswers.questions.length : 10;
      
      case 'grammar-part2':
        return correctAnswers.answers ? Object.keys(correctAnswers.answers).length : 10;
      
      case 'reading-part1':
        return correctAnswers.texts ? correctAnswers.texts.length : 5;
      
      case 'reading-part2':
      case 'reading-part3':
        return correctAnswers.questions ? correctAnswers.questions.length : 5;
      
      case 'writing':
        return 1; // Writing is pass/fail based on completion
      
      case 'speaking-part1':
      case 'speaking-part2':
      case 'speaking-part3':
        return 1; // Speaking is completion-based
      
      default:
        return 1;
    }
  }

  // Create user answer from form data
  createUserAnswer(questionId: number, answer: string): UserAnswer {
    return {
      questionId,
      answer,
      timestamp: Date.now(),
      correctAnswer: '',
      isCorrect: false,
    };
  }

  // Create user answers from form data
  createUserAnswers(answers: Record<string, string>): UserAnswer[] {
    return Object.entries(answers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      answer,
      timestamp: Date.now(),
      correctAnswer: '',
      isCorrect: false,
    }));
  }

  // Get progress statistics
  async getProgressStats(): Promise<{
    totalExams: number;
    completedExams: number;
    totalScore: number;
    totalMaxScore: number;
    averageScore: number;
    completionRate: number;
    examTypeStats: Record<string, { completed: number; total: number; averageScore: number }>;
  }> {
    const progress = await StorageService.getUserProgress();
    
    if (!progress) {
      return {
        totalExams: 0,
        completedExams: 0,
        totalScore: 0,
        totalMaxScore: 0,
        averageScore: 0,
        completionRate: 0,
        examTypeStats: {},
      };
    }

    const completedExams = progress.exams.filter(exam => exam.completed);
    const totalExams = progress.exams.length;
    const averageScore = progress.totalMaxScore > 0 
      ? (progress.totalScore / progress.totalMaxScore) * 100 
      : 0;
    const completionRate = totalExams > 0 ? (completedExams.length / totalExams) * 100 : 0;

    // Calculate stats by exam type
    const examTypeStats: Record<string, { completed: number; total: number; averageScore: number }> = {};
    const examTypes = [...new Set(progress.exams.map(exam => exam.examType))];
    
    examTypes.forEach(examType => {
      const typeExams = progress.exams.filter(exam => exam.examType === examType);
      const typeCompleted = typeExams.filter(exam => exam.completed);
      const typeScore = typeCompleted.reduce((sum, exam) => sum + (exam.score || 0), 0);
      const typeMaxScore = typeCompleted.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);
      const typeAverageScore = typeMaxScore > 0 ? (typeScore / typeMaxScore) * 100 : 0;
      
      examTypeStats[examType] = {
        completed: typeCompleted.length,
        total: typeExams.length,
        averageScore: Math.round(typeAverageScore),
      };
    });

    return {
      totalExams,
      completedExams: completedExams.length,
      totalScore: progress.totalScore,
      totalMaxScore: progress.totalMaxScore,
      averageScore: Math.round(averageScore),
      completionRate: Math.round(completionRate),
      examTypeStats,
    };
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<ExamResult[]> {
    const progress = await StorageService.getUserProgress();
    
    if (!progress) {
      return [];
    }

    return progress.exams
      .filter(exam => exam.completed)
      .sort((a, b) => b.lastAttempt - a.lastAttempt)
      .slice(0, limit)
      .map(exam => ({
        examId: exam.examId,
        score: exam.score || 0,
        maxScore: exam.maxScore || 0,
        percentage: exam.maxScore && exam.maxScore > 0 
          ? Math.round((exam.score || 0) / exam.maxScore * 100) 
          : 0,
        correctAnswers: exam.answers.length,
        totalQuestions: exam.answers.length,
        answers: exam.answers.map(answer => ({
          questionId: answer.questionId,
          answer: answer.answer,
          timestamp: answer.timestamp,
          correctAnswer: 'Unknown', // We don't store correct answers in progress
          isCorrect: answer.isCorrect || false,
        })),
        timestamp: exam.lastAttempt,
      }));
  }

  // Check if exam is completed
  async isExamCompleted(examType: string, examId: string): Promise<boolean> {
    const examProgress = await StorageService.getExamProgress(examType, examId);
    return examProgress?.completed || false;
  }

  // Get exam completion percentage
  async getExamCompletionPercentage(examType: string): Promise<number> {
    const progress = await StorageService.getUserProgress();
    
    if (!progress) {
      return 0;
    }

    const typeExams = progress.exams.filter(exam => exam.examType === examType);
    const completedExams = typeExams.filter(exam => exam.completed);
    
    return typeExams.length > 0 ? (completedExams.length / typeExams.length) * 100 : 0;
  }
}

export default new ProgressService();
