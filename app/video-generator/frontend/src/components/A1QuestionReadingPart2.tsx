import React from 'react';
import { ReadingPart2A1Question } from '../types';
import { formatText } from '../utils/text-formatter';
import './A1QuestionReadingPart2.css';

interface A1QuestionReadingPart2Props {
  question: ReadingPart2A1Question;
  showAnswer?: boolean;
  title: string;
  description: string;
}

const A1QuestionReadingPart2: React.FC<A1QuestionReadingPart2Props> = ({ 
  question, 
  title,
  description,
  showAnswer = false 
}) => {
  const optionA = question.options[0];
  const optionB = question.options[1];

  return (
    <div className="question-content">
      {!showAnswer && <div className="question-header">
        <span className="question-title text-small">{title}</span>
        <br />
        <p className="question-description text-xsmall">{description}</p>
      </div>
      }
      
      <div className="situation-text text-heading">
        {question.situation}
      </div>

      <div className="options-container">
        <div className={`option-card option-a ${showAnswer ? (optionA.is_correct ? 'correct' : 'incorrect') : ''}`}>
          <div className="option-label text-body-large">A</div>
          <div className="option-text text-body">
            {formatText(optionA.text || optionA.option || '', {
              underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
              boldStyle: { fontWeight: 'bold' }
            })}
          </div>
          {showAnswer && optionA.is_correct && <div className="check-icon">✓</div>}
        </div>

        <div className={`option-card option-b ${showAnswer ? (optionB.is_correct ? 'correct' : 'incorrect') : ''}`}>
          <div className="option-label text-body-large">B</div>
          <div className="option-text text-body">
            {formatText(optionB.text || optionB.option || '', {
              underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
              boldStyle: { fontWeight: 'bold' }
            })}
          </div>
          {showAnswer && optionB.is_correct && <div className="check-icon">✓</div>}
        </div>
      </div>
    </div>
  );
};

export default A1QuestionReadingPart2;
