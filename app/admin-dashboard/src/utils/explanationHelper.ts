/**
 * Helper to count questions and those with explanations in various JSON structures
 */

export interface ExplanationStats {
  total: number;
  count: number;
}

const hasExplanation = (explanation: any): boolean => {
  if (!explanation) return false;
  if (typeof explanation === 'string') return explanation.trim().length > 0;
  if (typeof explanation === 'object') {
    return Object.keys(explanation).length > 0;
  }
  return false;
};

export const getExplanationStats = (docId: string, data: any): ExplanationStats | null => {
  if (!data) return null;

  let total = 0;
  let count = 0;

  try {
    // Route based on document type
    if (docId.includes('listening-part')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const items = exam.statements || exam.questions || [];
        items.forEach((item: any) => {
          total++;
          if (hasExplanation(item.explanation)) count++;
        });
      });
    } else if (docId.includes('reading-part1')) {
      const exams = Array.isArray(data) ? data : (data.exams || []);
      exams.forEach((exam: any) => {
        const items = exam.texts || [];
        items.forEach((item: any) => {
          total++;
          if (hasExplanation(item.explanation)) count++;
        });
      });
    } else if (docId.includes('reading-part2')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const items = exam.questions || [];
        items.forEach((item: any) => {
          total++;
          if (hasExplanation(item.explanation)) count++;
        });
      });
    } else if (docId.includes('reading-part3')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const items = exam.situations || exam.questions || [];
        items.forEach((item: any) => {
          total++;
          if (hasExplanation(item.explanation)) count++;
        });
      });
    } else if (docId.includes('grammar-part1') || docId.includes('language-part1')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const items = exam.questions || [];
        items.forEach((item: any) => {
          total++;
          if (hasExplanation(item.explanation)) count++;
        });
      });
    } else if (docId.includes('grammar-part2') || docId.includes('language-part2')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const gapIds = Object.keys(exam.answers || {});
        gapIds.forEach((id) => {
          total++;
          if (exam.explanation && hasExplanation(exam.explanation[id])) count++;
        });
      });
    } else if (docId === 'listening-practice') {
      const interviews = data.interviews || [];
      interviews.forEach((interview: any) => {
        const questions = interview.questions || [];
        questions.forEach((q: any) => {
          total++;
          if (hasExplanation(q.explanation)) count++;
        });
      });
    } else if (docId === 'grammar-study-questions') {
      const groups = data.data || (Array.isArray(data) ? data : []);
      groups.forEach((group: any) => {
        const sentences = group.sentences || [];
        sentences.forEach((s: any) => {
          total++;
          // Study questions have explanations per option
          if (s.question && s.question.options && Array.isArray(s.question.options)) {
            const hasAnyExplanation = s.question.options.some((opt: any) => hasExplanation(opt.explanation));
            if (hasAnyExplanation) count++;
          }
        });
      });
    } else {
      // If it doesn't match known patterns, don't show stats
      return null;
    }
  } catch (error) {
    console.error(`Error getting explanation stats for ${docId}:`, error);
    return null;
  }

  return { total, count };
};
