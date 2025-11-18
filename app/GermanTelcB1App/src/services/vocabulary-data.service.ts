/**
 * Vocabulary Data Service
 * 
 * Handles fetching vocabulary words from Firebase Firestore with cursor-based pagination.
 * Words are stored in collections like: vocabulary_data_german_a1
 */

import firestore from '@react-native-firebase/firestore';
import { activeExamConfig } from '../config/active-exam.config';
import { VocabularyWord } from '../types/vocabulary.types';

const BATCH_SIZE = 50; // Fetch words in batches

class VocabularyDataService {
  // Lazy-loaded to avoid initialization order issues
  private get collectionName(): string {
    return activeExamConfig.firebaseCollections.vocabularyData;
  }

  /**
   * Fetch vocabulary words with cursor-based pagination
   * @param startAfterDocId - Document ID to start after (for pagination)
   * @param limit - Number of words to fetch
   * @returns Object with words array, lastDocId for next pagination, and hasMore flag
   */
  async getVocabularyWords(
    startAfterDocId: string | null = null,
    limit: number = BATCH_SIZE
  ): Promise<{ words: VocabularyWord[]; lastDocId: string | null; hasMore: boolean }> {
    try {
      console.log(`[VocabularyDataService] Fetching words, startAfter: ${startAfterDocId}, limit: ${limit}`);
      
      // Build query with ordering by document ID
      let query = firestore()
        .collection(this.collectionName)
        .orderBy(firestore.FieldPath.documentId()) // Order by Firebase auto-generated ID
        .limit(limit + 1); // Fetch one extra to check if there's more

      // If we have a starting point, use cursor pagination
      if (startAfterDocId) {
        query = query.startAfter(startAfterDocId);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log(`[VocabularyDataService] No words found`);
        return { words: [], lastDocId: null, hasMore: false };
      }

      // Check if there are more documents beyond this batch
      const hasMore = snapshot.docs.length > limit;
      const docsToProcess = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

      const words: VocabularyWord[] = docsToProcess.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // Firebase document ID
          word: data.word,
          article: data.article || '',
          translations: data.translations || {},
          type: data.type || 'other',
          exampleSentences: data.exampleSentences || [],
        } as VocabularyWord;
      });

      // Get the last document ID for next pagination
      const lastDocId = docsToProcess.length > 0 
        ? docsToProcess[docsToProcess.length - 1].id 
        : null;

      console.log(`[VocabularyDataService] Fetched ${words.length} words, hasMore: ${hasMore}, lastDocId: ${lastDocId}`);

      return { words, lastDocId, hasMore };
    } catch (error) {
      console.error('[VocabularyDataService] Error fetching vocabulary words:', error);
      return { words: [], lastDocId: null, hasMore: false };
    }
  }

  /**
   * Fetch new words that haven't been studied yet
   * Automatically handles pagination to find enough unstudied words
   * @param studiedWordIds - Set of word IDs that have been studied
   * @param limit - Number of new words needed
   * @returns Array of unstudied words
   */
  async getNewWords(
    studiedWordIds: Set<string>,
    limit: number
  ): Promise<VocabularyWord[]> {
    try {
      const newWords: VocabularyWord[] = [];
      let lastDocId: string | null = null;
      let hasMore = true;
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loops

      console.log(`[VocabularyDataService] Finding ${limit} new words (${studiedWordIds.size} already studied)`);

      // Keep fetching batches until we have enough new words or run out of documents
      while (newWords.length < limit && hasMore && attempts < maxAttempts) {
        attempts++;
        
        const { words, lastDocId: newLastDocId, hasMore: moreAvailable } = 
          await this.getVocabularyWords(lastDocId, BATCH_SIZE);

        // Filter out studied words
        const unstudiedWords = words.filter(word => !studiedWordIds.has(word.id));
        newWords.push(...unstudiedWords);

        lastDocId = newLastDocId;
        hasMore = moreAvailable;

        console.log(`[VocabularyDataService] Batch ${attempts}: fetched ${words.length}, found ${unstudiedWords.length} new, total: ${newWords.length}/${limit}`);
      }

      // Return only the requested number
      const result = newWords.slice(0, limit);
      console.log(`[VocabularyDataService] Returning ${result.length} new words`);
      
      return result;
    } catch (error) {
      console.error('[VocabularyDataService] Error getting new words:', error);
      return [];
    }
  }

  /**
   * Fetch a single word by ID (Firebase document ID)
   * @param wordId - The Firebase document ID
   * @returns The vocabulary word or null
   */
  async getWordById(wordId: string): Promise<VocabularyWord | null> {
    try {
      console.log(`[VocabularyDataService] Fetching word by ID: ${wordId}`);
      
      const doc = await firestore()
        .collection(this.collectionName)
        .doc(wordId)
        .get();

      if (!doc.exists) {
        console.log(`[VocabularyDataService] Word not found: ${wordId}`);
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      return {
        id: doc.id,
        word: data.word,
        article: data.article || '',
        translations: data.translations || {},
        type: data.type || 'other',
        exampleSentences: data.exampleSentences || [],
      } as VocabularyWord;
    } catch (error) {
      console.error(`[VocabularyDataService] Error fetching word ${wordId}:`, error);
      return null;
    }
  }

  /**
   * Get total count of vocabulary words
   * Note: This fetches all documents to count them. For large collections,
   * consider storing the count in a separate metadata document.
   * @returns Total number of words available
   */
  async getTotalWordCount(): Promise<number> {
    try {
      console.log(`[VocabularyDataService] Fetching total word count from Firestore`);
      
      const snapshot = await firestore()
        .collection(this.collectionName)
        .get();
      
      const count = snapshot.size;
      console.log(`[VocabularyDataService] Total word count: ${count}`);

      return count;
    } catch (error) {
      console.error('[VocabularyDataService] Error getting word count:', error);
      return 0;
    }
  }
}

export default new VocabularyDataService();

