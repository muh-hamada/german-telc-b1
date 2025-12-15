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
      deletionRequest: false,
    };

    try {
      const db = admin.firestore();
      const auth = admin.auth();

      console.log(`Starting deletion process for user: ${uid} (${email})`);

      // 1. Recursively delete user document and ALL subcollections
      // This will delete: user document, premium, streaks, progress, completions, vocabulary, etc.
      const userDocRef = db.collection('users').doc(uid);
      
      try {
        console.log(`Recursively deleting user document and all subcollections: users/${uid}`);
        await db.recursiveDelete(userDocRef);
        deletedData.userDocument = true;
        console.log(`✓ Successfully deleted user document and all subcollections: users/${uid}`);
      } catch (error: any) {
        console.error(`✗ Error recursively deleting user document:`, error);
        throw new Error(`Failed to delete user document and subcollections: ${error.message}`);
      }

      // 2. Update deletion request to completed
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
      } catch (error: any) {
        console.error(`✗ Error updating deletion request:`, error);
        // Continue even if this fails
      }

      // 3. Delete authentication account (do this last)
      try {
        await auth.deleteUser(uid);
        deletedData.authAccount = true;
        console.log(`✓ Deleted authentication account for user: ${uid}`);
      } catch (error: any) {
        console.error(`✗ Error deleting auth account:`, error);
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
      const errorMessage = error.message || 'Unknown error occurred';
      console.error(`✗ Error in deleteUserAccount function:`, error);
      console.error(`✗ Error details:`, {
        message: errorMessage,
        stack: error.stack,
        code: error.code,
        deletedData,
      });
      
      return {
        success: false,
        message: `Failed to delete user account: ${errorMessage}`,
        error: errorMessage,
        deletedData,
      };
    }
  }
);


