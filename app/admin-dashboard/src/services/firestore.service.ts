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
} from 'firebase/firestore';
import { firebaseService } from './firebase.service';

const COLLECTION_NAME = 'b1_telc_exam_data';

export interface DocumentMetadata {
  id: string;
  data: any;
  updatedAt: Date;
  createdAt: Date;
  size: number;
}

class FirestoreService {
  private db = firebaseService.getFirestore();

  /**
   * Get all documents from the collection
   */
  async getAllDocuments(): Promise<DocumentMetadata[]> {
    try {
      const collectionRef = collection(this.db, COLLECTION_NAME);
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
      const docRef = doc(this.db, COLLECTION_NAME, docId);
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
      const docRef = doc(this.db, COLLECTION_NAME, docId);
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
      const docRef = doc(this.db, COLLECTION_NAME, docId);
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
      const docRef = doc(this.db, COLLECTION_NAME, docId);
      const existingDoc = await getDoc(docRef);
      
      if (!existingDoc.exists()) {
        const now = Timestamp.now();
        await setDoc(docRef, {
          data,
          createdAt: now,
          updatedAt: now,
          version: 1,
        });
        console.log(`Initialized document: ${docId}`);
      } else {
        console.log(`Document ${docId} already exists, skipping...`);
      }
    } catch (error) {
      console.error(`Error initializing document ${docId}:`, error);
      throw error;
    }
  }
}

const firestoreService = new FirestoreService();
export { firestoreService };

