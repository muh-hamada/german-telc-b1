import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig } from '../config/apps';
import { VocabularyWord } from '../types';
import './VocabularyExampleScreen.css';

const VocabularyExampleScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const wordId = searchParams.get('wordId') || '';
  const isCapture = searchParams.get('capture') === 'true';

  const [word, setWord] = useState<VocabularyWord | null>(null);
  const [loading, setLoading] = useState(true);

  const appConfig = getAppConfig(appId);
  
  // Generate logo path based on language and level
  const logoPath = `/src/assets/${appConfig.language.toLowerCase()}-${appConfig.level.toLowerCase()}-logo.png`;

  useEffect(() => {
    if (isCapture) {
      (window as any).seekTo = () => {
        return new Promise<void>((resolve) => {
          // For vocabulary screens, no animation needed
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
    const fetchWord = async () => {
      try {
        const vocabularyCollection = appConfig.vocabularyCollection || `vocabulary_data_${appId.replace('-', '_')}`;
        console.log('Fetching from collection:', vocabularyCollection);
        console.log('Word ID:', wordId);
        
        const docRef = doc(db, vocabularyCollection, wordId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const wordData = docSnap.data() as VocabularyWord;
          console.log('Word data:', wordData);
          setWord(wordData);
        } else {
          console.error(`Word ${wordId} not found in collection:`, vocabularyCollection);
        }
      } catch (error) {
        console.error('Error fetching word:', error);
      } finally {
        setLoading(false);
        (window as any).screenReady = true;
      }
    };

    if (wordId) {
      fetchWord();
    } else {
      setLoading(false);
      (window as any).screenReady = true;
    }
  }, [appId, wordId, appConfig.vocabularyCollection]);

  if (loading) {
    return (
      <div className="screen vocabulary-example-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!word || !word.exampleSentences || word.exampleSentences.length === 0) {
    return (
      <div className="screen vocabulary-example-screen">
        <div className="error">Example not found</div>
      </div>
    );
  }

  const exampleSentence = word.exampleSentences[0];

  // Highlight the word in the sentence
  const highlightWord = (sentence: string, targetWord: string): JSX.Element => {
    const withoutDotAtTheEnd = sentence.replace(/\.$/, '');
    const regex = new RegExp(`(${targetWord})`, 'gi');
    const parts = withoutDotAtTheEnd.split(regex);

    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} className="highlighted-word">{part}</span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="screen vocabulary-example-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <img src={logoPath} alt={`${appConfig.level} TELC`} className="logo-small-image" />
        </div>
      </div>

      {/* Main content */}
      <div className="example-content">
        {/* Label */}
        <div className="example-label">
          Example Sentence
        </div>

        {/* German sentence with highlighted word */}
        <div className="sentence-display">
          {highlightWord(exampleSentence.text, word.word)}
        </div>

        {/* English translation */}
        <div className="sentence-translation">
          {exampleSentence.translations.en}
        </div>
      </div>
    </div>
  );
};

export default VocabularyExampleScreen;

