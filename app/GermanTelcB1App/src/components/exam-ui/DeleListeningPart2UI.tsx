import React from 'react';
import DeleListeningUI from './DeleListeningUI';
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';

interface DeleListeningPart2UIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart2UI: React.FC<DeleListeningPart2UIProps> = (props) => {
  return <DeleListeningUI {...props} part={2} />;
};

export default DeleListeningPart2UI;
