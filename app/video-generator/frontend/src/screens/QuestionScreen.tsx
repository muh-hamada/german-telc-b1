import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig, getFirebaseCollection } from '../config/apps';
import { ReadingPart2A1Question } from '../types';
import A1QuestionReadingPart2 from '../components/A1QuestionReadingPart2';
import logoImage from '../assets/logo.jpg';
import './QuestionScreen.css';
import { questionTexts } from '../config/apps';

const QuestionScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const examId = parseInt(searchParams.get('examId') || '0');
  const questionIndex = parseInt(searchParams.get('questionIndex') || '0');
  const timerDuration = parseInt(searchParams.get('timer') || '10');
  const docName = searchParams.get('doc') || 'reading-part2';

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
        
        const docRef = doc(collection(db, collectionName), docName);
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
          console.error(`Document ${docName} does not exist in collection:`, collectionName);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
        (window as any).screenReady = true;
      }
    };

    fetchQuestion();
  }, [appId, examId, questionIndex, docName]);

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
        <div className="loading text-body-large">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="screen question-screen">
        <div className="error text-body-large">Question not found</div>
      </div>
    );
  }

  // Generic component selection based on level and docName
  const renderQuestion = () => {
    const level = appConfig.level; // e.g. "A1"
    const texts = questionTexts[appId][docName];
    
    switch (docName) {
      case 'reading-part2':
        if (level === 'A1') {
          return <A1QuestionReadingPart2 question={question} showAnswer={false} title={texts.title} description={texts.description} />;
        }
        // Add other levels here as they are implemented
        return <div className="error text-body-large">Level {level} not supported for {docName}</div>;
      
      default:
        return <div className="error text-body-large">Question type {docName} not supported</div>;
    }
  };

  return (
    <div className="screen question-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <img src={logoImage} alt={`${appConfig.level} TELC`} className="logo-small-image" />
        </div>
      </div>

      {/* Timer */}
      <div className="timer-container">
        <div className="timer-circle">
          <svg width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#667eea"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - countdown / timerDuration)}`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-text text-heading">{countdown}</div>
        </div>
      </div>

      {/* Question Content */}
      {renderQuestion()}
    </div>
  );
};

export default QuestionScreen;

