import React from 'react';
import WritingUI from './WritingUI';
import { DeleWritingExam, UserAnswer } from '../../types/exam.types';

interface DeleWritingPart1UIProps {
  exam: DeleWritingExam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
  isMockExam?: boolean;
}

const DeleWritingPart1UI: React.FC<DeleWritingPart1UIProps> = ({ exam, onComplete, isMockExam = false }) => {
  // Convert DELE exam format to WritingExam format expected by WritingUI
  const adaptedExam = {
    id: Number.parseInt(exam.id.slice(0, 8), 16), // Convert UUID to number
    title: exam.title,
    incomingEmail: exam.incomingEmail,
    writingPoints: exam.writingPoints,
    modalAnswer: exam.modalAnswer,
  };

  return <WritingUI exam={adaptedExam} onComplete={onComplete} isMockExam={isMockExam} />;
};

export default DeleWritingPart1UI;
