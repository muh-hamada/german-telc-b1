import { evaluateWritingB1 } from './evaluate-german-b1';
import { evaluateWritingEnglishB1 } from './evaluate-english-b1';
import { evaluateWritingB2 } from './evaluate-german-b2';
import { evaluateWritingEnglishB2 } from './evaluate-english-b2';
import { evaluateWritingGermanA1 } from './evaluate-german-a1';
import { deleteUserAccount } from './delete-user-account';
import { syncNotificationIndex } from './sync-notification-index';
import { sendScheduledNotifications } from './send-scheduled-notifications';
import { sendTestNotification } from './send-scheduled-notifications';
import { 
  onUserUpdate, 
  onVocabularyUpdate, 
  onStreakUpdate, 
  onProgressUpdate,
  onPremiumUpdate
} from './user-analytics';
import { generateSpeakingDialogue } from './generate-speaking-dialogue';
import { evaluateSpeaking } from './evaluate-speaking';
import { generatePrepPlan } from './generate-prep-plan';

export {
  evaluateWritingB1 as evaluateWriting, // Backward compatibility
  evaluateWritingEnglishB1,
  evaluateWritingB2,
  evaluateWritingEnglishB2,
  evaluateWritingGermanA1,
  deleteUserAccount,
  syncNotificationIndex,
  sendScheduledNotifications,
  sendTestNotification,
  onUserUpdate,
  onVocabularyUpdate,
  onStreakUpdate,
  onProgressUpdate,
  onPremiumUpdate,
  generateSpeakingDialogue,
  evaluateSpeaking,
  generatePrepPlan
};
