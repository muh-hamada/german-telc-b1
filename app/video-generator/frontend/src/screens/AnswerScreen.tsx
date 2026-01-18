import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig, getFirebaseCollection, questionTexts } from '../config/apps';
import { ReadingPart2A1Question, ReadingPart3A1Question } from '../types';
import A1QuestionReadingPart2 from '../components/A1QuestionReadingPart2';
import A1QuestionReadingPart3 from '../components/A1QuestionReadingPart3';
import './AnswerScreen.css';

const AnswerScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const examId = parseInt(searchParams.get('examId') || '0');
  const questionIndex = parseInt(searchParams.get('questionIndex') || '0'); // Use index instead of ID
  const docName = searchParams.get('doc') || 'reading-part2';
  const isCapture = searchParams.get('capture') === 'true';

  const [question, setQuestion] = useState<ReadingPart2A1Question | ReadingPart3A1Question | null>(null);
  const [loading, setLoading] = useState(true);

  const appConfig = getAppConfig(appId);
  
  // Generate logo path based on language and level
  const logoPath = `/src/assets/${appConfig.language.toLowerCase()}-${appConfig.level.toLowerCase()}-logo.png`;

  useEffect(() => {
    if (isCapture) {
      (window as any).seekTo = (timeInMs: number) => {
        return new Promise<void>((resolve) => {
          document.getAnimations().forEach(anim => {
            anim.pause();
            anim.currentTime = timeInMs;
          });
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };
    }
  }, [isCapture]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const collectionName = getFirebaseCollection(appId);
        const docRef = doc(collection(db, collectionName), docName);
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
  }, [appId, examId, questionIndex, docName]);

  if (loading) {
    return (
      <div className="screen answer-screen">
        <div className="loading text-body-large">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="screen answer-screen">
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
          return <A1QuestionReadingPart2 question={question as ReadingPart2A1Question} showAnswer={true} title={texts.title} description={texts.description} />;
        }
        // Add other levels here
        return <div className="error text-body-large">Level {level} not supported for {docName}</div>;
      
      case 'reading-part3':
        if (level === 'A1') {
          return <A1QuestionReadingPart3 question={question as ReadingPart3A1Question} showAnswer={true} title={texts.title} description={texts.description} />;
        }
        return <div className="error text-body-large">Level {level} not supported for {docName}</div>;
      
      default:
        return <div className="error text-body-large">Question type {docName} not supported</div>;
    }
  };

  const getCorrectOptionText = () => {
    if (docName === 'reading-part3') {
      const q = question as ReadingPart3A1Question;
      return q.is_correct ? 'Richtig' : 'Falsch';
    } else {
      const q = question as ReadingPart2A1Question;
      const optionA = q.options[0];
      return optionA.is_correct ? 'A' : 'B';
    }
  };

  const correctOption = getCorrectOptionText();

  return (
    <div className="screen answer-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <img src={logoPath} alt={`${appConfig.level} TELC`} className="logo-small-image" />
        </div>
      </div>

      {/* Answer Badge */}
      <div className="answer-badge-container">
        <div className="answer-badge">
          <span className="checkmark text-heading">✓</span>
          <span className="answer-text text-badge">Correct Answer: {correctOption}</span>
        </div>
      </div>

      {/* Question Content */}
      {renderQuestion()}
    </div>
  );
};

export default AnswerScreen;

