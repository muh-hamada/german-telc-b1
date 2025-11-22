import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Notification titles in different languages
const NOTIFICATION_TITLES: { [key: string]: string } = {
  en: 'Telc Exam Preparation',
  de: 'Telc-Prüfungsvorbereitung',
  ar: 'التحضير لامتحان Telc',
  es: 'Preparación del Examen Telc',
  ru: 'Подготовка к экзамену Telc',
  fr: 'Préparation à l\'examen Telc'
};

// Motivational messages based on day of week (0=Sunday to 6=Saturday)
const MOTIVATIONAL_MESSAGES: { [key: string]: string[] } = {
  en: [
    "Start your week strong! 💪", // Sunday
    "Keep going — you're doing great!", // Monday
    "Small steps matter. Keep it up!", // Tuesday
    "Stay consistent, your future self will thank you!", // Wednesday
    "You're stronger than you think!", // Thursday
    "Push a little today, rest well later!", // Friday
    "Finish the week proud of yourself!" // Saturday
  ],
  de: [
    "Starte stark in die Woche! 💪",
    "Weiter so — du machst das super!",
    "Kleine Schritte zählen. Weiter so!",
    "Bleib dran, dein zukünftiges Ich wird dir danken!",
    "Du bist stärker als du denkst!",
    "Gib heute etwas Gas, erhole dich später!",
    "Beende die Woche mit Stolz!"
  ],
  ar: [
    "ابدأ أسبوعك بقوة! 💪",
    "استمر — أنت تقوم بعمل رائع!",
    "الخطوات الصغيرة مهمة. استمر!",
    "كن متسقاً، ذاتك المستقبلية ستشكرك!",
    "أنت أقوى مما تعتقد!",
    "ادفع قليلاً اليوم، واسترح جيداً لاحقاً!",
    "أنهِ الأسبوع فخوراً بنفسك!"
  ],
  es: [
    "¡Empieza la semana con fuerza! 💪",
    "¡Sigue así, lo estás haciendo genial!",
    "Los pequeños pasos importan. ¡Sigue así!",
    "Mantente constante, ¡tu yo futuro te lo agradecerá!",
    "¡Eres más fuerte de lo que crees!",
    "¡Esfuérzate hoy, descansa después!",
    "¡Termina la semana orgulloso de ti mismo!"
  ],
  ru: [
    "Начни неделю сильным! 💪",
    "Продолжай — у тебя отлично получается!",
    "Маленькие шаги имеют значение. Продолжай!",
    "Будь последовательным, твоё будущее я скажет тебе спасибо!",
    "Ты сильнее, чем думаешь!",
    "Немного усилий сегодня, хороший отдых потом!",
    "Заканчивай неделю с гордостью за себя!"
  ],
  fr: [
    "Commencez la semaine en force ! 💪",
    "Continuez — vous faites du super travail !",
    "Les petits pas comptent. Continuez !",
    "Restez constant, votre futur vous remerciera !",
    "Vous êtes plus fort que vous ne le pensez !",
    "Poussez un peu aujourd'hui, reposez-vous bien après !",
    "Terminez la semaine fier de vous !"
  ]
};

// Placeholder image URL
const NOTIFICATION_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/notification-logo.jpg?alt=media&token=9cb214fc-72c2-4d58-8d60-1e9fbc90558a';

// Default language if user's language is not supported
const DEFAULT_LANGUAGE = 'en';

/**
 * Core function to send notification to a single user
 * @param uid User ID
 * @param userData User data containing language, deviceId, and displayName
 * @param dayOfWeek Current day of week (0=Sunday, 6=Saturday)
 * @returns Promise<void>
 */
async function sendNotificationToUser(
  uid: string,
  userData: { language?: string; deviceId: string; displayName?: string },
  dayOfWeek: number
): Promise<void> {
  const { language, deviceId, displayName } = userData;

  // Validate required fields
  if (!deviceId) {
    throw new Error('No deviceId provided');
  }

  // Get notification content based on language
  const userLanguage = language && NOTIFICATION_TITLES[language] ? language : DEFAULT_LANGUAGE;
  const title = NOTIFICATION_TITLES[userLanguage];
  const body = MOTIVATIONAL_MESSAGES[userLanguage][dayOfWeek];

  // Send notification
  await admin.messaging().send({
    token: deviceId,
    notification: {
      title,
      body,
      imageUrl: NOTIFICATION_IMAGE_URL
    },
    data: {
      type: 'daily_reminder',
      screen: 'home'
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        priority: 'high'
      }
    }
  });

  console.log(`[sendNotification] Sent notification to user ${uid} (${displayName || 'unknown'}) in ${userLanguage}`);
}

/**
 * Scheduled Cloud Function that sends notifications every hour
 * Runs at minute 0 of every hour
 */
export const sendScheduledNotifications = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '256MB'
  })
  .pubsub
  .schedule('0 * * * *') // Every hour at minute 0
  .timeZone('UTC') // Use UTC timezone
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // Get current UTC hour (0-23)
    const now = new Date();
    const currentUtcHour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday, 6=Saturday
    
    console.log(`[sendScheduledNotifications] Starting notification job for UTC hour ${currentUtcHour}, day ${dayOfWeek}`);
    
    try {
      // Read the document for the current hour
      const hourDocRef = db.collection('user_notifications_by_hour').doc(currentUtcHour.toString());
      const hourDoc = await hourDocRef.get();
      
      if (!hourDoc.exists) {
        console.log(`[sendScheduledNotifications] No document found for hour ${currentUtcHour}`);
        return null;
      }
      
      const hourData = hourDoc.data();
      const users = hourData?.users;
      
      if (!users || Object.keys(users).length === 0) {
        console.log(`[sendScheduledNotifications] No users scheduled for hour ${currentUtcHour}`);
        return null;
      }
      
      console.log(`[sendScheduledNotifications] Found ${Object.keys(users).length} users for hour ${currentUtcHour}`);
      
      // Counters for logging
      let sentCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      // Process each user
      const userIds = Object.keys(users);
      for (const uid of userIds) {
        const userData = users[uid];
        
        // Validate required fields
        if (!userData.deviceId) {
          console.warn(`[sendScheduledNotifications] User ${uid} has no deviceId, skipping`);
          skippedCount++;
          continue;
        }
        
        try {
          // Send notification using extracted function
          await sendNotificationToUser(uid, userData, dayOfWeek);
          sentCount++;
          
        } catch (error: any) {
          // Log error but continue with other users
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            console.warn(`[sendScheduledNotifications] Invalid FCM token for user ${uid}: ${error.message}`);
            // Consider removing this token from the notification schedule
          } else if (error.code === 'messaging/third-party-auth-error') {
            console.error(`[sendScheduledNotifications] APNs/Web Push auth error for user ${uid}. This may indicate:`);
            console.error(`  - Expired or invalid APNs authentication key`);
            console.error(`  - Mismatched APNs credentials (Team ID, Key ID, or Bundle ID)`);
            console.error(`  - Invalid FCM token for iOS device`);
            console.error(`  Error details:`, error.message);
          } else {
            console.error(`[sendScheduledNotifications] Error sending notification to user ${uid}:`, error);
          }
          failedCount++;
        }
      }
      
      // Log summary
      console.log(`[sendScheduledNotifications] Job completed for hour ${currentUtcHour}:`);
      console.log(`  - Sent: ${sentCount}`);
      console.log(`  - Skipped: ${skippedCount}`);
      console.log(`  - Failed: ${failedCount}`);
      console.log(`  - Total: ${userIds.length}`);
      
      return null;
      
    } catch (error) {
      console.error(`[sendScheduledNotifications] Error in notification job:`, error);
      throw error;
    }
  });

/**
 * HTTP Cloud Function to manually trigger notification for a specific user
 * For testing purposes
 * Usage: POST /sendTestNotification with body: { uid: "user_id" }
 */
export const sendTestNotification = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https
  .onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { uid } = req.body;

    // Validate uid parameter
    if (!uid || typeof uid !== 'string') {
      res.status(400).json({ 
        error: 'Missing or invalid uid parameter',
        usage: 'POST with body: { uid: "user_id" }'
      });
      return;
    }

    console.log(`[sendTestNotification] Searching for user ${uid}`);

    try {
      const db = admin.firestore();
      const dayOfWeek = new Date().getUTCDay(); // Current day of week

      // Search through all hour documents (0-23)
      let userFound = false;
      let userData: any = null;
      let foundInHour: number | null = null;

      for (let hour = 0; hour < 24; hour++) {
        const hourDocRef = db.collection('user_notifications_by_hour').doc(hour.toString());
        const hourDoc = await hourDocRef.get();

        if (hourDoc.exists) {
          const hourData = hourDoc.data();
          const users = hourData?.users;

          if (users && users[uid]) {
            userFound = true;
            userData = users[uid];
            foundInHour = hour;
            break;
          }
        }
      }

      // Check if user was found
      if (!userFound || !userData) {
        res.status(404).json({
          error: `User ${uid} not found in any notification schedule`,
          hint: 'Make sure the user has enabled notifications in the app'
        });
        return;
      }

      console.log(`[sendTestNotification] Found user ${uid} in hour ${foundInHour}`);

      // Send notification using the extracted function
      await sendNotificationToUser(uid, userData, dayOfWeek);

      res.status(200).json({
        success: true,
        message: `Notification sent successfully to user ${uid}`,
        details: {
          displayName: userData.displayName || 'unknown',
          language: userData.language || DEFAULT_LANGUAGE,
          foundInHour: foundInHour
        }
      });

    } catch (error: any) {
      console.error(`[sendTestNotification] Error sending notification:`, error);

      // Handle specific Firebase messaging errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        res.status(400).json({
          error: 'Invalid or unregistered FCM token',
          details: error.message,
          hint: 'The user may need to reinstall the app or re-enable notifications'
        });
      } else if (error.code === 'messaging/third-party-auth-error') {
        res.status(500).json({
          error: 'APNs authentication error',
          details: error.message,
          hint: 'This may indicate a stale/corrupted FCM token or APNs configuration issue'
        });
      } else {
        res.status(500).json({
          error: 'Failed to send notification',
          details: error.message
        });
      }
    }
  });

