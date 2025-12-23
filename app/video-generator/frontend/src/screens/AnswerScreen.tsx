import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig, getFirebaseCollection } from '../config/apps';
import { ReadingPart2A1Question } from '../types';
import { formatText } from '../utils/text-formatter';
import './AnswerScreen.css';

const AnswerScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const examId = parseInt(searchParams.get('examId') || '0');
  const questionIndex = parseInt(searchParams.get('questionIndex') || '0'); // Use index instead of ID

  const [question, setQuestion] = useState<ReadingPart2A1Question | null>(null);
  const [loading, setLoading] = useState(true);

  const appConfig = getAppConfig(appId);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const collectionName = getFirebaseCollection(appId);
        const docRef = doc(collection(db, collectionName), 'reading-part2');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // The exams are nested inside data.data
          const exams = data.data?.exams || data.exams || [];
          const exam = exams.find((e: any) => e.id === examId);
          
          if (exam && exam.questions && exam.questions[questionIndex]) {
            const q = exam.questions[questionIndex]; // Get question by index
            if (q) {
              setQuestion(q);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
        (window as any).screenReady = true;
      }
    };

    fetchQuestion();
  }, [appId, examId, questionIndex]);

  if (loading) {
    return (
      <div className="screen answer-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="screen answer-screen">
        <div className="error">Question not found</div>
      </div>
    );
  }

  const optionA = question.options[0];
  const optionB = question.options[1];
  const correctOption = optionA.is_correct ? 'A' : 'B';

  return (
    <div className="screen answer-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <span className="logo-small-text">{appConfig.level}</span>
        </div>
      </div>

      {/* Answer Badge */}
      <div className="answer-badge-container">
        <div className="answer-badge">
          <span className="checkmark">✓</span>
          <span className="answer-text">Correct Answer: {correctOption}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="question-content">
        <div className="question-header">
          <span className="question-number">Question {questionIndex + 1}</span>
        </div>
        
        <div className="situation-text">
          {question.situation}
        </div>

        <div className="options-container">
          <div className={`option-card option-a ${optionA.is_correct ? 'correct' : 'incorrect'}`}>
            <div className="option-label">A</div>
            <div className="option-text">
              {formatText(optionA.text || optionA.option || '', {
                underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
                boldStyle: { fontWeight: 'bold' }
              })}
            </div>
            {optionA.is_correct && <div className="check-icon">✓</div>}
          </div>

          <div className={`option-card option-b ${optionB.is_correct ? 'correct' : 'incorrect'}`}>
            <div className="option-label">B</div>
            <div className="option-text">
              {formatText(optionB.text || optionB.option || '', {
                underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
                boldStyle: { fontWeight: 'bold' }
              })}
            </div>
            {optionB.is_correct && <div className="check-icon">✓</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerScreen;

