import React from 'react';
import DeleListeningUI from './DeleListeningUI';
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';

interface DeleListeningPart4UIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart4UI: React.FC<DeleListeningPart4UIProps> = (props) => {
  return <DeleListeningUI {...props} part={4} />;
};

export default DeleListeningPart4UI;
