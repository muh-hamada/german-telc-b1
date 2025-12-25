import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './api-keys';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface SpeakingDialogueTurn {
  speaker: 'user' | 'ai';
  text: string;
  expectedResponse?: string; // For user turns, what kind of response is expected
  aiAudioUrl?: string; // Will be generated separately
}

interface GenerateSpeakingDialogueRequest {
  level: 'A1' | 'B1' | 'B2';
  partNumber: 1 | 2 | 3;
  language: 'de' | 'en'; // German or English exam
}

interface GenerateSpeakingDialogueResponse {
  dialogueId: string;
  dialogue: SpeakingDialogueTurn[];
  estimatedMinutes: number;
}

/**
 * Cloud Function to generate a personalized speaking dialogue
 * for exam preparation or assessment
 */
export const generateSpeakingDialogue = functions.https.onCall(
  async (data: GenerateSpeakingDialogueRequest, context): Promise<GenerateSpeakingDialogueResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate speaking dialogues'
      );
    }

    const { level, partNumber, language } = data;

    // Validate input
    if (!['A1', 'B1', 'B2'].includes(level)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid level');
    }

    if (!['de', 'en'].includes(language)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid language');
    }

    if (![1, 2, 3].includes(partNumber)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid part number');
    }

    try {
      const dialogue = await generateDialogueForPart(level, partNumber, language);
      const dialogueId = `dialogue-${context.auth.uid}-${Date.now()}`;

      return {
        dialogueId,
        dialogue,
        estimatedMinutes: calculateEstimatedTime(dialogue),
      };
    } catch (error: any) {
      console.error('Error generating speaking dialogue:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to generate dialogue: ${error.message}`
      );
    }
  }
);

/**
 * Generate dialogue based on exam level and part
 */
async function generateDialogueForPart(
  level: 'A1' | 'B1' | 'B2',
  partNumber: number,
  language: 'de' | 'en'
): Promise<SpeakingDialogueTurn[]> {
  const examName = language === 'de' ? 'TELC German' : 'TELC English';

  // Part 1 is always personal introduction for all levels
  if (partNumber === 1) {
    return generatePersonalIntroductionDialogue(level, language);
  }

  // For B1/B2, generate other parts using AI
  const prompt = buildPromptForPart(level, partNumber, language, examName);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert ${examName} exam preparation assistant. Generate realistic speaking practice dialogues that match the exam format and difficulty.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const responseText = completion.choices[0].message.content || '';
  return parseDialogueFromAI(responseText);
}

/**
 * Generate Part 1 dialogue (Personal Introduction)
 * This is standardized for all levels with difficulty variations
 */
function generatePersonalIntroductionDialogue(
  level: 'A1' | 'B1' | 'B2',
  language: 'de' | 'en'
): SpeakingDialogueTurn[] {
  const isGerman = language === 'de';

  // Base questions adjusted by level
  const questions = {
    A1: isGerman ? [
      { ai: 'Guten Tag! Wie heißt du?', expectedUser: 'Name introduction' },
      { ai: 'Woher kommst du?', expectedUser: 'Country/city' },
      { ai: 'Wie alt bist du?', expectedUser: 'Age' },
      { ai: 'Was machst du gerne?', expectedUser: 'Hobbies' },
      { ai: 'Vielen Dank! Das war gut.', expectedUser: null },
    ] : [
      { ai: 'Hello! What is your name?', expectedUser: 'Name introduction' },
      { ai: 'Where are you from?', expectedUser: 'Country/city' },
      { ai: 'How old are you?', expectedUser: 'Age' },
      { ai: 'What do you like to do?', expectedUser: 'Hobbies' },
      { ai: 'Thank you! That was good.', expectedUser: null },
    ],
    B1: isGerman ? [
      { ai: 'Guten Tag! Stellen Sie sich bitte kurz vor.', expectedUser: 'Full introduction' },
      { ai: 'Erzählen Sie mir etwas über Ihre Arbeit oder Ihr Studium.', expectedUser: 'Work/study details' },
      { ai: 'Was sind Ihre Hobbys oder Interessen?', expectedUser: 'Hobbies and interests' },
      { ai: 'Warum lernen Sie Deutsch?', expectedUser: 'Motivation' },
      { ai: 'Danke schön! Das war sehr gut.', expectedUser: null },
    ] : [
      { ai: 'Good day! Please introduce yourself briefly.', expectedUser: 'Full introduction' },
      { ai: 'Tell me something about your work or studies.', expectedUser: 'Work/study details' },
      { ai: 'What are your hobbies or interests?', expectedUser: 'Hobbies and interests' },
      { ai: 'Why are you learning English?', expectedUser: 'Motivation' },
      { ai: 'Thank you! That was very good.', expectedUser: null },
    ],
    B2: isGerman ? [
      { ai: 'Guten Tag! Bitte stellen Sie sich vor und erzählen Sie etwas über Ihren beruflichen Hintergrund.', expectedUser: 'Professional introduction' },
      { ai: 'Welche Ziele verfolgen Sie mit dem Deutschlernen?', expectedUser: 'Learning goals' },
      { ai: 'Beschreiben Sie mir eine interessante Erfahrung aus Ihrem Leben.', expectedUser: 'Personal anecdote' },
      { ai: 'Wie bleiben Sie motiviert beim Sprachenlernen?', expectedUser: 'Motivation strategies' },
      { ai: 'Ausgezeichnet! Vielen Dank für das Gespräch.', expectedUser: null },
    ] : [
      { ai: 'Good day! Please introduce yourself and tell me about your professional background.', expectedUser: 'Professional introduction' },
      { ai: 'What goals do you have with learning English?', expectedUser: 'Learning goals' },
      { ai: 'Describe an interesting experience from your life.', expectedUser: 'Personal anecdote' },
      { ai: 'How do you stay motivated when learning languages?', expectedUser: 'Motivation strategies' },
      { ai: 'Excellent! Thank you for the conversation.', expectedUser: null },
    ],
  };

  const selectedQuestions = questions[level];
  const dialogue: SpeakingDialogueTurn[] = [];

  // Build turn-based dialogue
  selectedQuestions.forEach((q) => {
    // AI speaks
    dialogue.push({
      speaker: 'ai',
      text: q.ai,
      expectedResponse: q.expectedUser || undefined,
    });

    // User responds (except for the final closing statement)
    if (q.expectedUser) {
      dialogue.push({
        speaker: 'user',
        text: '', // Will be filled by user's actual response
        expectedResponse: q.expectedUser,
      });
    }
  });

  return dialogue;
}

/**
 * Build prompt for AI to generate Part 2/3 dialogues
 */
function buildPromptForPart(
  level: 'A1' | 'B1' | 'B2',
  partNumber: number,
  language: 'de' | 'en',
  examName: string
): string {
  const lang = language === 'de' ? 'German' : 'English';
  
  let partDescription = '';
  
  if (partNumber === 2) {
    partDescription = `Part 2: Guided Conversation / Discussion
    - Topic-based conversation (everyday situations, opinions)
    - ${level === 'A1' ? '4-5' : level === 'B1' ? '5-6' : '6-7'} exchanges
    - Natural back-and-forth dialogue`;
  } else if (partNumber === 3) {
    partDescription = `Part 3: Problem-Solving / Planning Task
    - Collaborative planning or problem-solving scenario
    - ${level === 'B1' ? '5-6' : '6-7'} exchanges
    - Requires negotiation and suggestion`;
  }

  return `Generate a realistic ${examName} ${level} speaking exam practice dialogue for ${partDescription}.

Requirements:
1. Create a natural, realistic conversation in ${lang}
2. Match the ${level} difficulty level
3. Follow this format for EACH turn:
   [AI] The AI's question or statement
   [USER_EXPECTED] Brief description of what the user should say
   [USER] (leave blank - will be filled by actual user)

4. Include ${level === 'A1' ? '4-5' : level === 'B1' ? '5-6' : '6-7'} complete exchanges
5. Start with context-setting by the AI
6. End with a closing statement by the AI
7. Use appropriate vocabulary and grammar complexity for ${level} level

Example format:
[AI] Question or statement here
[USER_EXPECTED] Expected type of response
[USER] 
[AI] Next question
[USER_EXPECTED] Expected type of response
[USER]

Generate the dialogue now:`;
}

/**
 * Parse AI-generated dialogue into structured format
 */
function parseDialogueFromAI(aiResponse: string): SpeakingDialogueTurn[] {
  const dialogue: SpeakingDialogueTurn[] = [];
  const lines = aiResponse.split('\n').filter(line => line.trim());

  let currentAI = '';
  let currentExpected = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('[AI]')) {
      if (currentAI && currentExpected) {
        // Save previous AI turn
        dialogue.push({
          speaker: 'ai',
          text: currentAI,
          expectedResponse: currentExpected,
        });
        
        // Add user turn
        dialogue.push({
          speaker: 'user',
          text: '',
          expectedResponse: currentExpected,
        });
      }
      
      currentAI = trimmed.replace('[AI]', '').trim();
      currentExpected = '';
    } else if (trimmed.startsWith('[USER_EXPECTED]')) {
      currentExpected = trimmed.replace('[USER_EXPECTED]', '').trim();
    }
  }

  // Add final turn
  if (currentAI) {
    if (currentExpected) {
      dialogue.push({
        speaker: 'ai',
        text: currentAI,
        expectedResponse: currentExpected,
      });
      dialogue.push({
        speaker: 'user',
        text: '',
        expectedResponse: currentExpected,
      });
    } else {
      // Final closing statement (no user response needed)
      dialogue.push({
        speaker: 'ai',
        text: currentAI,
      });
    }
  }

  return dialogue;
}

/**
 * Calculate estimated time based on dialogue length
 */
function calculateEstimatedTime(dialogue: SpeakingDialogueTurn[]): number {
  // Rough estimate: 30 seconds per exchange, plus buffer
  const numExchanges = dialogue.filter(t => t.speaker === 'user').length;
  const estimatedSeconds = numExchanges * 30 + 60; // +60s buffer
  return Math.ceil(estimatedSeconds / 60); // Convert to minutes
}

