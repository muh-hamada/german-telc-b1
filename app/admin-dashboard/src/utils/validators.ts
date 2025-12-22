export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Helper function to find duplicate IDs in an array
 */
const findDuplicateIds = (ids: (number | string)[]): (number | string)[] => {
  const seen = new Set<number | string>();
  const duplicates = new Set<number | string>();

  ids.forEach(id => {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  });

  return Array.from(duplicates);
};

/**
 * Validate Grammar Part 1 & 2 structure
 */
export const validateGrammarPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

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

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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

  // Check for duplicate exam IDs
  const examIds = data.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
      // Check for duplicate text IDs within this exam
      const textIds = exam.texts.map((t: any) => t.id).filter((id: any) => typeof id === 'number');
      const duplicateTextIds = findDuplicateIds(textIds);
      if (duplicateTextIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate text IDs found: ${duplicateTextIds.join(', ')}`);
      }

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

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

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

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
      // Check for duplicate situation IDs within this exam
      const situationIds = exam.situations.map((s: any) => s.id).filter((id: any) => typeof id === 'number');
      const duplicateSituationIds = findDuplicateIds(situationIds);
      if (duplicateSituationIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate situation IDs found: ${duplicateSituationIds.join(', ')}`);
      }

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

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
      // Check for duplicate statement IDs within this exam
      const statementIds = exam.statements.map((s: any) => s.id).filter((id: any) => typeof id === 'number');
      const duplicateStatementIds = findDuplicateIds(statementIds);
      if (duplicateStatementIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate statement IDs found: ${duplicateStatementIds.join(', ')}`);
      }

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

  // Check for duplicate group IDs
  const groupIds = data.groups.map((group: any) => group.id).filter((id: any) => typeof id === 'number');
  const duplicateGroupIds = findDuplicateIds(groupIds);
  if (duplicateGroupIds.length > 0) {
    errors.push(`Duplicate group IDs found: ${duplicateGroupIds.join(', ')}`);
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

  // Check for duplicate topic IDs
  const topicIds = data.topics.map((topic: any) => topic.id).filter((id: any) => typeof id === 'number');
  const duplicateTopicIds = findDuplicateIds(topicIds);
  if (duplicateTopicIds.length > 0) {
    errors.push(`Duplicate topic IDs found: ${duplicateTopicIds.join(', ')}`);
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
    if (!topic.viewA.presentationExample || typeof topic.viewA.presentationExample !== 'string') {
      errors.push(`Topic ${index}: Missing or invalid "viewA.presentationExample"`);
    }
    if (!topic.viewB || typeof topic.viewB !== 'object') {
      errors.push(`Topic ${index}: Missing or invalid "viewB" object`);

    }
    if (!topic.viewB.presentationExample || typeof topic.viewB.presentationExample !== 'string') {
      errors.push(`Topic ${index}: Missing or invalid "viewB.presentationExample"`);
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

  // Check for duplicate scenario IDs
  const scenarioIds = data.scenarios.map((scenario: any) => scenario.id).filter((id: any) => typeof id === 'number');
  const duplicateScenarioIds = findDuplicateIds(scenarioIds);
  if (duplicateScenarioIds.length > 0) {
    errors.push(`Duplicate scenario IDs found: ${duplicateScenarioIds.join(', ')}`);
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

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
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
 * Validate Listening Practice structure
 */
export const validateListeningPractice = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.interviews || !Array.isArray(data.interviews)) {
    errors.push('Missing or invalid "interviews" array');
    return { valid: false, errors };
  }

  // Check for duplicate interview IDs (using title as unique identifier since no id field)
  const interviewTitles = data.interviews.map((interview: any) => interview.title).filter((title: any) => typeof title === 'string');
  const duplicateInterviewTitles = findDuplicateIds(interviewTitles);
  if (duplicateInterviewTitles.length > 0) {
    errors.push(`Duplicate interview titles found: ${duplicateInterviewTitles.join(', ')}`);
  }

  data.interviews.forEach((interview: any, index: number) => {
    if (typeof interview.title !== 'string') {
      errors.push(`Interview ${index}: Missing or invalid "title"`);
    }
    if (typeof interview.audio_url !== 'string') {
      errors.push(`Interview ${index}: Missing or invalid "audio_url"`);
    }
    if (typeof interview.image_url !== 'string') {
      errors.push(`Interview ${index}: Missing or invalid "image_url"`);
    }
    if (!Array.isArray(interview.questions)) {
      errors.push(`Interview ${index}: Missing or invalid "questions" array`);
    }
    if (typeof interview.duration !== 'string') {
      errors.push(`Interview ${index}: Missing or invalid "duration"`);
    }

    if (Array.isArray(interview.questions)) {
      interview.questions.forEach((question: any, qIndex: number) => {
        if (typeof question.question !== 'string') {
          errors.push(`Interview ${index}, Question ${qIndex}: Missing or invalid "question"`);
        }
        if (typeof question.correct !== 'boolean') {
          errors.push(`Interview ${index}, Question ${qIndex}: Missing or invalid "correct"`);
        }
        if (typeof question.explanation !== 'string') {
          errors.push(`Interview ${index}, Question ${qIndex}: Missing or invalid "explanation"`);
        }
      });
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
 * Validate Grammar Study Questions structure
 */
export const validateGrammarStudyQuestions = (data: any): ValidationResult => {
  const errors: string[] = [];
  const requiredLanguages = ['en', 'de', 'ar', 'Fr', 'ru', 'es'];

  // Check if data has the wrapped structure
  let questionGroups;
  if (data.data && Array.isArray(data.data)) {
    // Wrapped structure with metadata
    questionGroups = data.data;

    // Validate metadata if present
    if (data.metadata) {
      if (typeof data.metadata !== 'object') {
        errors.push('Invalid "metadata" - should be an object');
      }
    }
  } else if (Array.isArray(data)) {
    // Direct array structure
    questionGroups = data;
  } else {
    errors.push('Data must be an array of question groups or an object with "data" array');
    return { valid: false, errors };
  }

  if (!Array.isArray(questionGroups)) {
    errors.push('Question groups must be an array');
    return { valid: false, errors };
  }

  // Validate each question group
  questionGroups.forEach((group: any, groupIndex: number) => {
    if (typeof group.name !== 'string') {
      errors.push(`Group ${groupIndex}: Missing or invalid "name"`);
    }

    if (!group.description || typeof group.description !== 'object') {
      errors.push(`Group ${groupIndex}: Missing or invalid "description" object`);
    } else {
      requiredLanguages.forEach((lang) => {
        if (typeof group.description[lang] !== 'string') {
          errors.push(`Group ${groupIndex}: Missing "${lang}" in description`);
        }
      });
    }

    if (!Array.isArray(group.sentences)) {
      errors.push(`Group ${groupIndex}: Missing or invalid "sentences" array`);
      return;
    }

    // Validate each sentence
    group.sentences.forEach((sentence: any, sentenceIndex: number) => {
      if (typeof sentence.text !== 'string') {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid "text"`);
      }

      if (!sentence.translations || typeof sentence.translations !== 'object') {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid "translations" object`);
      } else {
        requiredLanguages.forEach((lang) => {
          if (typeof sentence.translations[lang] !== 'string') {
            errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing "${lang}" in translations`);
          }
        });
      }

      if (!sentence.question || typeof sentence.question !== 'object') {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid "question" object`);
        return;
      }

      const question = sentence.question;
      if (typeof question.rendered_sentence !== 'string') {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid "rendered_sentence"`);
      }

      if (typeof question.type !== 'string') {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid question "type"`);
      }

      if (!Array.isArray(question.options)) {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: Missing or invalid "options" array - ${question.rendered_sentence}`);
        return;
      }

      // Validate each option
      question.options.forEach((option: any, optionIndex: number) => {
        if (typeof option.choice !== 'string') {
          errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}, Option ${optionIndex}: Missing or invalid "choice"`);
        }

        if (typeof option.is_correct !== 'boolean') {
          errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}, Option ${optionIndex}: Missing or invalid "is_correct"`);
        }

        if (!option.explanation || typeof option.explanation !== 'object') {
          errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}, Option ${optionIndex}: Missing or invalid "explanation" object`);
        } else {
          requiredLanguages.forEach((lang) => {
            if (typeof option.explanation[lang] !== 'string') {
              errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}, Option ${optionIndex}: Missing "${lang}" in explanation`);
            }
          });
        }
      });

      // Check that at least one option is correct
      const hasCorrectAnswer = question.options.some((opt: any) => opt.is_correct === true);
      if (!hasCorrectAnswer) {
        errors.push(`Group ${groupIndex}, Sentence ${sentenceIndex}: No option marked as correct`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate B2 Speaking Part 1 structure
 */
export const validateB2SpeakingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.topics || !Array.isArray(data.topics)) {
    errors.push('Missing or invalid "topics" array');
    return { valid: false, errors };
  }

  // Check for duplicate topic titles (using title as unique identifier)
  const topicTitles = data.topics.map((topic: any) => topic.title).filter((title: any) => typeof title === 'string');
  const duplicateTopicTitles = findDuplicateIds(topicTitles);
  if (duplicateTopicTitles.length > 0) {
    errors.push(`Duplicate topic titles found: ${duplicateTopicTitles.join(', ')}`);
  }

  data.topics.forEach((topic: any, index: number) => {
    if (typeof topic.title !== 'string') {
      errors.push(`Topic ${index}: Missing or invalid "title"`);
    }
    if (typeof topic.examplePresentation !== 'string') {
      errors.push(`Topic ${index}: Missing or invalid "examplePresentation"`);
    }
    if (!Array.isArray(topic.exampleDiscussion)) {
      errors.push(`Topic ${index}: Missing or invalid "exampleDiscussion" array`);
    } else {
      topic.exampleDiscussion.forEach((item: any, qIndex: number) => {
        if (typeof item.question !== 'string') {
          errors.push(`Topic ${index}, Discussion ${qIndex}: Missing "question"`);
        }
        if (typeof item.answer !== 'string') {
          errors.push(`Topic ${index}, Discussion ${qIndex}: Missing "answer"`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate B2 Speaking Part 2 structure
 */
export const validateB2SpeakingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.questions || !Array.isArray(data.questions)) {
    errors.push('Missing or invalid "questions" array');
    return { valid: false, errors };
  }

  // Check for duplicate question titles (using title as unique identifier)
  const questionTitles = data.questions.map((q: any) => q.title).filter((title: any) => typeof title === 'string');
  const duplicateQuestionTitles = findDuplicateIds(questionTitles);
  if (duplicateQuestionTitles.length > 0) {
    errors.push(`Duplicate question titles found: ${duplicateQuestionTitles.join(', ')}`);
  }

  data.questions.forEach((question: any, index: number) => {
    if (typeof question.title !== 'string') {
      errors.push(`Question ${index}: Missing or invalid "title"`);
    }
    if (typeof question.content !== 'string') {
      errors.push(`Question ${index}: Missing or invalid "content"`);
    }
    if (typeof question.source !== 'string') {
      errors.push(`Question ${index}: Missing or invalid "source"`);
    }
    if (!Array.isArray(question.summary)) {
      errors.push(`Question ${index}: Missing or invalid "summary" array`);
    } else {
      question.summary.forEach((item: any, sIndex: number) => {
        if (typeof item.speaker !== 'string') {
          errors.push(`Question ${index}, Summary ${sIndex}: Missing "speaker"`);
        }
        if (typeof item.text !== 'string') {
          errors.push(`Question ${index}, Summary ${sIndex}: Missing "text"`);
        }
      });
    }
    if (!Array.isArray(question.exampleDiscussion)) {
      errors.push(`Question ${index}: Missing or invalid "exampleDiscussion" array`);
    } else {
      question.exampleDiscussion.forEach((item: any, dIndex: number) => {
        if (typeof item.speaker !== 'string') {
          errors.push(`Question ${index}, Discussion ${dIndex}: Missing "speaker"`);
        }
        if (typeof item.text !== 'string') {
          errors.push(`Question ${index}, Discussion ${dIndex}: Missing "text"`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate B2 Speaking Part 3 structure
 */
export const validateB2SpeakingPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.questions || !Array.isArray(data.questions)) {
    errors.push('Missing or invalid "questions" array');
    return { valid: false, errors };
  }

  // Check for duplicate questions (using question text as unique identifier)
  const questionTexts = data.questions.map((q: any) => q.question).filter((q: any) => typeof q === 'string');
  const duplicateQuestionTexts = findDuplicateIds(questionTexts);
  if (duplicateQuestionTexts.length > 0) {
    errors.push(`Duplicate questions found: ${duplicateQuestionTexts.join(', ')}`);
  }

  data.questions.forEach((question: any, index: number) => {
    if (typeof question.question !== 'string') {
      errors.push(`Question ${index}: Missing or invalid "question" text`);
    }
    if (!Array.isArray(question.exampleDialogue)) {
      errors.push(`Question ${index}: Missing or invalid "exampleDialogue" array`);
    } else {
      question.exampleDialogue.forEach((item: any, dIndex: number) => {
        if (typeof item.speaker !== 'string') {
          errors.push(`Question ${index}, Dialogue ${dIndex}: Missing "speaker"`);
        }
        if (typeof item.text !== 'string') {
          errors.push(`Question ${index}, Dialogue ${dIndex}: Missing "text"`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate B2 Oral Exam Structure
 */
export const validateB2OralExamStructure = (data: any): ValidationResult => {
  const errors: string[] = [];
  const requiredLanguages = ['en', 'ar', 'ru', 'fr', 'es', 'de'];

  if (!data.title || typeof data.title !== 'object') {
    errors.push('Missing or invalid "title" multilingual object');
  } else {
    requiredLanguages.forEach((lang) => {
      if (typeof data.title[lang] !== 'string') {
        errors.push(`Missing "${lang}" translation in title`);
      }
    });
  }

  if (!data.general || typeof data.general !== 'object') {
    errors.push('Missing or invalid "general" object');
  } else {
    if (!data.general.howItWorks || typeof data.general.howItWorks !== 'object') {
      errors.push('Missing or invalid "general.howItWorks" multilingual object');
    }
    if (!data.general.expectations || typeof data.general.expectations !== 'object') {
      errors.push('Missing or invalid "general.expectations" multilingual object');
    }
  }

  if (!data.parts || !Array.isArray(data.parts)) {
    errors.push('Missing or invalid "parts" array');
  } else {
    data.parts.forEach((part: any, index: number) => {
      if (!part.name || typeof part.name !== 'object') {
        errors.push(`Part ${index}: Missing or invalid "name" multilingual object`);
      }
      if (!part.duration || typeof part.duration !== 'object') {
        errors.push(`Part ${index}: Missing or invalid "duration" multilingual object`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Reading Part 1 structure
 */
export const validateA1ReadingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array of exams');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.forEach((exam: any, index: number) => {
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
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (typeof q.is_correct !== 'boolean') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "is_correct" boolean`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Reading Part 2 structure
 */
export const validateA1ReadingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.situation !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "situation" text`);
        }
        if (!Array.isArray(q.options)) {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "options" array`);
        } else if (q.options.length !== 2) {
          errors.push(`Exam ${index}, Question ${qIndex}: Should have exactly 2 options`);
        } else {
          q.options.forEach((opt: any, optIndex: number) => {
            if (typeof opt.id !== 'number') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "id"`);
            }
            if (typeof opt.text !== 'string' && typeof opt.option !== 'string') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "text" or "option"`);
            }
            if (typeof opt.is_correct !== 'boolean') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "is_correct" boolean`);
            }
          });
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Reading Part 3 structure
 */
export const validateA1ReadingPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.text !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "text"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (typeof q.is_correct !== 'boolean') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "is_correct" boolean`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Writing Part 1 structure
 */
export const validateA1WritingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.instruction_header !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "instruction_header"`);
    }
    if (!Array.isArray(exam.task_points)) {
      errors.push(`Exam ${index}: Missing or invalid "task_points" array`);
    } else {
      exam.task_points.forEach((point: any, pIndex: number) => {
        if (typeof point.id !== 'string') {
          errors.push(`Exam ${index}, Task Point ${pIndex}: Missing "id"`);
        }
        if (typeof point.text !== 'string') {
          errors.push(`Exam ${index}, Task Point ${pIndex}: Missing "text"`);
        }
        if (!Array.isArray(point.keywords_expected)) {
          errors.push(`Exam ${index}, Task Point ${pIndex}: Missing "keywords_expected" array`);
        }
      });
    }
    if (!exam.constraints || typeof exam.constraints !== 'object') {
      errors.push(`Exam ${index}: Missing or invalid "constraints" object`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Writing Part 2 structure
 */
export const validateA1WritingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: false, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.scenario_text !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "scenario_text"`);
    }
    if (typeof exam.instruction !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "instruction"`);
    }
    if (!Array.isArray(exam.form_fields)) {
      errors.push(`Exam ${index}: Missing or invalid "form_fields" array`);
    } else {
      // Check for duplicate field IDs within this exam
      const fieldIds = exam.form_fields.map((f: any) => f.id).filter((id: any) => typeof id === 'string');
      const duplicateFieldIds = findDuplicateIds(fieldIds);
      if (duplicateFieldIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate form field IDs found: ${duplicateFieldIds.join(', ')}`);
      }

      exam.form_fields.forEach((field: any, fIndex: number) => {
        if (typeof field.id !== 'string') {
          errors.push(`Exam ${index}, Field ${fIndex}: Missing "id"`);
        }
        if (typeof field.type !== 'string') {
          errors.push(`Exam ${index}, Field ${fIndex}: Missing "type"`);
        }
        if (field.is_editable === true && field.validation) {
          if (!field.validation.correct_value && !field.validation.acceptable_values) {
            errors.push(`Exam ${index}, Field ${fIndex}: Editable field must have validation with correct_value or acceptable_values`);
          }
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Listening Part 1 structure
 */
export const validateA1ListeningPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.section_details || typeof data.section_details !== 'object') {
    errors.push('Missing or invalid "section_details" object');
  }

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: errors.length === 0, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.audio_url !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "audio_url"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (!Array.isArray(q.options)) {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "options" array`);
        } else {
          q.options.forEach((opt: any, optIndex: number) => {
            if (typeof opt.text !== 'string') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "text"`);
            }
            if (typeof opt.is_correct !== 'boolean') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "is_correct" boolean`);
            }
          });
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Listening Part 2 structure
 */
export const validateA1ListeningPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.section_details || typeof data.section_details !== 'object') {
    errors.push('Missing or invalid "section_details" object');
  }

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: errors.length === 0, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.audio_url !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "audio_url"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (typeof q.is_correct !== 'boolean') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "is_correct" boolean`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Listening Part 3 structure
 */
export const validateA1ListeningPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.section_details || typeof data.section_details !== 'object') {
    errors.push('Missing or invalid "section_details" object');
  }

  if (!data.exams || !Array.isArray(data.exams)) {
    errors.push('Missing or invalid "exams" array');
    return { valid: errors.length === 0, errors };
  }

  // Check for duplicate exam IDs
  const examIds = data.exams.map((exam: any) => exam.id).filter((id: any) => typeof id === 'number');
  const duplicateExamIds = findDuplicateIds(examIds);
  if (duplicateExamIds.length > 0) {
    errors.push(`Duplicate exam IDs found: ${duplicateExamIds.join(', ')}`);
  }

  data.exams.forEach((exam: any, index: number) => {
    if (typeof exam.id !== 'number') {
      errors.push(`Exam ${index}: Missing or invalid "id"`);
    }
    if (typeof exam.title !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "title"`);
    }
    if (typeof exam.audio_url !== 'string') {
      errors.push(`Exam ${index}: Missing or invalid "audio_url"`);
    }
    if (!Array.isArray(exam.questions)) {
      errors.push(`Exam ${index}: Missing or invalid "questions" array`);
    } else {
      // Check for duplicate question IDs within this exam
      const questionIds = exam.questions.map((q: any) => q.id).filter((id: any) => typeof id === 'number');
      const duplicateQuestionIds = findDuplicateIds(questionIds);
      if (duplicateQuestionIds.length > 0) {
        errors.push(`Exam ${index}: Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
      }

      exam.questions.forEach((q: any, qIndex: number) => {
        if (typeof q.id !== 'number') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "id"`);
        }
        if (typeof q.question !== 'string') {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "question" text`);
        }
        if (!Array.isArray(q.options)) {
          errors.push(`Exam ${index}, Question ${qIndex}: Missing "options" array`);
        } else {
          q.options.forEach((opt: any, optIndex: number) => {
            if (typeof opt.text !== 'string') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "text"`);
            }
            if (typeof opt.is_correct !== 'boolean') {
              errors.push(`Exam ${index}, Question ${qIndex}, Option ${optIndex}: Missing "is_correct" boolean`);
            }
          });
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Speaking Part 1 structure
 */
export const validateA1SpeakingPart1 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.instructions || typeof data.instructions !== 'object') {
    errors.push('Missing or invalid "instructions" object');
  }

  if (!data.study_material || typeof data.study_material !== 'object') {
    errors.push('Missing or invalid "study_material" object');
    return { valid: errors.length === 0, errors };
  }

  const studyMaterial = data.study_material;
  
  if (!Array.isArray(studyMaterial.template_keywords)) {
    errors.push('Missing or invalid "study_material.template_keywords" array');
  }

  if (!studyMaterial.example_monologue || typeof studyMaterial.example_monologue !== 'object') {
    errors.push('Missing or invalid "study_material.example_monologue" object');
  } else if (!Array.isArray(studyMaterial.example_monologue.text_segments)) {
    errors.push('Missing or invalid "study_material.example_monologue.text_segments" array');
  }

  if (!studyMaterial.example_interaction || typeof studyMaterial.example_interaction !== 'object') {
    errors.push('Missing or invalid "study_material.example_interaction" object');
  } else if (!Array.isArray(studyMaterial.example_interaction.dialogue)) {
    errors.push('Missing or invalid "study_material.example_interaction.dialogue" array');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Speaking Part 2 structure
 */
export const validateA1SpeakingPart2 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.instructions || typeof data.instructions !== 'object') {
    errors.push('Missing or invalid "instructions" object');
  }

  if (!data.simulation_data || typeof data.simulation_data !== 'object') {
    errors.push('Missing or invalid "simulation_data" object');
    return { valid: errors.length === 0, errors };
  }

  const simData = data.simulation_data;

  if (typeof simData.topic !== 'string') {
    errors.push('Missing or invalid "simulation_data.topic"');
  }

  if (!Array.isArray(simData.cards)) {
    errors.push('Missing or invalid "simulation_data.cards" array');
  } else {
    // Check for duplicate card IDs
    const cardIds = simData.cards.map((card: any) => card.id).filter((id: any) => typeof id === 'string');
    const duplicateCardIds = findDuplicateIds(cardIds);
    if (duplicateCardIds.length > 0) {
      errors.push(`Duplicate card IDs found: ${duplicateCardIds.join(', ')}`);
    }

    simData.cards.forEach((card: any, index: number) => {
      if (typeof card.id !== 'string') {
        errors.push(`Card ${index}: Missing "id"`);
      }
      if (typeof card.word !== 'string') {
        errors.push(`Card ${index}: Missing "word"`);
      }
      if (typeof card.image_icon !== 'string') {
        errors.push(`Card ${index}: Missing "image_icon"`);
      }
    });
  }

  if (!simData.example_dialogue || typeof simData.example_dialogue !== 'object') {
    errors.push('Missing or invalid "simulation_data.example_dialogue" object');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate A1 Speaking Part 3 structure
 */
export const validateA1SpeakingPart3 = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.instructions || typeof data.instructions !== 'object') {
    errors.push('Missing or invalid "instructions" object');
  }

  if (!data.simulation_data || typeof data.simulation_data !== 'object') {
    errors.push('Missing or invalid "simulation_data" object');
    return { valid: errors.length === 0, errors };
  }

  const simData = data.simulation_data;

  if (!Array.isArray(simData.cards_deck)) {
    errors.push('Missing or invalid "simulation_data.cards_deck" array');
  } else {
    // Check for duplicate card IDs
    const cardIds = simData.cards_deck.map((card: any) => card.id).filter((id: any) => typeof id === 'string');
    const duplicateCardIds = findDuplicateIds(cardIds);
    if (duplicateCardIds.length > 0) {
      errors.push(`Duplicate card IDs found: ${duplicateCardIds.join(', ')}`);
    }

    simData.cards_deck.forEach((card: any, index: number) => {
      if (typeof card.id !== 'string') {
        errors.push(`Card ${index}: Missing "id"`);
      }
      if (typeof card.image_url !== 'string') {
        errors.push(`Card ${index}: Missing "image_url"`);
      }
      if (typeof card.image_label !== 'string') {
        errors.push(`Card ${index}: Missing "image_label"`);
      }
      if (typeof card.image_description !== 'string') {
        errors.push(`Card ${index}: Missing "image_description"`);
      }
      if (typeof card.example_request !== 'string') {
        errors.push(`Card ${index}: Missing "example_request"`);
      }
      if (!Array.isArray(card.expected_keywords)) {
        errors.push(`Card ${index}: Missing "expected_keywords" array`);
      }
    });
  }

  if (!simData.example_scenario || typeof simData.example_scenario !== 'object') {
    errors.push('Missing or invalid "simulation_data.example_scenario" object');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Main validator that routes to specific validators based on document ID and level
 * @param docId - The document identifier (e.g., 'speaking-part1', 'grammar-part1')
 * @param data - The parsed JSON data to validate
 * @param level - The exam level ('B1' or 'B2'), defaults to 'B1' for backward compatibility
 * @returns ValidationResult with valid flag and any errors found
 */
export const validateDocument = (docId: string, data: any, level: 'B1' | 'B2' | 'A1' = 'B1'): ValidationResult => {
  try {
    // First check if data is valid JSON
    if (typeof data !== 'object' || data === null) {
      return { valid: false, errors: ['Invalid JSON structure'] };
    }

    if (level === 'A1') {
      switch (docId) {
        case 'reading-part1':
          return validateA1ReadingPart1(data);
        case 'reading-part2':
          return validateA1ReadingPart2(data);
        case 'reading-part3':
          return validateA1ReadingPart3(data);
        case 'writing-part1':
          return validateA1WritingPart1(data);
        case 'writing-part2':
          return validateA1WritingPart2(data);
        case 'listening-part1':
          return validateA1ListeningPart1(data);
        case 'listening-part2':
          return validateA1ListeningPart2(data);
        case 'listening-part3':
          return validateA1ListeningPart3(data);
        case 'speaking-part1':            
          return validateA1SpeakingPart1(data);
        case 'speaking-part2':
          return validateA1SpeakingPart2(data);
        case 'speaking-part3':
          return validateA1SpeakingPart3(data);
        case 'listening-practice':
          return  validateListeningPractice(data);
        default:
          return { valid: false, errors: [`Unknown document type: ${docId}`] };
      }
    }


    // Route to specific validator based on document ID and level
    if (level === 'B2') {
      switch (docId) {
        case 'speaking-part1':
          return validateB2SpeakingPart1(data);
        case 'speaking-part2':
          return validateB2SpeakingPart2(data);
        case 'speaking-part3':
          return validateB2SpeakingPart3(data);
        case 'oral-exam-structure':
          return validateB2OralExamStructure(data);
        case 'speaking-important-phrases':
          return validateSpeakingImportantPhrases(data);
        case 'writing':
          return validateWriting(data);
        case 'listening-part1':
        case 'listening-part2':
        case 'listening-part3':
          return validateListeningPart(data);
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
        case 'exam-info':
          return validateExamInfo(data);
        case 'grammar-study-questions':
          return validateGrammarStudyQuestions(data);
        case 'listening-practice':
          return validateListeningPractice(data);
        default:
          return { valid: false, errors: [`Unknown B2 document type: ${docId}`] };
      }
    } else {
      // B1 validation
      switch (docId) {
        case 'grammar-part1':
          return validateGrammarPart1(data);
        case 'grammar-part2':
          return validateGrammarPart2(data);
        case 'grammar-study-questions':
          return validateGrammarStudyQuestions(data);
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
        case 'listening-practice':
          return validateListeningPractice(data);
        default:
          return { valid: false, errors: [`Unknown B1 document type: ${docId}`] };
      }
    }
  } catch (error: any) {
    return { valid: false, errors: [error.message || 'Validation error'] };
  }
};

