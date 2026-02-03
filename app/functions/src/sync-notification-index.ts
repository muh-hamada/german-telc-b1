import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const DEFAULT_TIMEZONE = 'Europe/Berlin';
const DEFAULT_NOTIFICATION_LANGUAGE = 'en';

/**
 * Cloud Function to sync user notification preferences to hourly index
 * Triggers on any write (create, update, delete) to users/{uid}
 */
export const syncNotificationIndex = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const uid = context.params.uid;

    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    console.log(`[syncNotificationIndex] Processing user ${uid}`);

    try {
      // Case 1: User document deleted
      if (!after) {
        console.log(`[syncNotificationIndex] User ${uid} deleted, removing from all hour indexes`);
        await removeUserFromAllHours(db, uid);
        return;
      }

      // Extract notification settings
      const notificationsEnabled = after.notificationSettings?.enabled === true;
      const notificationHour = after.notificationSettings?.hour; // int
      const timezone = after.timezone || DEFAULT_TIMEZONE;
      const fcmToken = after.fcmToken?.token;
      const displayName = after.displayName || '';
      const language = after.preferences?.interfaceLanguage || after.preferences?.language || DEFAULT_NOTIFICATION_LANGUAGE;
      const appId = after.appId || '';

      // Case 2: Notifications disabled or missing required fields
      if (!notificationsEnabled || !notificationHour || !fcmToken) {
        if (!notificationsEnabled) {
          console.log(`[syncNotificationIndex] User ${uid} has notifications disabled`);
        } else if (!notificationHour) {
          console.log(`[syncNotificationIndex] User ${uid} is missing notificationHour`);
        } else if (!fcmToken) {
          console.log(`[syncNotificationIndex] User ${uid} is missing fcmToken`);
        }
        await removeUserFromAllHours(db, uid);
        return;
      }

      if (notificationHour < 0 || notificationHour > 23 || notificationHour < 0 || notificationHour > 59) {
        console.warn(`[syncNotificationIndex] Invalid time values for user ${uid}: ${notificationHour}`);
        await removeUserFromAllHours(db, uid);
        return;
      }

      // Convert local time to UTC hour
      const utcHour = convertToUTCHour(notificationHour, timezone);
      
      if (utcHour === null) {
        console.warn(`[syncNotificationIndex] Failed to convert time to UTC for user ${uid}`);
        await removeUserFromAllHours(db, uid);
        return;
      }

      console.log(`[syncNotificationIndex] User ${uid} notification time: ${notificationHour} ${timezone} -> UTC hour ${utcHour}`);

      // Check if we need to update the index
      const beforeEnabled = before?.preferences?.notifications === true;
      const beforeHour = before?.notificationSettings?.hour;
      const beforeTimezone = before?.timezone || DEFAULT_TIMEZONE;
      const beforeToken = before?.fcmToken?.token;

      let needsUpdate = false;
      let beforeUtcHour = null;

      if (beforeEnabled && beforeHour && beforeToken) {
        beforeUtcHour = convertToUTCHour(beforeHour, beforeTimezone);
      } 

      // Determine if update is needed
      if (!beforeEnabled || !beforeToken || beforeUtcHour !== utcHour) {
        needsUpdate = true;
      } else {
        // Check if other fields changed
        const beforeDisplayName = before?.displayName || '';
        const beforeLanguage = before?.preferences?.interfaceLanguage || DEFAULT_NOTIFICATION_LANGUAGE;
        const beforeAppId = before?.appId || '';
        
        if (displayName !== beforeDisplayName || 
            language !== beforeLanguage || 
            timezone !== beforeTimezone ||
            fcmToken !== beforeToken ||
            appId !== beforeAppId) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate) {
        console.log(`[syncNotificationIndex] No changes needed for user ${uid}`);
        return;
      }

      // Case 3: Update the index
      // Use batched write for atomicity
      const batch = db.batch();

      // Remove user from all hour documents (cleanup)
      for (let hour = 0; hour < 24; hour++) {
        const hourDocRef = db.collection('user_notifications_by_hour').doc(hour.toString());
        batch.set(hourDocRef, {
          users: {
            [uid]: admin.firestore.FieldValue.delete()
          }
        }, { merge: true });
      }

      // Add user to the correct hour document
      const targetHourDocRef = db.collection('user_notifications_by_hour').doc(utcHour.toString());
      batch.set(targetHourDocRef, {
        users: {
          [uid]: {
            timezone,
            language,
            deviceId: fcmToken,
            displayName,
            appId
          }
        }
      }, { merge: true });

      await batch.commit();
      console.log(`[syncNotificationIndex] Successfully updated index for user ${uid} at hour ${utcHour}`);

    } catch (error) {
      console.error(`[syncNotificationIndex] Error processing user ${uid}:`, error);
      throw error;
    }
  });

/**
 * Remove user from all hour documents
 */
async function removeUserFromAllHours(db: admin.firestore.Firestore, uid: string): Promise<void> {
  const batch = db.batch();

  for (let hour = 0; hour < 24; hour++) {
    const hourDocRef = db.collection('user_notifications_by_hour').doc(hour.toString());
    batch.set(hourDocRef, {
      users: {
        [uid]: admin.firestore.FieldValue.delete()
      }
    }, { merge: true });
  }

  await batch.commit();
  console.log(`[syncNotificationIndex] Removed user ${uid} from all hour indexes`);
}

/**
 * Convert local time to UTC hour
 * @param localHour - Hour in local timezone (0-23)
 * @param timezone - IANA timezone string (e.g., "Europe/Berlin")
 * @returns UTC hour (0-23) or null if conversion fails
 */
function convertToUTCHour(localHour: number, timezone: string): number | null {
  try {
    // Create a date object for today at the specified local time
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();

    // Create a date string in ISO format with the local time
    // We'll use a known date to avoid DST issues in conversion
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(localHour).padStart(2, '0')}:00:00Z`;

    // Use Intl.DateTimeFormat to parse the time in the user's timezone
    // and get the UTC equivalent
    const localDate = new Date(dateString);
    
    // Get the offset in minutes for the timezone
    const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
    
    const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    
    // Calculate UTC hour
    const totalMinutes = localHour * 60 - offsetMinutes;
    const utcHour = Math.floor(totalMinutes / 60) % 24;
    
    // Handle negative hours
    return utcHour < 0 ? utcHour + 24 : utcHour;
  } catch (error) {
    console.error(`[convertToUTCHour] Error converting time:`, error);
    return null;
  }
}

