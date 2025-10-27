export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate Grammar Part 1 & 2 structure
 */
export const validateGrammarPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.text !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "text"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (!Array.isArray(q.answers)) {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "answers" array`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

export const validateGrammarPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (!Array.isArray(exam.words)) {
      errors.push(`Exam ${index}: Missing or invalid "words" array`);
    }
    if (typeof exam.text !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "text"`);
    }
    if (typeof exam.answers !== 'object') {
      errors.push(`Exam ${index}: Missing or invalid "answers" object`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Reading Part 1 structure
 */
export const validateReadingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array of exams');
    return { valid: false, errors };
  }

  data.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (!Array.isArray(exam.headings)) {
      errors.push(`Exam ${index}: Missing or invalid "headings" array`);
    }
    if (!Array.isArray(exam.texts)) {
      errors.push(`Exam ${index}: Missing or invalid "texts" array`);
    } else {
      exam.texts.forEach((text: any, tIndex: number) => {
        if (typeof text.id !== 'number') {
          errors.push(`Exam ${index}, Text ${tIndex}: Missing "id"`);
        }
        if (typeof text.text !== 'string') {
          errors.push(`Exam ${index}, Text ${tIndex}: Missing "text"`);
        }
        if (typeof text.correct !== 'string') {
          errors.push(`Exam ${index}, Text ${tIndex}: Missing "correct" answer`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Reading Part 2 structure
 */
export const validateReadingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.text !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "text"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (!Array.isArray(q.answers)) {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "answers" array`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Reading Part 3 structure
 */
export const validateReadingPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.advertisements !== 'object') {
      errors.push(`Exam ${index}: Missing or invalid "advertisements" object`);
    }
    if (!Array.isArray(exam.situations)) {
      errors.push(`Exam ${index}: Missing or invalid "situations" array`);
    } else {
      exam.situations.forEach((situation: any, sIndex: number) => {
        if (typeof situation.id !== 'number') {
          errors.push(`Exam ${index}, Situation ${sIndex}: Missing "id"`);
        }
        if (typeof situation.text !== 'string') {
          errors.push(`Exam ${index}, Situation ${sIndex}: Missing "text"`);
        }
        if (typeof situation.answer !== 'string') {
          errors.push(`Exam ${index}, Situation ${sIndex}: Missing "answer"`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Listening Part 1, 2, 3 structure
 */
export const validateListeningPart = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.section_details || typeof data.section_details !== 'object') {
    errors.push('Missing or invalid "section_details" object');
  }

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: errors.length === 0, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.audio_url !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "audio_url"`);
    }
    if (!Array.isArray(exam.statements)) {
      errors.push(`Exam ${index}: Missing or invalid "statements" array`);
    } else {
      exam.statements.forEach((statement: any, sIndex: number) => {
        if (typeof statement.id !== 'number') {
          errors.push(`Exam ${index}, Statement ${sIndex}: Missing "id"`);
        }
        if (typeof statement.statement !== 'string') {
          errors.push(`Exam ${index}, Statement ${sIndex}: Missing "statement" text`);
        }
        if (typeof statement.is_correct !== 'boolean') {
          errors.push(`Exam ${index}, Statement ${sIndex}: Missing "is_correct" boolean`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Speaking - Important Phrases structure
 */
export const validateSpeakingImportantPhrases = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.groups || !Array.isArray(data.groups)) {
    errors.push('Missing or invalid "phrases" array');
    return { valid: false, errors };
  }

  data.groups.forEach((group: any, index: number) => {
    if (typeof group.id !== 'number') {
      errors.push(`Group ${index}: Missing or invalid "id"`);
    }
    if (typeof group.name !== 'string') {
      errors.push(`Group ${index}: Missing or invalid "name"`);
    }
    if (!Array.isArray(group.phrases)) {
      errors.push(`Group ${index}: Missing or invalid "phrases" array`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Speaking Part 1 structure
 */
export const validateSpeakingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.content || typeof data.content !== 'object') {
    errors.push('Missing or invalid "content" object');
    return { valid: false, errors };
  }

  const content = data.content;
  if (typeof content.id !== 'number') {
    errors.push('Content: Missing or invalid "id"');
  }
  if (typeof content.title !== 'string') {
    errors.push('Content: Missing or invalid "title"');
  }
  if (!Array.isArray(content.completeExample)) {
    errors.push('Content: Missing or invalid "completeExample" array');
  }
  if (!Array.isArray(content.vocabulary)) {
    errors.push('Content: Missing or invalid "vocabulary" array');
  }
  if (!Array.isArray(content.questions)) {
    errors.push('Content: Missing or invalid "questions" array');
  } else {
    content.questions.forEach((question: any, index: number) => {
      if (typeof question.formal !== 'string') {
        errors.push(`Question ${index}: Missing or invalid "formal"`);
      }
      if (typeof question.informal !== 'string') {
        errors.push(`Question ${index}: Missing or invalid "informal"`);
      }
      if (typeof question.answer !== 'string') {
        errors.push(`Question ${index}: Missing or invalid "answer"`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Speaking Part 2 structure
 */
export const validateSpeakingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.topics || !Array.isArray(data.topics)) {
    errors.push('Missing or invalid "topics" array');
    return { valid: false, errors };
  }

  data.topics.forEach((topic: any, index: number) => {
    if (typeof topic.id !== 'number') {
      errors.push(`Topic ${index}: Missing or invalid "id"`);
    }
    if (typeof topic.title !== 'string') {
      errors.push(`Topic ${index}: Missing or invalid "title"`);
    }
    if (!topic.viewA || typeof topic.viewA !== 'object') {
      errors.push(`Topic ${index}: Missing or invalid "viewA" object`);
    }
    if (!topic.viewB || typeof topic.viewB !== 'object') {
      errors.push(`Topic ${index}: Missing or invalid "viewB" object`);
    }
    if (!Array.isArray(topic.discussion)) {
      errors.push(`Topic ${index}: Missing or invalid "discussion" array`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Speaking Part 3 structure
 */
export const validateSpeakingPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.scenarios || !Array.isArray(data.scenarios)) {
    errors.push('Missing or invalid "scenarios" array');
    return { valid: false, errors };
  }

  data.scenarios.forEach((scenario: any, index: number) => {
    if (typeof scenario.id !== 'number') {
      errors.push(`Scenario ${index}: Missing or invalid "id"`);
    }
    if (typeof scenario.title !== 'string') {
      errors.push(`Scenario ${index}: Missing or invalid "title"`);
    }
    if (typeof scenario.scenario !== 'string') {
      errors.push(`Scenario ${index}: Missing or invalid "scenario" description`);
    }
    if (!Array.isArray(scenario.dialogue)) {
      errors.push(`Scenario ${index}: Missing or invalid "dialogue" array`);
    }
    if (!Array.isArray(scenario.vocabulary)) {
      errors.push(`Scenario ${index}: Missing or invalid "vocabulary" array`);
    }
    if (!Array.isArray(scenario.phrases)) {
      errors.push(`Scenario ${index}: Missing or invalid "phrases" array`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Writing structure
 */
export const validateWriting = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.incomingEmail !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "incomingEmail"`);
    }
    if (!Array.isArray(exam.writingPoints)) {
      errors.push(`Exam ${index}: Missing or invalid "writingPoints" array`);
    } else if (exam.writingPoints.length !== 4) {
      errors.push(`Exam ${index}: "writingPoints" should have exactly 4 items`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate Exam Info structure
 */
export const validateExamInfo = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exam_info || typeof data.exam_info !== 'object') {
    errors.push('Missing or invalid "exam_info" object');
    return { valid: false, errors };
  }

  const examInfo = data.exam_info;
  const requiredLanguages = ['en', 'ar', 'ru', 'fr', 'es', 'de'];

  if (!examInfo.title || typeof examInfo.title !== 'object') {
    errors.push('Missing or invalid "title" multilingual object');
  } else {
    requiredLanguages.forEach((lang) => {
      if (!examInfo.title[lang]) {
        errors.push(`Missing "${lang}" translation in title`);
      }
    });
  }

  if (typeof examInfo.cefr_level !== 'string') {
    errors.push('Missing or invalid "cefr_level"');
  }

  if (typeof examInfo.total_duration_minutes !== 'number') {
    errors.push('Missing or invalid "total_duration_minutes"');
  }

  if (!examInfo.exam_structure || typeof examInfo.exam_structure !== 'object') {
    errors.push('Missing or invalid "exam_structure" object');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Main validator that routes to specific validators based on document ID
 */
export const validateDocument = (docId: string, data: any): ValidationResult => {
  try {
    // First check if data is valid JSON
    if (typeof data !== 'object' || data === null) {
      return { valid: false, errors: ['Invalid JSON structure'] };
    }

    // Route to specific validator based on document ID
    switch (docId) {
      case 'grammar-part1':
        return validateGrammarPart1(data);
      case 'grammar-part2':
        return validateGrammarPart2(data);
      case 'reading-part1':
        return validateReadingPart1(data);
      case 'reading-part2':
        return validateReadingPart2(data);
      case 'reading-part3':
        return validateReadingPart3(data);
      case 'listening-part1':
      case 'listening-part2':
      case 'listening-part3':
        return validateListeningPart(data);
      case 'speaking-part1':
        return validateSpeakingPart1(data);
      case 'speaking-part2':
        return validateSpeakingPart2(data);
      case 'speaking-part3':
        return validateSpeakingPart3(data);
      case 'speaking-important-phrases':
        return validateSpeakingImportantPhrases(data);
      case 'writing':
        return validateWriting(data);
      case 'exam-info':
        return validateExamInfo(data);
      default:
        return { valid: false, errors: [`Unknown document type: ${docId}`] };
    }
  } catch (error: any) {
    return { valid: false, errors: [error.message || 'Validation error'] };
  }
};

