import React from 'react';
import { ReadingPart3A1Question } from '../types';
import { formatText } from '../utils/text-formatter';
import './A1QuestionReadingPart3.css';

interface A1QuestionReadingPart3Props {
  question: ReadingPart3A1Question;
  showAnswer?: boolean;
  title: string;
  description: string;
}

const A1QuestionReadingPart3: React.FC<A1QuestionReadingPart3Props> = ({ 
  question, 
  title,
  description,
  showAnswer = false 
}) => {
  return (
    <div className="question-content">
      {!showAnswer && <div className="question-header">
        <span className="question-title text-small">{title}</span>
        <br />
        <p className="question-description text-xsmall">{description}</p>
      </div>
      }
      
      <div className="reading-text-card">
        <div className="reading-text text-body-large">
          {formatText(question.text, {
            underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
            boldStyle: { fontWeight: 'bold' }
          })}
        </div>
      </div>

      <div className="statement-card text-heading">
        {question.question}
      </div>

      <div className="options-container horizontal">
        <div className={`option-card-small ${showAnswer ? (question.is_correct ? 'correct' : 'incorrect') : ''}`}>
          <div className="option-label-small text-body-large">Richtig</div>
          {showAnswer && question.is_correct && <div className="check-icon-small">✓</div>}
        </div>

        <div className={`option-card-small ${showAnswer ? (!question.is_correct ? 'correct' : 'incorrect') : ''}`}>
          <div className="option-label-small text-body-large">Falsch</div>
          {showAnswer && !question.is_correct && <div className="check-icon-small">✓</div>}
        </div>
      </div>
    </div>
  );
};

export default A1QuestionReadingPart3;

