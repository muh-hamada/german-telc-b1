import React from 'react';
import DeleSpeakingPart1UI from './DeleSpeakingPart1UI';
import { DeleSpeakingTopic, UserAnswer } from '../../types/exam.types';

interface DeleSpeakingPart2UIProps {
  topic: DeleSpeakingTopic;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleSpeakingPart2UI: React.FC<DeleSpeakingPart2UIProps> = (props) => {
  return <DeleSpeakingPart1UI {...props} />;
};

export default DeleSpeakingPart2UI;
