import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize admin BEFORE importing user-analytics (which depends on admin being initialized)
if (!admin.apps.length) {
  const serviceAccountFiles = [
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'telc-b1-german-firebase-adminsdk-fbsvc-3b9e813494.json'),
    path.resolve(__dirname, '../service-account.json'),
    path.resolve(__dirname, '../telc-b1-german-firebase-adminsdk-fbsvc-3b9e813494.json')
  ];
  
  let initialized = false;
  
  for (const file of serviceAccountFiles) {
    try {
      console.log(`Checking for service account at: ${file}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(file);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'telc-b1-german'
      });
      console.log(`Initialized with service account file: ${file}`);
      initialized = true;
      break;
    } catch (e) {
      // Continue to next file
    }
  }
  
  if (!initialized) {
    admin.initializeApp({
      projectId: 'telc-b1-german'
    });
    console.log('Initialized with default credentials (requires gcloud auth).');
  }
}

// Now import user-analytics AFTER admin is initialized
import { AnalyticsData, getInitialAnalytics } from './user-analytics';

const db = admin.firestore();

// Mappings
const VOCAB_COLLECTIONS = {
  'vocabulary_progress_german_a1': 'german-b1',
  'vocabulary_progress_german_b2': 'german-b2',
  'vocabulary_progress_english_b1': 'english-b1',
  'vocabulary_progress_english_b2': 'english-b2',
};

const PROGRESS_COLLECTIONS = {
  'progress': 'german-b1', // German B1, backward compatibility
  'german_b2_progress': 'german-b2',
  'english_b1_progress': 'english-b1',
  'english_b2_progress': 'english-b2',
};

// Valid App IDs to ensure we initialize them
const APP_IDS = ['german-b1', 'german-b2', 'english-b1', 'english-b2'];

// Storage for aggregated data
const aggregatedData = new Map<string, AnalyticsData>();

function getOrCreateAnalytics(appId: string): AnalyticsData {
  if (!aggregatedData.has(appId)) {
    // Get fresh initial state
    aggregatedData.set(appId, getInitialAnalytics());
  }
  return aggregatedData.get(appId)!;
}

/**
 * Process Users Collection
 */
async function processUsers() {
  console.log('Processing Users...');
  const usersSnap = await db.collection('users').get();
  
  let count = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const appId = data.appId || 'german-b1';
    
    const analytics = getOrCreateAnalytics(appId);
    
    // 1. Total Users
    analytics.totalUsers += 1;
    
    // 2. Platform
    const platform = data.platform?.toLowerCase();
    if (platform) {
      analytics.platforms[platform] = (analytics.platforms[platform] || 0) + 1;
    }
    
    // 3. Language
    const lang = data.preferences?.interfaceLanguage || 'en';
    analytics.languages[lang] = (analytics.languages[lang] || 0) + 1;
    
    // 4. Notifications
    const isEnabled = data.notificationSettings?.enabled && data.fcmToken;
    if (isEnabled) {
      analytics.notifications.enabled += 1;
    } else {
      analytics.notifications.disabled += 1;
    }
    
    count++;
    if (count % 100 === 0) console.log(`Processed ${count} users...`);
  }
  console.log(`Finished processing ${count} users.`);
}

/**
 * Process Vocabulary Collections
 */
async function processVocabulary() {
  console.log('Processing Vocabulary...');
  
  for (const [collectionName, appId] of Object.entries(VOCAB_COLLECTIONS)) {
    console.log(`Processing ${collectionName} for ${appId}...`);
    // We only care about docs with id 'data' inside these collections, 
    // but these are subcollections of users/{uid}.
    // So we use collectionGroup.
    // However, the collectionId in collectionGroup is the last part of path.
    // The collection name IS the last part here.
    
    const vocabSnap = await db.collectionGroup(collectionName).get();
    const analytics = getOrCreateAnalytics(appId);
    
    let count = 0;
    for (const doc of vocabSnap.docs) {
      if (doc.id !== 'data') continue;
      
      const data = doc.data();
      
      // Words Studied
      analytics.vocabulary.totalWordsStudied += (data.totalWordsStudied || 0);
      
      // Words Mastered
      analytics.vocabulary.totalMastered += (data.wordsMastered || 0);
      
      // Persona
      const persona = data.persona;
      if (persona) {
        analytics.personas[persona] = (analytics.personas[persona] || 0) + 1;
      }
      
      count++;
    }
    console.log(`Processed ${count} vocabulary records for ${appId}.`);
  }
}

/**
 * Process Streaks
 */
async function processStreaks() {
  console.log('Processing Streaks...');
  
  // collectionGroup('streaks')
  const streaksSnap = await db.collectionGroup('streaks').get();
  
  let count = 0;
  for (const doc of streaksSnap.docs) {
    // doc.id is usually the appId (e.g., 'german-b1', 'german-b2')
    const appId = doc.id;
    
    // Verify it's a valid app we care about
    if (!APP_IDS.includes(appId)) continue;
    
    const analytics = getOrCreateAnalytics(appId);
    const data = doc.data();
    
    const currentStreak = data.currentStreak || 0;
    const longestStreak = data.longestStreak || 0;
    
    // Streak Distributions
    if (currentStreak > 0) {
      analytics.streaks.currentStreakDistribution[currentStreak] = 
        (analytics.streaks.currentStreakDistribution[currentStreak] || 0) + 1;
      
      analytics.streaks.activeStreaks += 1;
    }
    
    if (longestStreak > 0) {
      analytics.streaks.longestStreakDistribution[longestStreak] = 
        (analytics.streaks.longestStreakDistribution[longestStreak] || 0) + 1;
    }
    
    count++;
  }
  console.log(`Processed ${count} streak records.`);
}

/**
 * Process Exam Progress
 */
async function processProgress() {
  console.log('Processing Exam Progress...');
  
  for (const [collectionName, appId] of Object.entries(PROGRESS_COLLECTIONS)) {
    console.log(`Processing ${collectionName} for ${appId}...`);
    
    const progressSnap = await db.collectionGroup(collectionName).get();
    const analytics = getOrCreateAnalytics(appId);
    
    let count = 0;
    for (const doc of progressSnap.docs) {
      if (doc.id !== 'data') continue;
      
      const data = doc.data();
      
      // Total Score
      analytics.progress.totalScore += (data.totalScore || 0);
      
      // Completed Exams
      const exams = (data.exams || []) as any[];
      const completedCount = exams.filter(e => e.completed).length;
      analytics.progress.examsCompleted += completedCount;
      
      count++;
    }
    console.log(`Processed ${count} progress records for ${appId}.`);
  }
}

/**
 * Save Aggregated Data
 */
async function saveResults() {
  console.log('Saving results...');
  const today = new Date().toISOString().split('T')[0];
  
  for (const [appId, data] of aggregatedData.entries()) {
    console.log(`Saving analytics for ${appId}...`);
    data.lastUpdated = admin.firestore.Timestamp.now();
    
    const analyticsRef = db.collection('user_analytics').doc(appId);
    const dailyRef = analyticsRef.collection('daily_snapshots').doc(today);
    
    const batch = db.batch();
    batch.set(analyticsRef, data, { merge: true });
    batch.set(dailyRef, data, { merge: true });
    
    await batch.commit();
  }
  console.log('Results saved successfully.');
}

/**
 * Main execution function
 */
export async function backfillAnalytics() {
  try {
    await processUsers();
    await processVocabulary();
    await processStreaks();
    await processProgress();
    await saveResults();
    console.log('Backfill complete!');
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  backfillAnalytics();
}

