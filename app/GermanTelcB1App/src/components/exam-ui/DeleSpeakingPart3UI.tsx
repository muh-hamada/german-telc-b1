import React from 'react';
import DeleSpeakingPart1UI from './DeleSpeakingPart1UI';
import { DeleSpeakingTopic, UserAnswer } from '../../types/exam.types';

interface DeleSpeakingPart3UIProps {
  topic: DeleSpeakingTopic;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleSpeakingPart3UI: React.FC<DeleSpeakingPart3UIProps> = (props) => {
  return <DeleSpeakingPart1UI {...props} />;
};

export default DeleSpeakingPart3UI;
