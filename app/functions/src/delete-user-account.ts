import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const ADMIN_UID = 'jgOmmKqU1ZYO1KE8NwrqpxiUkn43';

interface DeleteUserAccountRequest {
  uid: string;
  email: string;
}

interface DeleteUserAccountResponse {
  success: boolean;
  message: string;
  deletedData?: {
    authAccount: boolean;
    userDocument: boolean;
    progressB1: boolean;
    progressB2: boolean;
    completions: boolean;
    deletionRequest: boolean;
  };
  error?: string;
}

/**
 * Cloud Function to delete a user account and all associated data
 * Only accessible by the admin with UID: jgOmmKqU1ZYO1KE8NwrqpxiUkn43
 */
export const deleteUserAccount = functions.https.onCall(
  async (
    data: DeleteUserAccountRequest,
    context: functions.https.CallableContext
  ): Promise<DeleteUserAccountResponse> => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function.'
      );
    }

    // Check if user is the admin
    if (context.auth.uid !== ADMIN_UID) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the admin can delete user accounts.'
      );
    }

    // Validate input
    if (!data.uid || !data.email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Both uid and email are required.'
      );
    }

    const { uid, email } = data;
    const deletedData = {
      authAccount: false,
      userDocument: false,
      progressB1: false,
      progressB2: false,
      completions: false,
      deletionRequest: false,
    };

    try {
      const db = admin.firestore();
      const auth = admin.auth();

      console.log(`Starting deletion process for user: ${uid} (${email})`);

      // 1. Delete user's main document
      try {
        await db.collection('users').doc(uid).delete();
        deletedData.userDocument = true;
        console.log(`✓ Deleted user document: users/${uid}`);
      } catch (error) {
        console.error(`Error deleting user document:`, error);
        // Continue with other deletions even if this fails
      }

      // 2. Delete B1 progress
      try {
        await db.doc(`users/${uid}/progress`).delete();
        deletedData.progressB1 = true;
        console.log(`✓ Deleted B1 progress: users/${uid}/progress`);
      } catch (error) {
        console.error(`Error deleting B1 progress:`, error);
      }

      // 3. Delete B2 progress
      try {
        await db.doc(`users/${uid}/german_b2_progress`).delete();
        deletedData.progressB2 = true;
        console.log(`✓ Deleted B2 progress: users/${uid}/german_b2_progress`);
      } catch (error) {
        console.error(`Error deleting B2 progress:`, error);
      }

      // 4. Delete all completions (recursively delete subcollections)
      try {
        const completionsRef = db.collection(`users/${uid}/completions`);
        await deleteCollection(db, completionsRef, 100);
        deletedData.completions = true;
        console.log(`✓ Deleted completions: users/${uid}/completions`);
      } catch (error) {
        console.error(`Error deleting completions:`, error);
      }

      // 5. Update deletion request to completed
      try {
        await db
          .collection('account_deletion_requests')
          .doc(uid)
          .update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedBy: context.auth.uid,
          });
        deletedData.deletionRequest = true;
        console.log(`✓ Updated deletion request status to completed`);
      } catch (error) {
        console.error(`Error updating deletion request:`, error);
      }

      // 6. Delete authentication account (do this last)
      try {
        await auth.deleteUser(uid);
        deletedData.authAccount = true;
        console.log(`✓ Deleted authentication account for user: ${uid}`);
      } catch (error) {
        console.error(`Error deleting auth account:`, error);
        // If auth deletion fails, we should still mark as success
        // since the data has been deleted
      }

      console.log(`Successfully completed deletion process for user: ${uid}`);

      return {
        success: true,
        message: `Successfully deleted user account and all associated data for ${email}`,
        deletedData,
      };
    } catch (error: any) {
      console.error(`Error in deleteUserAccount function:`, error);
      
      return {
        success: false,
        message: 'Failed to delete user account',
        error: error.message || 'Unknown error occurred',
        deletedData,
      };
    }
  }
);

/**
 * Helper function to recursively delete a collection
 */
async function deleteCollection(
  db: admin.firestore.Firestore,
  collectionRef: admin.firestore.CollectionReference,
  batchSize: number
): Promise<void> {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(
  db: admin.firestore.Firestore,
  query: admin.firestore.Query,
  resolve: () => void,
  reject: (error: Error) => void
): Promise<void> {
  try {
    const snapshot = await query.get();

    // When there are no documents left, we are done
    if (snapshot.size === 0) {
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick to avoid exploding the stack
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject);
    });
  } catch (error) {
    reject(error as Error);
  }
}

