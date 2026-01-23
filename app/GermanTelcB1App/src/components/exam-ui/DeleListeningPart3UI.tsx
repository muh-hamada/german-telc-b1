import React from 'react';
import DeleListeningUI from './DeleListeningUI';
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';

interface DeleListeningPart3UIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart3UI: React.FC<DeleListeningPart3UIProps> = (props) => {
  return <DeleListeningUI {...props} part={3} />;
};

export default DeleListeningPart3UI;
