import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig, getFirebaseCollection } from '../config/apps';
import { ReadingPart2A1Question } from '../types';
import { formatText } from '../utils/text-formatter';
import './QuestionScreen.css';

const QuestionScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const examId = parseInt(searchParams.get('examId') || '0');
  const questionIndex = parseInt(searchParams.get('questionIndex') || '0'); // Use index instead of ID
  const timerDuration = parseInt(searchParams.get('timer') || '10');

  const [question, setQuestion] = useState<ReadingPart2A1Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(timerDuration);

  const appConfig = getAppConfig(appId);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const collectionName = getFirebaseCollection(appId);
        console.log('Fetching from collection:', collectionName);
        console.log('Looking for examId:', examId, 'questionIndex:', questionIndex);
        
        const docRef = doc(collection(db, collectionName), 'reading-part2');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Document data:', data);
          
          // The exams are nested inside data.data
          const exams = data.data?.exams || data.exams || [];
          console.log('Number of exams:', exams.length);
          
          const exam = exams.find((e: any) => e.id === examId);
          console.log('Found exam:', exam);
          
          if (exam && exam.questions && exam.questions[questionIndex]) {
            const q = exam.questions[questionIndex]; // Get question by index
            console.log('Found question:', q);
            if (q) {
              setQuestion(q);
            }
          } else {
            console.error('Question not found at index:', questionIndex);
            console.log('Available questions:', exam?.questions);
          }
        } else {
          console.error('Document reading-part2 does not exist in collection:', collectionName);
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

  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, loading]);

  if (loading) {
    return (
      <div className="screen question-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="screen question-screen">
        <div className="error">Question not found</div>
      </div>
    );
  }

  const optionA = question.options[0];
  const optionB = question.options[1];

  return (
    <div className="screen question-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <span className="logo-small-text">{appConfig.level}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="timer-container">
        <div className="timer-circle">
          <svg width="120" height="120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#667eea"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / timerDuration)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-text">{countdown}</div>
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
          <div className="option-card option-a">
            <div className="option-label">A</div>
            <div className="option-text">
              {formatText(optionA.text || optionA.option || '', {
                underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
                boldStyle: { fontWeight: 'bold' }
              })}
            </div>
          </div>

          <div className="option-card option-b">
            <div className="option-label">B</div>
            <div className="option-text">
              {formatText(optionB.text || optionB.option || '', {
                underlineStyle: { textDecoration: 'underline', fontWeight: '600' },
                boldStyle: { fontWeight: 'bold' }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;

