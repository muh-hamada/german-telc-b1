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
        const { language, deviceId, displayName } = userData;
        
        // Validate required fields
        if (!deviceId) {
          console.warn(`[sendScheduledNotifications] User ${uid} has no deviceId, skipping`);
          skippedCount++;
          continue;
        }
        
        try {
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
          
          console.log(`[sendScheduledNotifications] Sent notification to user ${uid} (${displayName || 'unknown'}) in ${userLanguage}`);
          sentCount++;
          
        } catch (error: any) {
          // Log error but continue with other users
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            console.warn(`[sendScheduledNotifications] Invalid FCM token for user ${uid}: ${error.message}`);
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

