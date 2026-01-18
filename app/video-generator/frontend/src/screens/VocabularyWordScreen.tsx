import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAppConfig } from '../config/apps';
import { VocabularyWord } from '../types';
import SA from 'country-flag-icons/react/3x2/SA';
import FR from 'country-flag-icons/react/3x2/FR';
import ES from 'country-flag-icons/react/3x2/ES';
import RU from 'country-flag-icons/react/3x2/RU';
import './VocabularyWordScreen.css';

const VocabularyWordScreen: React.FC = () => {
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
          // Just resolve immediately after render
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
      <div className="screen vocabulary-word-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="screen vocabulary-word-screen">
        <div className="error">Word not found</div>
      </div>
    );
  }

  // Get article color class
  const getArticleColorClass = (article: string): string => {
    if (!article) return '';
    const normalizedArticle = article.toLowerCase();
    if (normalizedArticle === 'der') return 'article-der';
    if (normalizedArticle === 'die') return 'article-die';
    if (normalizedArticle === 'das') return 'article-das';
    return '';
  };

  return (
    <div className="screen vocabulary-word-screen">
      {/* Logo in top right */}
      <div className="screen-logo">
        <div className="logo-small">
          <img src={logoPath} alt={`${appConfig.level} TELC`} className="logo-small-image" />
        </div>
      </div>

      {/* Main content */}
      <div className="vocabulary-content">
        {/* Word type badge */}
        <div className="word-type-badge">
          {word.type}
        </div>

        {/* German word with article */}
        <div className="word-display">
          {word.article && (
            <span className={`article ${getArticleColorClass(word.article)}`}>
              {word.article}{' '}
            </span>
          )}
          <span className="word-text">{word.word}</span>
        </div>

        {/* English translation */}
        <div className="translation">
          {word.translations.en}
        </div>

        {/* Optional: Additional translations */}
        {word.translations.ar && (
          <div className="secondary-translation">
            <SA className="flag-icon" /> {word.translations.ar}
          </div>
        )}
        {word.translations.fr && (
          <div className="secondary-translation">
            <FR className="flag-icon" /> {word.translations.fr}
          </div>
        )}
        {word.translations.es && (
          <div className="secondary-translation">
            <ES className="flag-icon" /> {word.translations.es}
          </div>
        )}
        {word.translations.ru && (
          <div className="secondary-translation">
            <RU className="flag-icon" /> {word.translations.ru}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyWordScreen;

