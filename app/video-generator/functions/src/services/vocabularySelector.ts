import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAppConfig } from '../config/apps';
import { VocabularyWord, VocabularyData } from '../types';
import { generateAndUploadVocabularyAudio, VocabularyAudioUrls } from './audioService';

/**
 * Extract the base word from compound vocabulary entries
 * Examples:
 * - "Profisportler, -die Profisportlerin, -nen" → "Profisportler"
 * - "Junge, -n (D) ! A, CH: Bub" → "Junge"
 * - "Haus" → "Haus"
 */
function extractBaseWord(word: string): string {
  // Split by comma and take the first part, then trim
  return word.split(',')[0].trim();
}

/**
 * Select the next unprocessed vocabulary word for video generation
 */
export async function selectNextVocabularyWord(appId: string): Promise<VocabularyData | null> {
  const db = admin.firestore();
  const appConfig = getAppConfig(appId);
  
  if (!appConfig.vocabularyCollection) {
    throw new Error(`Vocabulary collection not configured for app: ${appId}`);
  }

  console.log(`Selecting next vocabulary word for ${appId}...`);
  console.log(`Vocabulary collection: ${appConfig.vocabularyCollection}`);

  // Get processed vocabulary words
  const trackingDocRef = db.collection('video_generation_data').doc(appId);
  const trackingDoc = await trackingDocRef.get();
  
  const processedVocabulary = trackingDoc.exists 
    ? (trackingDoc.data()?.processed_vocabulary || {})
    : {};
  
  const processedWordIds = Object.keys(processedVocabulary);
  console.log(`Found ${processedWordIds.length} processed vocabulary words`);

  // Get all vocabulary words
  const vocabularySnapshot = await db.collection(appConfig.vocabularyCollection).get();
  
  if (vocabularySnapshot.empty) {
    console.log('No vocabulary words found in collection');
    return null;
  }

  console.log(`Found ${vocabularySnapshot.size} total vocabulary words`);

  // Find first unprocessed word
  for (const doc of vocabularySnapshot.docs) {
    const wordId = doc.id;
    
    if (!processedWordIds.includes(wordId)) {
      const wordData = doc.data() as VocabularyWord;
      
      // Validate word has required fields
      if (!wordData.word || !wordData.exampleSentences || wordData.exampleSentences.length === 0) {
        console.log(`Skipping word ${wordId} - missing required fields`);
        continue;
      }

      console.log(`Selected unprocessed word: ${wordData.word} (ID: ${wordId})`);
      
      return {
        appId,
        wordId,
        word: wordData,
      };
    }
  }

  console.log('No unprocessed vocabulary words found');
  return null;
}

/**
 * Ensure vocabulary word has audio URLs, generate if missing
 * Returns the audio URLs
 */
export async function ensureVocabularyAudioExists(
  vocabularyData: VocabularyData
): Promise<VocabularyAudioUrls> {
  const db = admin.firestore();
  const { appId, wordId, word } = vocabularyData;
  const appConfig = getAppConfig(appId);

  // Check if audio URLs already exist
  if (word.audioUrls && word.audioUrls.word && word.audioUrls.exampleSentence) {
    console.log(`Audio already exists for word: ${word.word}`);
    return word.audioUrls;
  }

  // Generate audio
  console.log(`Generating audio for word: ${word.word}`);
  
  const languageCode = appConfig.ttsLanguageCode || 'de-DE';
  const exampleSentence = word.exampleSentences[0].text;
  const wordText = extractBaseWord(word.word);

  const audioUrls = await generateAndUploadVocabularyAudio(
    appId,
    wordId,
    wordText,
    word.article,
    exampleSentence,
    languageCode
  );

  // Update Firestore with audio URLs
  if (appConfig.vocabularyCollection) {
    await db.collection(appConfig.vocabularyCollection).doc(wordId).update({
      audioUrls,
      audioGeneratedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Updated Firestore with audio URLs for word: ${word.word}`);
  }

  return audioUrls;
}

/**
 * Get a specific vocabulary word by ID
 */
export async function getVocabularyWord(
  appId: string,
  wordId: string
): Promise<VocabularyData | null> {
  const db = admin.firestore();
  const appConfig = getAppConfig(appId);
  
  if (!appConfig.vocabularyCollection) {
    throw new Error(`Vocabulary collection not configured for app: ${appId}`);
  }

  const docRef = db.collection(appConfig.vocabularyCollection).doc(wordId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const wordData = doc.data() as VocabularyWord;
  
  return {
    appId,
    wordId,
    word: wordData,
  };
}

