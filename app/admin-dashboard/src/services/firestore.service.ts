import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseService } from './firebase.service';

// Default collection for backward compatibility
const DEFAULT_COLLECTION = 'b1_telc_exam_data';

export interface DocumentMetadata {
  id: string;
  data: any;
  updatedAt: Date;
  createdAt: Date;
  size: number;
}

export interface DeletionRequest {
  uid: string;
  email: string;
  requestedAt: Date;
  status: 'pending' | 'completed';
  completedAt?: Date;
  deletedBy?: string;
}

export interface CompletionData {
  examId: number;
  examType: string;
  partNumber: number;
  score: number;
  date: number;
  completed: boolean;
}

export interface CompletionStats {
  examType: string;
  partNumber: number;
  completedCount: number;
  completions: CompletionData[];
}

export interface UserData {
  profile: any | null;
  progressB1: any | null;
  progressB2: any | null;
  completionsB1: CompletionStats[];
  completionsB2: CompletionStats[];
}

class FirestoreService {
  private db = firebaseService.getFirestore();
  private functions = getFunctions();
  private currentCollection: string = DEFAULT_COLLECTION;

  /**
   * Set the current collection to work with
   */
  setCollection(collectionName: string): void {
    this.currentCollection = collectionName;
    console.log(`Firestore service now using collection: ${collectionName}`);
  }

  /**
   * Get the current collection name
   */
  getCurrentCollection(): string {
    return this.currentCollection;
  }

  /**
   * Get all documents from the current collection
   */
  async getAllDocuments(): Promise<DocumentMetadata[]> {
    try {
      const collectionRef = collection(this.db, this.currentCollection);
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collectionRef);
      
      const documents: DocumentMetadata[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        documents.push({
          id: docSnapshot.id,
          data: docData.data || {},
          updatedAt: docData.updatedAt?.toDate() || new Date(),
          createdAt: docData.createdAt?.toDate() || new Date(),
          size: JSON.stringify(docData.data || {}).length,
        });
      });
      
      return documents.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(docId: string): Promise<any> {
    try {
      const docRef = doc(this.db, this.currentCollection, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const docData = docSnap.data();
        return docData.data || {};
      } else {
        throw new Error(`Document ${docId} not found`);
      }
    } catch (error) {
      console.error(`Error getting document ${docId}:`, error);
      throw error;
    }
  }

  /**
   * Save (create or update) a document
   */
  async saveDocument(docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.db, this.currentCollection, docId);
      const existingDoc = await getDoc(docRef);
      
      const now = Timestamp.now();
      const docData = {
        data,
        updatedAt: now,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
        version: existingDoc.exists() ? (existingDoc.data().version || 0) + 1 : 1,
      };
      
      await setDoc(docRef, docData);
    } catch (error) {
      console.error(`Error saving document ${docId}:`, error);
      throw new Error(`Failed to save document ${docId}`);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(docId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.currentCollection, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error);
      throw new Error(`Failed to delete document ${docId}`);
    }
  }

  /**
   * Initialize a document with data
   * Used for migration from local JSON files
   */
  async initializeDocument(docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.db, this.currentCollection, docId);
      const existingDoc = await getDoc(docRef);
      
      if (!existingDoc.exists()) {
        const now = Timestamp.now();
        await setDoc(docRef, {
          data,
          createdAt: now,
          updatedAt: now,
          version: 1,
        });
        console.log(`Initialized document: ${docId} in collection: ${this.currentCollection}`);
      } else {
        console.log(`Document ${docId} already exists in ${this.currentCollection}, skipping...`);
      }
    } catch (error) {
      console.error(`Error initializing document ${docId}:`, error);
      throw error;
    }
  }

  /**
   * Get all account deletion requests
   */
  async getDeletionRequests(): Promise<DeletionRequest[]> {
    try {
      const collectionRef = collection(this.db, 'account_deletion_requests');
      const q = query(collectionRef, orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requests: DeletionRequest[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        requests.push({
          uid: data.uid,
          email: data.email,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          status: data.status || 'pending',
          completedAt: data.completedAt?.toDate(),
          deletedBy: data.deletedBy,
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting deletion requests:', error);
      throw new Error('Failed to fetch deletion requests');
    }
  }

  /**
   * Get user data including profile and progress from both B1 and B2
   */
  async getUserData(uid: string): Promise<UserData> {
    try {
      const userData: UserData = {
        profile: null,
        progressB1: null,
        progressB2: null,
        completionsB1: [],
        completionsB2: [],
      };

      // Get user profile
      try {
        const profileRef = doc(this.db, 'users', uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          userData.profile = profileSnap.data();
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Get B1 progress (subcollection: users/{uid}/progress)
      // Since progress is a subcollection, we need to fetch all documents in it
      try {
        console.log(`[getUserData] Fetching B1 progress for user: ${uid}`);
        const progressB1Ref = collection(this.db, 'users', uid, 'progress');
        console.log(`[getUserData] B1 Progress collection path:`, progressB1Ref.path);
        const progressB1Snap = await getDocs(progressB1Ref);
        console.log(`[getUserData] B1 Progress docs found:`, progressB1Snap.size);
        
        if (!progressB1Snap.empty) {
          // Get the first document (or aggregate all if needed)
          const firstDoc = progressB1Snap.docs[0];
          userData.progressB1 = firstDoc.data();
          console.log('[getUserData] B1 Progress data:', userData.progressB1);
        } else {
          console.log('[getUserData] No B1 progress documents found');
        }
      } catch (error: any) {
        console.error('[getUserData] Error fetching B1 progress:', error);
        console.error('[getUserData] Error message:', error.message);
        console.error('[getUserData] Error code:', error.code);
      }

      // Get B2 progress (subcollection: users/{uid}/german_b2_progress)
      try {
        console.log(`[getUserData] Fetching B2 progress for user: ${uid}`);
        const progressB2Ref = collection(this.db, 'users', uid, 'german_b2_progress');
        console.log(`[getUserData] B2 Progress collection path:`, progressB2Ref.path);
        const progressB2Snap = await getDocs(progressB2Ref);
        console.log(`[getUserData] B2 Progress docs found:`, progressB2Snap.size);
        
        if (!progressB2Snap.empty) {
          // Get the first document (or aggregate all if needed)
          const firstDoc = progressB2Snap.docs[0];
          userData.progressB2 = firstDoc.data();
          console.log('[getUserData] B2 Progress data:', userData.progressB2);
        } else {
          console.log('[getUserData] No B2 progress documents found');
        }
      } catch (error: any) {
        console.error('[getUserData] Error fetching B2 progress:', error);
        console.error('[getUserData] Error message:', error.message);
        console.error('[getUserData] Error code:', error.code);
      }

      // Get B1 completions
      try {
        userData.completionsB1 = await this.getCompletionStats(uid, 'users/{uid}/completions', false);
      } catch (error) {
        console.error('Error fetching B1 completions:', error);
      }

      // Get B2 completions - german_b2 is a document, not a collection
      // So we query the subcollections under it
      try {
        userData.completionsB2 = await this.getCompletionStats(uid, 'users/{uid}/completions', true, 'german_b2');
      } catch (error) {
        console.error('Error fetching B2 completions:', error);
      }

      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  /**
   * Get completion statistics for a user
   * Fetches all completions and groups them by exam type and part number
   * @param uid - User ID
   * @param pathTemplate - Base path template (e.g., "users/{uid}/completions")
   * @param hasExtraLevel - Whether there's an extra document level (e.g., german_b2)
   * @param extraLevelId - The ID of the extra document level
   */
  private async getCompletionStats(
    uid: string, 
    pathTemplate: string, 
    hasExtraLevel: boolean = false,
    extraLevelId?: string
  ): Promise<CompletionStats[]> {
    try {
      // Parse the path template to extract segments
      const pathSegments = pathTemplate.replace('{uid}', uid).split('/') as [string, ...string[]];
      
      let completionsRef;
      if (hasExtraLevel && extraLevelId) {
        // For B2: users/{uid}/completions -> get document german_b2 -> list subcollections
        const docRef = doc(this.db, ...pathSegments, extraLevelId);
        console.log(`Fetching B2 completions from document: ${docRef.path}`);
        // We can't directly list subcollections in web SDK, so we'll try known exam types
        return await this.getCompletionStatsFromKnownTypes(uid, [...pathSegments, extraLevelId]);
      } else {
        // For B1: users/{uid}/completions
        completionsRef = collection(this.db, ...pathSegments);
        const snapshot = await getDocs(completionsRef);
        console.log(`Fetching completions from: ${pathSegments.join('/')}, found ${snapshot.size} exam types`);

        // Map to store completions grouped by examType/partNumber
        const statsMap = new Map<string, CompletionStats>();

        // Recursively fetch all completion documents
        for (const examTypeDoc of snapshot.docs) {
          const examType = examTypeDoc.id;
          const partsRef = collection(this.db, ...([...pathSegments, examType] as [string, ...string[]]));
          const partsSnapshot = await getDocs(partsRef);

          console.log(`  Exam type "${examType}": found ${partsSnapshot.size} parts`);

          for (const partDoc of partsSnapshot.docs) {
            const partNumber = parseInt(partDoc.id);
            const examsRef = collection(this.db, ...([...pathSegments, examType, partDoc.id] as [string, ...string[]]));
            const examsSnapshot = await getDocs(examsRef);

            console.log(`    Part ${partNumber}: found ${examsSnapshot.size} completed exams`);

            const key = `${examType}-${partNumber}`;
            if (!statsMap.has(key)) {
              statsMap.set(key, {
                examType,
                partNumber,
                completedCount: 0,
                completions: [],
              });
            }

            const stats = statsMap.get(key)!;
            for (const examDoc of examsSnapshot.docs) {
              const data = examDoc.data();
              if (data.completed) {
                stats.completedCount++;
                stats.completions.push({
                  examId: data.examId,
                  examType: data.examType,
                  partNumber: data.partNumber,
                  score: data.score || 0,
                  date: data.date || 0,
                  completed: data.completed,
                });
              }
            }
          }
        }

        console.log(`Total completion stats found: ${statsMap.size}`);
        return Array.from(statsMap.values()).sort((a, b) => {
          if (a.examType !== b.examType) {
            return a.examType.localeCompare(b.examType);
          }
          return a.partNumber - b.partNumber;
        });
      }
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return [];
    }
  }

  /**
   * Get completion stats from known exam types (for B2 structure)
   */
  private async getCompletionStatsFromKnownTypes(uid: string, basePath: string[]): Promise<CompletionStats[]> {
    const examTypes = ['grammar', 'reading', 'writing', 'listening', 'speaking'];
    const statsMap = new Map<string, CompletionStats>();

    for (const examType of examTypes) {
      try {
        const examTypePath = [...basePath, examType] as unknown as [string, ...string[]];
        const examTypeRef = collection(this.db, ...examTypePath);
        const partsSnapshot = await getDocs(examTypeRef);

        for (const partDoc of partsSnapshot.docs) {
          const partNumber = parseInt(partDoc.id);
          const examsPath = [...basePath, examType, partDoc.id] as unknown as [string, ...string[]];
          const examsRef = collection(this.db, ...examsPath);
          const examsSnapshot = await getDocs(examsRef);

          const key = `${examType}-${partNumber}`;
          if (!statsMap.has(key)) {
            statsMap.set(key, {
              examType,
              partNumber,
              completedCount: 0,
              completions: [],
            });
          }

          const stats = statsMap.get(key)!;
          for (const examDoc of examsSnapshot.docs) {
            const data = examDoc.data();
            if (data.completed) {
              stats.completedCount++;
              stats.completions.push({
                examId: data.examId,
                examType: data.examType,
                partNumber: data.partNumber,
                score: data.score || 0,
                date: data.date || 0,
                completed: data.completed,
              });
            }
          }
        }
      } catch (error) {
        // Exam type might not exist, skip it
        console.log(`No completions found for exam type: ${examType}`);
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => {
      if (a.examType !== b.examType) {
        return a.examType.localeCompare(b.examType);
      }
      return a.partNumber - b.partNumber;
    });
  }

  /**
   * Get all users from the users collection
   * Only fetches the main user document for performance
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const usersRef = collection(this.db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: any[] = [];
      querySnapshot.forEach((docSnapshot) => {
        users.push({
          uid: docSnapshot.id,
          ...docSnapshot.data(),
        });
      });
      
      console.log(`[FirestoreService] Fetched ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get detailed user data with all nested collections
   */
  async getDetailedUserData(uid: string): Promise<any> {
    try {
      const userData: any = {
        uid,
        profile: null,
        progress: {},
        completions: {},
        streaks: null,
        vocabularyProgress: {},
        premium: null,
      };

      // Get user profile
      try {
        const profileRef = doc(this.db, 'users', uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          userData.profile = { id: profileSnap.id, ...profileSnap.data() };
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Get progress for all apps
      const progressCollections = ['progress', 'german_b2_progress', 'english_b1_progress', 'english_b2_progress', 'german_a1_progress'];
      for (const collectionName of progressCollections) {
        try {
          const progressRef = collection(this.db, 'users', uid, collectionName);
          const progressSnap = await getDocs(progressRef);
          if (!progressSnap.empty) {
            userData.progress[collectionName] = progressSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        } catch (error) {
          console.error(`Error fetching ${collectionName}:`, error);
        }
      }

      // Get completions
      try {
        const completionsRef = collection(this.db, 'users', uid, 'completions');
        const completionsSnap = await getDocs(completionsRef);
        for (const examTypeDoc of completionsSnap.docs) {
          const examType = examTypeDoc.id;
          userData.completions[examType] = {};
          
          const partsRef = collection(this.db, 'users', uid, 'completions', examType);
          const partsSnap = await getDocs(partsRef);
          
          for (const partDoc of partsSnap.docs) {
            const partNumber = partDoc.id;
            const examsRef = collection(this.db, 'users', uid, 'completions', examType, partNumber);
            const examsSnap = await getDocs(examsRef);
            
            userData.completions[examType][partNumber] = examsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching completions:', error);
      }

      // Get streaks
      try {
        const streaksRef = collection(this.db, 'users', uid, 'streaks');
        const streaksSnap = await getDocs(streaksRef);
        if (!streaksSnap.empty) {
          userData.streaks = streaksSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      } catch (error) {
        console.error('Error fetching streaks:', error);
      }

      // Get vocabulary progress for all apps
      const vocabularyCollections = [
        'vocabulary_progress_german_a1',
        'vocabulary_progress_german_a2',
        'vocabulary_progress_german_b1',
        'vocabulary_progress_german_b2',
        'vocabulary_progress_english_a1',
        'vocabulary_progress_english_a2',
        'vocabulary_progress_english_b1',
        'vocabulary_progress_english_b2',
      ];
      
      for (const collectionName of vocabularyCollections) {
        try {
          const vocabRef = collection(this.db, 'users', uid, collectionName);
          const vocabSnap = await getDocs(vocabRef);
          if (!vocabSnap.empty) {
            userData.vocabularyProgress[collectionName] = vocabSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        } catch (error) {
          // Vocabulary progress might not exist for all apps
        }
      }

      // Get premium subscription info for all apps
      const appIds = ['german-b1', 'german-b2', 'english-b1', 'english-b2', 'german-a1'];
      userData.premium = {};
      userData.isPremium = false;
      
      try {
        for (const appId of appIds) {
          const premiumDocRef = doc(this.db, 'users', uid, 'premium', appId);
          const premiumSnap = await getDoc(premiumDocRef);
          if (premiumSnap.exists()) {
            console.log(`[getDetailedUserData] Premium data for ${appId}:`, premiumSnap.data());
            userData.premium[appId] = premiumSnap.data();
            if (premiumSnap.data().isPremium === true) {
              console.log(`[getDetailedUserData] User is premium for ${appId}`);
              userData.isPremium = true;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching premium data:', error);
      }

      console.log(`[getDetailedUserData] User is premium:`, userData);
      return userData;
    } catch (error) {
      console.error('Error getting detailed user data:', error);
      throw new Error('Failed to fetch detailed user data');
    }
  }

  /**
   * Call the cloud function to delete a user account
   */
  async callDeleteUserAccount(uid: string, email: string): Promise<any> {
    try {
      const deleteUserAccountFn = httpsCallable(this.functions, 'deleteUserAccount');
      const result = await deleteUserAccountFn({ uid, email });
      return result.data;
    } catch (error: any) {
      console.error('Error calling deleteUserAccount function:', error);
      throw new Error(error.message || 'Failed to delete user account');
    }
  }
}

const firestoreService = new FirestoreService();
export { firestoreService };

