import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Notification titles in different languages (personalized with name)
const NOTIFICATION_TITLES: { [key: string]: string } = {
  en: 'Telc Exam Preparation',
  de: 'Telc-Prüfungsvorbereitung',
  ar: 'التحضير لامتحان Telc',
  es: 'Preparación del Examen Telc',
  ru: 'Подготовка к экзамену Telc',
  fr: 'Préparation à l\'examen Telc'
};

// Fallback motivational messages based on day of week (0=Sunday to 6=Saturday)
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

// Personalized messages with name placeholder {name}
const PERSONALIZED_MESSAGES: { [key: string]: string[] } = {
  en: [
    "Hey {name}, start your week strong! 💪",
    "Keep going {name} — you're doing great!",
    "{name}, small steps matter. Keep it up!",
    "Stay consistent {name}, your future self will thank you!",
    "{name}, you're stronger than you think!",
    "Push a little today {name}, rest well later!",
    "{name}, finish the week proud of yourself!"
  ],
  de: [
    "Hey {name}, starte stark in die Woche! 💪",
    "Weiter so {name} — du machst das super!",
    "{name}, kleine Schritte zählen. Weiter so!",
    "Bleib dran {name}, dein zukünftiges Ich wird dir danken!",
    "{name}, du bist stärker als du denkst!",
    "Gib heute etwas Gas {name}, erhole dich später!",
    "{name}, beende die Woche mit Stolz!"
  ],
  ar: [
    "مرحباً {name}، ابدأ أسبوعك بقوة! 💪",
    "استمر {name} — أنت تقوم بعمل رائع!",
    "{name}، الخطوات الصغيرة مهمة. استمر!",
    "كن متسقاً {name}، ذاتك المستقبلية ستشكرك!",
    "{name}، أنت أقوى مما تعتقد!",
    "ادفع قليلاً اليوم {name}، واسترح جيداً لاحقاً!",
    "{name}، أنهِ الأسبوع فخوراً بنفسك!"
  ],
  es: [
    "¡Hola {name}, empieza la semana con fuerza! 💪",
    "¡Sigue así {name}, lo estás haciendo genial!",
    "{name}, los pequeños pasos importan. ¡Sigue así!",
    "Mantente constante {name}, ¡tu yo futuro te lo agradecerá!",
    "¡{name}, eres más fuerte de lo que crees!",
    "¡Esfuérzate hoy {name}, descansa después!",
    "¡{name}, termina la semana orgulloso de ti mismo!"
  ],
  ru: [
    "Привет {name}, начни неделю сильным! 💪",
    "Продолжай {name} — у тебя отлично получается!",
    "{name}, маленькие шаги имеют значение. Продолжай!",
    "Будь последовательным {name}, твоё будущее я скажет тебе спасибо!",
    "{name}, ты сильнее, чем думаешь!",
    "Немного усилий сегодня {name}, хороший отдых потом!",
    "{name}, заканчивай неделю с гордостью за себя!"
  ],
  fr: [
    "Salut {name}, commencez la semaine en force ! 💪",
    "Continuez {name} — vous faites du super travail !",
    "{name}, les petits pas comptent. Continuez !",
    "Restez constant {name}, votre futur vous remerciera !",
    "{name}, vous êtes plus fort que vous ne le pensez !",
    "Poussez un peu aujourd'hui {name}, reposez-vous bien après !",
    "{name}, terminez la semaine fier de vous !"
  ]
};

// Streak encouragement messages (for users with streak > 2 days)
const STREAK_MESSAGES: { [key: string]: string } = {
  en: "🔥 {streak} day streak! Keep the momentum going!",
  de: "🔥 {streak} Tage Serie! Behalte den Schwung bei!",
  ar: "🔥 سلسلة {streak} أيام! حافظ على الزخم!",
  es: "🔥 ¡{streak} días de racha! ¡Mantén el impulso!",
  ru: "🔥 {streak} дней подряд! Не теряй темп!",
  fr: "🔥 {streak} jours de suite ! Gardez l'élan !"
};

// Streak encouragement messages with name
const STREAK_MESSAGES_WITH_NAME: { [key: string]: string } = {
  en: "🔥 {name}, {streak} day streak! Keep the momentum going!",
  de: "🔥 {name}, {streak} Tage Serie! Behalte den Schwung bei!",
  ar: "🔥 {name}، سلسلة {streak} أيام! حافظ على الزخم!",
  es: "🔥 ¡{name}, {streak} días de racha! ¡Mantén el impulso!",
  ru: "🔥 {name}, {streak} дней подряд! Не теряй темп!",
  fr: "🔥 {name}, {streak} jours de suite ! Gardez l'élan !"
};

// App IDs to check for streaks (in priority order)
const STREAK_APP_IDS = ['german-b1', 'german-b2', 'english-b1', 'english-b2'];

// Prep plan notification messages
const PREP_PLAN_MESSAGES: { [key: string]: { [key: string]: string[] } } = {
  en: {
    tasks: [
      "You have {count} study tasks for today. Let's get them done! 📚",
      "Ready to study? You have {count} tasks waiting for you. 🚀",
      "Keep the momentum! {count} tasks to complete today. 💪"
    ],
    countdown: [
      "Only {days} days left until your exam! Every study session counts. ⏳",
      "Your exam is in {days} days. Stay focused and keep practicing! 🎯",
      "The countdown is on: {days} days to go. You've got this! 🌟"
    ],
    missed: [
      "Consistency is key! Don't let your streak break. Study today! 🔥",
      "Small steps every day lead to big results. Ready for today's tasks? 📈"
    ]
  },
  de: {
    tasks: [
      "Du hast heute {count} Lernaufgaben. Packen wir es an! 📚",
      "Bereit zum Lernen? {count} Aufgaben warten auf dich. 🚀",
      "Bleib dran! Heute stehen {count} Aufgaben an. 💪"
    ],
    countdown: [
      "Nur noch {days} Tage bis zu deiner Prüfung! Jede Lerneinheit zählt. ⏳",
      "Deine Prüfung ist in {days} Tagen. Bleib fokussiert! 🎯",
      "Der Countdown läuft: noch {days} Tage. Du schaffst das! 🌟"
    ],
    missed: [
      "Beständigkeit ist der Schlüssel! Lass deine Serie nicht reißen. Lerne heute! 🔥",
      "Kleine Schritte jeden Tag führen zum Ziel. Bereit für heute? 📈"
    ]
  },
  ar: {
    tasks: [
      "لديك {count} مهام دراسية لليوم. فلننجزها! 📚",
      "هل أنت مستعد للدراسة؟ هناك {count} مهام بانتظارك. 🚀",
      "حافظ على الزخم! لديك {count} مهام لتكملها اليوم. 💪"
    ],
    countdown: [
      "تبقى {days} أيام فقط على امتحانك! كل جلسة دراسية تفرق. ⏳",
      "امتحانك بعد {days} أيام. ابقَ مركزاً وواصل التدريب! 🎯",
      "بدأ العد التنازلي: بقي {days} أيام. أنت تستطيع فعلها! 🌟"
    ],
    missed: [
      "الاستمرارية هي المفتاح! لا تدع سلسلتك تنقطع. ادرس اليوم! 🔥",
      "الخطوات الصغيرة كل يوم تؤدي لنتائج كبيرة. مستعد لمهام اليوم؟ 📈"
    ]
  },
  es: {
    tasks: [
      "Tienes {count} tareas de estudio para hoy. ¡Hagámoslas! 📚",
      "¿Listo para estudiar? Tienes {count} tareas esperándote. 🚀",
      "¡Mantén el impulso! {count} tareas para completar hoy. 💪"
    ],
    countdown: [
      "¡Solo faltan {days} días para tu examen! Cada sesión de estudio cuenta. ⏳",
      "Tu examen es en {days} días. ¡Mantén el enfoque! 🎯",
      "La cuenta atrás ha comenzado: faltan {days} días. ¡Tú puedes! 🌟"
    ],
    missed: [
      "¡La constancia es la clave! No dejes que tu racha se rompa. ¡Estudia hoy! 🔥",
      "Pequeños pasos cada día llevan a grandes resultados. ¿Listo para hoy? 📈"
    ]
  },
  ru: {
    tasks: [
      "У тебя на сегодня {count} учебных заданий. Давай сделаем это! 📚",
      "Готов к занятиям? Тебя ждут {count} заданий. 🚀",
      "Не теряй темп! Нужно выполнить {count} заданий сегодня. 💪"
    ],
    countdown: [
      "До экзамена осталось всего {days} дней! Каждое занятие имеет значение. ⏳",
      "Твой экзамен через {days} дней. Сохраняй концентрацию! 🎯",
      "Обратный отсчет пошел: осталось {days} дней. У тебя всё получится! 🌟"
    ],
    missed: [
      "Постоянство — залог успеха! Не дай своей серии прерваться. Поучись сегодня! 🔥",
      "Маленькие шаги каждый день ведут к большим результатам. Готов? 📈"
    ]
  },
  fr: {
    tasks: [
      "Vous avez {count} tâches d'étude pour aujourd'hui. C'est parti ! 📚",
      "Prêt à étudier ? {count} tâches vous attendent. 🚀",
      "Gardez l'élan ! {count} tâches à accomplir aujourd'hui. 💪"
    ],
    countdown: [
      "Plus que {days} jours avant votre examen ! Chaque séance d'étude compte. ⏳",
      "Votre examen est dans {days} jours. Restez concentré ! 🎯",
      "Le compte à rebours est lancé : plus que {days} jours. Vous allez réussir ! 🌟"
    ],
    missed: [
      "La régularité est la clé ! Ne laissez pas votre série s'interrompre. Étudiez aujourd'hui ! 🔥",
      "De petits pas chaque jour mènent à de grands résultats. Prêt pour aujourd'hui ? 📈"
    ]
  }
};

// Placeholder image URL
const NOTIFICATION_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/notification-logo.jpg?alt=media&token=9cb214fc-72c2-4d58-8d60-1e9fbc90558a';

// Default language if user's language is not supported
const DEFAULT_LANGUAGE = 'en';

// Minimum streak days to show streak message
const MIN_STREAK_DAYS = 2;

/**
 * Extract first name from display name
 * @param displayName Full display name (e.g., "John Doe" or "John")
 * @returns First name or null if not available
 */
function extractFirstName(displayName?: string): string | null {
  if (!displayName || displayName.trim().length === 0) {
    return null;
  }
  // Get the first word as the first name
  const firstName = displayName.trim().split(/\s+/)[0];
  // Return null if first name is too short or looks like an email
  if (firstName.length < 2 || firstName.includes('@')) {
    return null;
  }
  return firstName;
}

/**
 * Get the user's highest current streak across all apps
 * @param uid User ID
 * @returns Current streak count (0 if no streak data)
 */
async function getUserStreak(uid: string): Promise<number> {
  const db = admin.firestore();
  let highestStreak = 0;

  try {
    // Check streak documents for all app IDs
    for (const appId of STREAK_APP_IDS) {
      const streakDoc = await db
        .collection('users')
        .doc(uid)
        .collection('streaks')
        .doc(appId)
        .get();

      if (streakDoc.exists) {
        const data = streakDoc.data();
        const currentStreak = data?.currentStreak || 0;
        if (currentStreak > highestStreak) {
          highestStreak = currentStreak;
        }
      }
    }
  } catch (error) {
    console.warn(`[getUserStreak] Error fetching streak for user ${uid}:`, error);
    // Return 0 on error - will use fallback message
  }

  return highestStreak;
}

/**
 * Get active prep plan for a user
 * @param uid User ID
 * @returns Active study plan or null
 */
async function getActivePrepPlan(uid: string): Promise<any | null> {
  const db = admin.firestore();
  
  try {
    // Check common exam IDs for active plans
    for (const examId of STREAK_APP_IDS) {
      const planDoc = await db
        .collection('users')
        .doc(uid)
        .collection('prep-plan')
        .doc(examId)
        .get();
        
      if (planDoc.exists) {
        const plan = planDoc.data();
        if (plan && plan.isActive && !plan.isPaused) {
          return plan;
        }
      }
    }
  } catch (error) {
    console.warn(`[getActivePrepPlan] Error fetching plan for user ${uid}:`, error);
  }
  
  return null;
}

/**
 * Build personalized notification body for prep plan
 * @param plan Active study plan
 * @param userLanguage User's language code
 * @returns Personalized message or null if no appropriate message
 */
function buildPrepPlanNotificationBody(plan: any, userLanguage: string): string | null {
  const lang = PREP_PLAN_MESSAGES[userLanguage] ? userLanguage : DEFAULT_LANGUAGE;
  const messages = PREP_PLAN_MESSAGES[lang];
  
  const now = new Date();
  
  // 1. Check if exam is very soon (countdown)
  const examDate = plan.endDate instanceof admin.firestore.Timestamp 
    ? plan.endDate.toDate() 
    : new Date(plan.endDate);
    
  const diffTime = examDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Final week countdown (if 1-7 days left)
  if (diffDays > 0 && diffDays <= 7) {
    const countdownMessages = messages.countdown;
    const index = now.getDay() % countdownMessages.length;
    return countdownMessages[index].replace('{days}', diffDays.toString());
  }
  
  // 2. Check for today's tasks
  const currentWeekNum = plan.currentWeek || 1;
  const currentWeek = plan.weeks?.find((w: any) => w.weekNumber === currentWeekNum);
  
  if (currentWeek && currentWeek.tasks) {
    const incompleteTasks = currentWeek.tasks.filter((t: any) => !t.completed);
    if (incompleteTasks.length > 0) {
      // If user missed studying yesterday
      const lastStudyDateStr = plan.progress?.lastStudyDate; // ISO string
      if (lastStudyDateStr) {
        const lastStudyDate = new Date(lastStudyDateStr);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastStudyDate.toDateString() !== now.toDateString() && 
            lastStudyDate.toDateString() !== yesterday.toDateString()) {
          const missedMessages = messages.missed;
          return missedMessages[now.getDay() % missedMessages.length];
        }
      }
      
      // Default: Today's tasks reminder
      const taskMessages = messages.tasks;
      return taskMessages[now.getDay() % taskMessages.length].replace('{count}', incompleteTasks.length.toString());
    }
  }
  
  // 3. Middle-term countdown (every few days if not in final week)
  if (diffDays > 0 && diffDays % 3 === 0) {
    const countdownMessages = messages.countdown;
    return countdownMessages[now.getDay() % countdownMessages.length].replace('{days}', diffDays.toString());
  }
  
  return null;
}

/**
 * Build personalized notification body
 * @param userLanguage User's language code
 * @param dayOfWeek Current day of week (0=Sunday, 6=Saturday)
 * @param firstName User's first name (or null)
 * @param streakDays Current streak days (0 if no streak)
 * @returns Notification body text
 */
function buildNotificationBody(
  userLanguage: string,
  dayOfWeek: number,
  firstName: string | null,
  streakDays: number
): string {
  // Priority 1: Streak message if streak > MIN_STREAK_DAYS
  if (streakDays > MIN_STREAK_DAYS) {
    const streakTemplate = firstName
      ? (STREAK_MESSAGES_WITH_NAME[userLanguage] || STREAK_MESSAGES_WITH_NAME[DEFAULT_LANGUAGE])
      : (STREAK_MESSAGES[userLanguage] || STREAK_MESSAGES[DEFAULT_LANGUAGE]);
    
    let message = streakTemplate.replace('{streak}', streakDays.toString());
    if (firstName) {
      message = message.replace('{name}', firstName);
    }
    return message;
  }

  // Priority 2: Personalized message with name
  if (firstName) {
    const personalizedMessages = PERSONALIZED_MESSAGES[userLanguage] || PERSONALIZED_MESSAGES[DEFAULT_LANGUAGE];
    return personalizedMessages[dayOfWeek].replace('{name}', firstName);
  }

  // Fallback: Original motivational message
  const fallbackMessages = MOTIVATIONAL_MESSAGES[userLanguage] || MOTIVATIONAL_MESSAGES[DEFAULT_LANGUAGE];
  return fallbackMessages[dayOfWeek];
}

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

  // Extract first name and get streak data for personalization
  const firstName = extractFirstName(displayName);
  const streakDays = await getUserStreak(uid);

  // Check for active prep plan
  const activePlan = await getActivePrepPlan(uid);
  let body = '';
  let notificationType = 'daily_reminder';
  
  if (activePlan) {
    const prepPlanBody = buildPrepPlanNotificationBody(activePlan, userLanguage);
    if (prepPlanBody) {
      body = prepPlanBody;
      notificationType = 'prep_plan_reminder';
    }
  }

  // Fallback to regular notification if no prep plan message
  if (!body) {
    body = buildNotificationBody(userLanguage, dayOfWeek, firstName, streakDays);
  }

  // Send notification
  await admin.messaging().send({
    token: deviceId,
    notification: {
      title,
      body,
      imageUrl: NOTIFICATION_IMAGE_URL
    },
    data: {
      type: notificationType,
      screen: activePlan ? 'StudyPlanDashboard' : 'home'
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

  console.log(`[sendNotification] Sent notification to user ${uid} (${firstName || displayName || 'unknown'}) in ${userLanguage}, streak: ${streakDays}, message: "${body}"`);
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

