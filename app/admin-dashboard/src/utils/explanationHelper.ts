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

function handleObjectExplanations(exam: any, keyName: string): ExplanationStats {
  let total = 0;
  let count = 0;

  const gapIds = Object.keys(exam[keyName] || {});
  gapIds.forEach((id) => {
    total++;
    if (exam.explanation && hasExplanation(exam.explanation[id])) count++;
  });

  return { total, count };
}

function handleArrayExplanations(exam: any, keyName: string): ExplanationStats {
  let total = 0;
  let count = 0;

  const items = exam[keyName] || [];
  items.forEach((item: any) => {
    total++;
    if (hasExplanation(item.explanation)) count++;
  });

  return { total, count };
}


function handleGrammarStudyExplanations(data: any): ExplanationStats {
  let total = 0;
  let count = 0;

  const groups = data.data || (Array.isArray(data) ? data : []);
  groups.forEach((group: any) => {
    const sentences = group.sentences || [];
    sentences.forEach((s: any) => {
      total++;
      // Study questions have explanations per option
      if (s?.question?.options && Array.isArray(s.question.options)) {
        const hasAnyExplanation = s.question.options.some((opt: any) => hasExplanation(opt.explanation));
        if (hasAnyExplanation) count++;
      }
    });
  });

  return { total, count };
}

function handleWritingExplanations(data: any): ExplanationStats {
  return { total: 1, count: data.modalAnswer ? 1 : 0 };
}

export const getExplanationStats = (docId: string, data: any, appId?: string): ExplanationStats | null => {
  if (!data) return null;

  let total = 0;
  let count = 0;

  if (appId === 'dele-spanish-b1') {
    try {
      const exams = Array.isArray(data) ? data : (data.exams || []);
      exams.forEach((exam: any) => {
        let stats: ExplanationStats = { total: 0, count: 0 };
        
        // Route based on document type
        if (docId.includes('grammar-part1')) {
          stats = handleObjectExplanations(exam, 'answers');
        }

        if (docId.includes('grammar-part2')
          || docId.includes('listening-part1')
          || docId.includes('listening-part2')
          || docId.includes('listening-part3')
          || docId.includes('listening-part4')
          || docId.includes('listening-part5')
          || docId.includes('reading-part1')
          || docId.includes('reading-part2')
          || docId.includes('reading-part3')

        ) {
          stats = handleArrayExplanations(exam, 'questions');
        }

        if (docId === 'writing-part1' || docId === 'writing-part2') {
          stats = handleWritingExplanations(exam);
          
        }

        total += stats.total;
        count += stats.count;
      });

      if (docId === 'grammar-study-questions') {
        const stats = handleGrammarStudyExplanations(data);
        total += stats.total;
        count += stats.count;
      }

      if (exams.length === 0) {
        return null;
      }
    } catch (error) {
      console.error(`Error getting explanation stats for ${docId}:`, error);
      return null;
    }

    return { total, count };
  }


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
        const stats = handleArrayExplanations(exam, 'questions');
        total += stats.total;
        count += stats.count;
      });
    } else if (docId.includes('grammar-part2') || docId.includes('language-part2')) {
      const exams = data.exams || [];
      exams.forEach((exam: any) => {
        const stats = handleObjectExplanations(exam, 'answers');
        total += stats.total;
        count += stats.count;
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
      const stats = handleGrammarStudyExplanations(data);
      total += stats.total;
      count += stats.count;
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
