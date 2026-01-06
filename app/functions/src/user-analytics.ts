import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
// This is safe because:
// - Cloud Functions auto-initialize, but this ensures it works standalone
// - backfill.ts initializes BEFORE importing this file, so this won't run there
if (!admin.apps.length) {
  admin.initializeApp();
}

// Interfaces for Analytics Data
export interface AnalyticsData {
  totalUsers: number;
  platforms: { [key: string]: number };
  languages: { [key: string]: number };
  notifications: {
    enabled: number;
    disabled: number;
  };
  premium: {
    total: number;
    nonPremium: number;
  };
  personas: { [key: string]: number };
  vocabulary: {
    totalWordsStudied: number;
    totalMastered: number;
  };
  progress: {
    totalScore: number;
    examsCompleted: number;
  };
  streaks: {
    currentStreakDistribution: { [key: string]: number };
    longestStreakDistribution: { [key: string]: number };
    activeStreaks: number;
  };
  lastUpdated: admin.firestore.Timestamp;
}

// Factory function to create initial analytics state
// (Can't use Timestamp.now() at module load time - Firebase not initialized yet)
export function getInitialAnalytics(): AnalyticsData {
  return {
    totalUsers: 0,
    platforms: { ios: 0, android: 0, web: 0 },
    languages: { en: 0, de: 0, tr: 0, es: 0, fr: 0, it: 0, pl: 0, ru: 0, ar: 0 }, // Common languages
    notifications: { enabled: 0, disabled: 0 },
    premium: { total: 0, nonPremium: 0 },
    personas: { beginner: 0, casual: 0, serious: 0 },
    vocabulary: { totalWordsStudied: 0, totalMastered: 0 },
    progress: { totalScore: 0, examsCompleted: 0 },
    streaks: { currentStreakDistribution: {}, longestStreakDistribution: {}, activeStreaks: 0 },
    lastUpdated: admin.firestore.Timestamp.now(),
  };
}

/**
 * Helper to update analytics data safely using a transaction
 * This ensures consistency between the global aggregate and the daily snapshot
 */
async function updateAnalytics(
  appId: string,
  updateFn: (current: AnalyticsData) => AnalyticsData
) {
  const db = admin.firestore();
  const analyticsRef = db.collection('user_analytics').doc(appId);
  const today = new Date().toISOString().split('T')[0];
  const dailyRef = analyticsRef.collection('daily_snapshots').doc(today);

  await db.runTransaction(async (transaction) => {
    // 1. Read current global analytics
    const analyticsDoc = await transaction.get(analyticsRef);
    let currentData: AnalyticsData;

    if (!analyticsDoc.exists) {
      currentData = getInitialAnalytics();
    } else {
      currentData = analyticsDoc.data() as AnalyticsData;
    }

    // 2. Apply updates
    const updatedData = updateFn(currentData);
    updatedData.lastUpdated = admin.firestore.Timestamp.now();

    // 3. Write back to global doc
    transaction.set(analyticsRef, updatedData, { merge: true });

    // 4. Write to daily snapshot
    // We overwrite/set the daily snapshot with the NEW totals
    // This gives us the "state of the world" at the end of this day (so far)
    transaction.set(dailyRef, updatedData, { merge: true });
  });
}

// --- Trigger: User Profile Updates ---
// Monitors: users/{uid}
export const onUserUpdate = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Determine App ID. Try 'appId' field, fallback to 'german-b1' (default)
    const appId = after?.appId || before?.appId || 'german-b1';

    // Handle user deletion
    if (before && !after) {
      console.log(`[Analytics] User deleted: ${context.params.uid}, appId: ${appId}`);
      await updateAnalytics(appId, (data) => {
        // 1. Decrement Total Users
        if (data.totalUsers > 0) {
          data.totalUsers -= 1;
        }

        // 2. Decrement Platform Distribution
        const platform = before.platform?.toLowerCase();
        if (platform && data.platforms[platform] > 0) {
          data.platforms[platform]--;
        }

        // 3. Decrement Language Distribution
        const lang = before.preferences?.interfaceLanguage || 'en';
        if (data.languages[lang] > 0) {
          data.languages[lang]--;
        }

        // 4. Decrement Notification Status
        const wasEnabled = before.notificationSettings?.enabled && before.fcmToken;
        if (wasEnabled) {
          if (data.notifications.enabled > 0) data.notifications.enabled--;
        } else {
          if (data.notifications.disabled > 0) data.notifications.disabled--;
        }

        return data;
      });
      return; // Exit early after handling deletion
    }

    // Handle user creation and updates
    await updateAnalytics(appId, (data) => {
      // 1. Total Users (Count)
      if (!before && after) {
        data.totalUsers += 1;
      }

      // 2. Platform Distribution
      const oldPlatform = before?.platform?.toLowerCase();
      const newPlatform = after?.platform?.toLowerCase();
      if (oldPlatform !== newPlatform) {
        if (oldPlatform && data.platforms[oldPlatform] > 0) data.platforms[oldPlatform]--;
        if (newPlatform) {
          data.platforms[newPlatform] = (data.platforms[newPlatform] || 0) + 1;
        }
      }

      // 3. Language Distribution
      const oldLang = (before?.preferences?.interfaceLanguage || 'en');
      const newLang = (after?.preferences?.interfaceLanguage || 'en');
      if (oldLang !== newLang || (!before && after)) {
        if (before) {
          if (data.languages[oldLang] > 0) data.languages[oldLang]--;
        }
        data.languages[newLang] = (data.languages[newLang] || 0) + 1;
      }

      // 4. Notification Status
      // Logic: Enabled if settings.enabled AND fcmToken exists
      const wasEnabled = before?.notificationSettings?.enabled && before?.fcmToken;
      const isEnabled = after?.notificationSettings?.enabled && after?.fcmToken;

      if (wasEnabled !== isEnabled) {
        if (wasEnabled) {
          if (data.notifications.enabled > 0) data.notifications.enabled--;
          data.notifications.disabled++;
        }
        if (isEnabled) {
          data.notifications.enabled++;
          if (data.notifications.disabled > 0) data.notifications.disabled--;
        }
      } else if (!before && after) {
        // New user
        if (isEnabled) data.notifications.enabled++;
        else data.notifications.disabled++;
      }

      return data;
    });
  });

// --- Trigger: Vocabulary Progress ---
// Monitors: users/{uid}/vocabulary_progress_*/data
// We map the collection name to the App ID
const VOCAB_COLLECTIONS = {
  'vocabulary_progress_german_a1': 'german-a1',
  'vocabulary_progress_german_b1': 'german-b1',
  'vocabulary_progress_german_b2': 'german-b2',
  'vocabulary_progress_english_b1': 'english-b1',
  'vocabulary_progress_english_b2': 'english-b2',
};

export const onVocabularyUpdate = functions.firestore
  .document('users/{uid}/{collectionId}/{docId}')
  .onWrite(async (change, context) => {
    const { collectionId } = context.params;

    // Check if this is a vocabulary collection we care about
    const appId = VOCAB_COLLECTIONS[collectionId as keyof typeof VOCAB_COLLECTIONS];
    if (!appId) return; // Not a target collection

    // Only trigger on the main 'data' document to avoid subcollection noise if any
    if (context.params.docId !== 'data') return;

    const before = change.before.data();
    const after = change.after.data();

    // Handle deletion
    if (before && !after) {
      console.log(`[Analytics] Vocabulary data deleted for user: ${context.params.uid}, collection: ${collectionId}`);
      await updateAnalytics(appId, (data) => {
        // Decrement all vocabulary stats
        const oldWords = before.totalWordsStudied || 0;
        data.vocabulary.totalWordsStudied = Math.max(0, data.vocabulary.totalWordsStudied - oldWords);

        const oldMastered = before.wordsMastered || 0;
        data.vocabulary.totalMastered = Math.max(0, data.vocabulary.totalMastered - oldMastered);

        // Decrement persona
        const oldPersona = before.persona;
        if (oldPersona && data.personas[oldPersona] > 0) {
          data.personas[oldPersona]--;
        }

        return data;
      });
      return;
    }

    // Handle creation and updates
    await updateAnalytics(appId, (data) => {
      // 1. Words Studied
      const oldWords = before?.totalWordsStudied || 0;
      const newWords = after?.totalWordsStudied || 0;
      const wordsDiff = newWords - oldWords;
      data.vocabulary.totalWordsStudied += wordsDiff;

      // 2. Words Mastered
      const oldMastered = before?.wordsMastered || 0;
      const newMastered = after?.wordsMastered || 0;
      const masteredDiff = newMastered - oldMastered;
      data.vocabulary.totalMastered += masteredDiff;

      // 3. Persona Distribution
      const oldPersona = before?.persona;
      const newPersona = after?.persona;

      if (oldPersona !== newPersona) {
        if (oldPersona && data.personas[oldPersona] > 0) data.personas[oldPersona]--;
        if (newPersona) {
          data.personas[newPersona] = (data.personas[newPersona] || 0) + 1;
        }
      }

      return data;
    });
  });

// --- Trigger: Streak Updates ---
// Monitors: users/{uid}/streaks/{examId}
// Map examId (doc ID) to App ID. Usually examId IS the appId (e.g., 'german-b2')
export const onStreakUpdate = functions.firestore
  .document('users/{uid}/streaks/{streakId}')
  .onWrite(async (change, context) => {
    const { streakId } = context.params;
    // streakId is typically the appId/examId (e.g., 'german-b1', 'german-b2')
    // Verify if it's a valid app we want to track, or just track all
    const appId = streakId;

    const before = change.before.data();
    const after = change.after.data();

    // Handle deletion
    if (before && !after) {
      console.log(`[Analytics] Streak data deleted for user: ${context.params.uid}, appId: ${appId}`);
      await updateAnalytics(appId, (data) => {
        const oldCurrent = before.currentStreak || 0;
        const oldLongest = before.longestStreak || 0;

        // Remove from current streak distribution
        if (oldCurrent > 0) {
          const count = data.streaks.currentStreakDistribution[oldCurrent] || 0;
          if (count > 0) {
            data.streaks.currentStreakDistribution[oldCurrent] = count - 1;
          }
        }

        // Remove from longest streak distribution
        if (oldLongest > 0) {
          const count = data.streaks.longestStreakDistribution[oldLongest] || 0;
          if (count > 0) {
            data.streaks.longestStreakDistribution[oldLongest] = count - 1;
          }
        }

        // Decrement active streaks if user had an active streak
        if (oldCurrent > 0 && data.streaks.activeStreaks > 0) {
          data.streaks.activeStreaks--;
        }

        return data;
      });
      return;
    }

    // Handle creation and updates
    await updateAnalytics(appId, (data) => {
      const oldCurrent = before?.currentStreak || 0;
      const newCurrent = after?.currentStreak || 0;

      // Update Current Streak Distribution
      if (oldCurrent > 0) {
        const count = data.streaks.currentStreakDistribution[oldCurrent] || 0;
        if (count > 0) {
          data.streaks.currentStreakDistribution[oldCurrent] = count - 1;
        }
      }
      if (newCurrent > 0) {
        const count = data.streaks.currentStreakDistribution[newCurrent] || 0;
        data.streaks.currentStreakDistribution[newCurrent] = count + 1;
      }

      const oldLongest = before?.longestStreak || 0;
      const newLongest = after?.longestStreak || 0;

      // Update Longest Streak Distribution
      if (oldLongest > 0) {
        const count = data.streaks.longestStreakDistribution[oldLongest] || 0;
        if (count > 0) {
          data.streaks.longestStreakDistribution[oldLongest] = count - 1;
        }
      }
      if (newLongest > 0) {
        const count = data.streaks.longestStreakDistribution[newLongest] || 0;
        data.streaks.longestStreakDistribution[newLongest] = count + 1;
      }

      // Active Streaks Count (users with streak > 0)
      if (oldCurrent === 0 && newCurrent > 0) {
        data.streaks.activeStreaks++;
      } else if (oldCurrent > 0 && newCurrent === 0) {
        if (data.streaks.activeStreaks > 0) data.streaks.activeStreaks--;
      }

      return data;
    });
  });

// --- Trigger: Exam Progress Updates ---
// Monitors: 
// 1. users/{uid}/progress/data (German B1)
// 2. users/{uid}/german_b2_progress/data (German B2)
// 3. users/{uid}/english_b1_progress/data (English B1)
const PROGRESS_COLLECTIONS = {
  'progress': 'german-b1',
  'german_a1_progress': 'german-a1',
  'german_b2_progress': 'german-b2',
  'english_b1_progress': 'english-b1',
  'english_b2_progress': 'english-b2',
};

export const onProgressUpdate = functions.firestore
  .document('users/{uid}/{collectionId}/{docId}')
  .onWrite(async (change, context) => {
    const { collectionId } = context.params;
    const appId = PROGRESS_COLLECTIONS[collectionId as keyof typeof PROGRESS_COLLECTIONS];
    if (!appId) return;
    if (context.params.docId !== 'data') return;

    const before = change.before.data();
    const after = change.after.data();

    // Handle deletion
    if (before && !after) {
      console.log(`[Analytics] Progress data deleted for user: ${context.params.uid}, collection: ${collectionId}`);
      await updateAnalytics(appId, (data) => {
        // Decrement total score
        const oldScore = before.totalScore || 0;
        data.progress.totalScore = Math.max(0, data.progress.totalScore - oldScore);

        // Decrement completed exams
        const oldExams = (before.exams || []) as any[];
        const oldCompleted = oldExams.filter(e => e.completed).length;
        data.progress.examsCompleted = Math.max(0, data.progress.examsCompleted - oldCompleted);

        return data;
      });
      return;
    }

    // Handle creation and updates
    await updateAnalytics(appId, (data) => {
      // 1. Total Score
      const oldScore = before?.totalScore || 0;
      const newScore = after?.totalScore || 0;
      data.progress.totalScore += (newScore - oldScore);

      // 2. Completed Exams Count
      // We need to count how many exams have 'completed: true'
      // This is an array in 'exams' field.
      const oldExams = (before?.exams || []) as any[];
      const newExams = (after?.exams || []) as any[];

      const oldCompleted = oldExams.filter(e => e.completed).length;
      const newCompleted = newExams.filter(e => e.completed).length;

      data.progress.examsCompleted += (newCompleted - oldCompleted);

      return data;
    });
  });

// --- Trigger: Premium Status Updates ---
// Monitors: users/{uid}/premium/{examId}
// examId is typically the appId (e.g., 'german-b1', 'german-b2', 'english-b1')
export const onPremiumUpdate = functions.firestore
  .document('users/{uid}/premium/{examId}')
  .onWrite(async (change, context) => {
    const { examId } = context.params;
    // examId is the appId (e.g., 'german-b1', 'german-b2', 'english-b1')
    const appId = examId;

    const before = change.before.data();
    const after = change.after.data();

    // Handle deletion
    if (before && !after) {
      console.log(`[Analytics] Premium data deleted for user: ${context.params.uid}, appId: ${appId}`);
      const wasPremium = before.isPremium === true;
      
      if (!wasPremium) {
        // If the deleted document wasn't premium, no need to update analytics
        console.log(`[Analytics] Deleted premium document for non-premium user in ${appId}, skipping analytics update`);
        return;
      }
      
      await updateAnalytics(appId, (data) => {
        // Ensure premium object exists
        if (!data.premium) {
          data.premium = { total: 0, nonPremium: 0 };
        }

        // User had premium, decrement premium count
        const oldTotal = data.premium.total;
        if (oldTotal > 0) {
          data.premium.total--;
          console.log(`[Analytics] Decremented premium count for ${appId}: ${oldTotal} -> ${data.premium.total}`);
        } else {
          console.warn(`[Analytics] Attempted to decrement premium count for ${appId} but count was already 0. This may indicate a data inconsistency.`);
        }

        return data;
      });
      return;
    }

    const wasPremium = before?.isPremium === true;
    const isPremium = after?.isPremium === true;

    // Only update if premium status actually changed
    if (wasPremium === isPremium) return;

    await updateAnalytics(appId, (data) => {
      // Ensure premium object exists (for existing documents without this field)
      if (!data.premium) {
        data.premium = { total: 0, nonPremium: 0 };
      }

      if (!wasPremium && isPremium) {
        // User became premium
        data.premium.total++;
        if (data.premium.nonPremium > 0) data.premium.nonPremium--;
      } else if (wasPremium && !isPremium) {
        // User lost premium status
        if (data.premium.total > 0) data.premium.total--;
        data.premium.nonPremium++;
      }

      return data;
    });
  });

