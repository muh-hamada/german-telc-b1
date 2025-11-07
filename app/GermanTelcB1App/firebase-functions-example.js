// Firebase Cloud Functions for German TELC B1 Notifications
// Place this in your Firebase project: functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Trigger when user updates notification settings
 * Automatically schedules/unschedules notifications
 */
exports.updateNotificationSchedule = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if notification settings changed
    const newSettings = newData.notificationSettings;
    const oldSettings = oldData?.notificationSettings;
    
    // If notification settings didn't change, exit
    if (!newSettings || JSON.stringify(newSettings) === JSON.stringify(oldSettings)) {
      console.log('No notification settings change for user:', userId);
      return null;
    }
    
    console.log('Notification settings updated for user:', userId, newSettings);
    
    // Here you would typically:
    // 1. Cancel existing scheduled notifications for this user
    // 2. Schedule new notifications if enabled
    // 3. Update any external scheduling service
    
    return null;
  });

/**
 * Send daily notifications - triggered by Cloud Scheduler
 * Call this every hour: gcloud scheduler jobs create pubsub...
 */
exports.sendDailyNotifications = functions.pubsub
  .topic('daily-notifications')
  .onPublish(async (message) => {
    const hour = parseInt(message.attributes?.hour || '9');
    console.log(`Sending notifications for hour: ${hour}`);
    
    try {
      // Get all users who want notifications at this hour
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('notificationSettings.enabled', '==', true)
        .where('notificationSettings.hour', '==', hour)
        .get();
      
      console.log(`Found ${usersSnapshot.size} users for hour ${hour}`);
      
      const notifications = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const fcmToken = userData.fcmToken?.token;
        
        if (fcmToken) {
          notifications.push(sendNotificationToUser(fcmToken, userData, doc.id));
        }
      });
      
      const results = await Promise.allSettled(notifications);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Notifications sent: ${successful} successful, ${failed} failed`);
      
      return { successful, failed, total: notifications.length };
    } catch (error) {
      console.error('Error in sendDailyNotifications:', error);
      throw error;
    }
  });

/**
 * Send notification to individual user
 */
async function sendNotificationToUser(token, userData, userId) {
  // Personalized messages based on user progress
  const messages = [
    'Time to practice German! 🇩🇪',
    'Ready for your TELC B1 session?',
    'Your German skills are waiting! 📚',
    'Daily practice makes perfect! ✨',
    'Let\'s improve your German today! 🎯'
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  const message = {
    notification: {
      title: 'German TELC B1 Practice',
      body: randomMessage,
    },
    data: {
      type: 'daily_reminder',
      userId: userId,
      timestamp: Date.now().toString(),
    },
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#0077B6',
        channelId: 'daily_reminders',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
          category: 'daily_reminder',
        },
      },
    },
    token: token,
  };
  
  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification to user:', userId, response);
    
    // Optional: Log successful notification
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'daily_reminder',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId: response,
        status: 'sent',
      });
    
    return response;
  } catch (error) {
    console.error('Error sending notification to user:', userId, error);
    
    // Handle invalid token
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.log('Removing invalid FCM token for user:', userId);
      
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });
    }
    
    throw error;
  }
}

/**
 * HTTP endpoint to manually trigger notifications (for testing)
 * Call: POST https://your-region-your-project.cloudfunctions.net/testNotification
 */
exports.testNotification = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = context.auth.uid;
  
  try {
    // Get user data
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists()) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    const fcmToken = userData.fcmToken?.token;
    
    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'No FCM token found');
    }
    
    // Send test notification
    const result = await sendNotificationToUser(fcmToken, userData, userId);
    
    return { success: true, messageId: result };
  } catch (error) {
    console.error('Error in testNotification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Clean up expired FCM tokens (run weekly)
 */
exports.cleanupExpiredTokens = functions.pubsub
  .schedule('0 2 * * 0') // Every Sunday at 2 AM
  .onRun(async (context) => {
    console.log('Starting FCM token cleanup...');
    
    // Get all users with FCM tokens older than 60 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('fcmToken.updatedAt', '<', cutoffDate.toISOString())
      .get();
    
    console.log(`Found ${usersSnapshot.size} users with old tokens`);
    
    const batch = admin.firestore().batch();
    
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        fcmToken: admin.firestore.FieldValue.delete(),
      });
    });
    
    await batch.commit();
    console.log('FCM token cleanup completed');
    
    return null;
  });