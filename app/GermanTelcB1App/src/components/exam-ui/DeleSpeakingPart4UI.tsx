import React from 'react';
import DeleSpeakingPart1UI from './DeleSpeakingPart1UI';
import { DeleSpeakingTopic, UserAnswer } from '../../types/exam.types';

interface DeleSpeakingPart4UIProps {
  topic: DeleSpeakingTopic;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleSpeakingPart4UI: React.FC<DeleSpeakingPart4UIProps> = (props) => {
  return <DeleSpeakingPart1UI {...props} />;
};

export default DeleSpeakingPart4UI;
