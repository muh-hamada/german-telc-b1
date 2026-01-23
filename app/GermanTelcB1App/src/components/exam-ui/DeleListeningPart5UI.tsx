import React from 'react';
import DeleListeningUI from './DeleListeningUI';
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';

interface DeleListeningPart5UIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart5UI: React.FC<DeleListeningPart5UIProps> = (props) => {
  return <DeleListeningUI {...props} part={5} />;
};

export default DeleListeningPart5UI;
