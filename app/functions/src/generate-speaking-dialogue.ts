import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { getOpenAIKey } from './api-keys';
import { ExamLanguage, ExamLevel } from './types';

// Lazy-initialize OpenAI client to ensure environment variables are loaded
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getOpenAIKey(),
    });
  }
  return openaiClient;
}

interface SpeakingDialogueTurn {
  speaker: 'user' | 'ai';
  text: string;
  expectedResponse?: string; // For user turns, what kind of response is expected
  aiAudioUrl?: string; // Will be generated separately
}

/**
 * Generate a short test dialogue for quick testing
 */
function generateTestDialogue(
  level: ExamLevel,
  language: ExamLanguage
): SpeakingDialogueTurn[] {
  const isGerman = language === 'german';
  
  const dialogue: SpeakingDialogueTurn[] = [];
  
  // AI greeting and first question
  dialogue.push({
    speaker: 'ai',
    text: isGerman ? 'Guten Tag! Wie heißt du?' : 'Hello! What is your name?',
    expectedResponse: 'Name introduction',
  });
  
  // User response
  dialogue.push({
    speaker: 'user',
    text: '',
    expectedResponse: 'Name introduction',
  });
  
  // AI second question
  dialogue.push({
    speaker: 'ai',
    text: isGerman ? 'Woher kommst du?' : 'Where are you from?',
    expectedResponse: 'Country/city',
  });
  
  // User response
  dialogue.push({
    speaker: 'user',
    text: '',
    expectedResponse: 'Country/city',
  });
  
  // AI closing
  dialogue.push({
    speaker: 'ai',
    text: isGerman ? 'Vielen Dank!' : 'Thank you!',
  });
  
  return dialogue;
}

/**
 * Cloud Function to generate a personalized speaking dialogue
 * for exam preparation or assessment
 */
export const generateSpeakingDialogue = functions.https.onRequest(
  async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { level, partNumber, language, isDiagnostic, isTesting } = req.body;

    console.log('[generateSpeakingDialogue] Request received:', {
      level,
      partNumber,
      language,
      isDiagnostic,
      isTesting,
    });

    // Validate input
    if (!['A1', 'B1', 'B2'].includes(level)) {
      res.status(400).json({ error: 'Invalid level: ' + level });
      return;
    }

    if (!['german', 'english'].includes(language)) {
      res.status(400).json({ error: 'Invalid language: ' + language });
      return;
    }

    if (![1, 2, 3].includes(partNumber)) {
      res.status(400).json({ error: 'Invalid part number: ' + partNumber });
      return;
    }

    try {
      // For testing, return a short 2-turn dialogue
      if (!isTesting) {
        console.log('[generateSpeakingDialogue] Generating TEST dialogue');
        const dialogue = generateTestDialogue(level, language);
        const dialogueId = `dialogue-test-${Date.now()}`;
        
        console.log('[generateSpeakingDialogue] Test dialogue generated:', {
          dialogueId,
          turnsCount: dialogue.length,
        });
        
        res.status(200).json({
          dialogueId,
          dialogue,
          estimatedMinutes: 1,
        });
        return;
      }
      
      console.log('[generateSpeakingDialogue] Generating FULL dialogue');
      // For diagnostic, generate unified dialogue
      const dialogue = isDiagnostic 
        ? await generateDiagnosticDialogue(level, language)
        : await generateDialogueForPart(level, partNumber, language);
      
      const dialogueId = `dialogue-${Date.now()}`;

      res.status(200).json({
        dialogueId,
        dialogue,
        estimatedMinutes: calculateEstimatedTime(dialogue),
      });
    } catch (error: any) {
      console.error('Error generating speaking dialogue:', error);
      res.status(500).json({
        error: 'Failed to generate dialogue',
        message: error.message,
      });
    }
  }
);

/**
 * Generate dialogue based on exam level and part
 */
async function generateDialogueForPart(
  level: ExamLevel,
  partNumber: number,
  language: ExamLanguage
): Promise<SpeakingDialogueTurn[]> {
  const examName = language === 'german' ? 'TELC German' : 'TELC English';

  // Part 1 is always personal introduction for all levels
  if (partNumber === 1) {
    return generatePersonalIntroductionDialogue(level, language);
  }

  // For B1/B2, generate other parts using AI
  const prompt = buildPromptForPart(level, partNumber, language, examName);
  
  const openai = getOpenAIClient();
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
 * Generate unified diagnostic dialogue
 * Combines quick personal introduction with level-appropriate tasks
 */
async function generateDiagnosticDialogue(
  level: ExamLevel,
  language: ExamLanguage
): Promise<SpeakingDialogueTurn[]> {
  const isGerman = language === 'german';
  const examName = language === 'german' ? 'TELC German' : 'TELC English';
  const lang = isGerman ? 'German' : 'English';

  // Quick intro (2-3 questions) + task-based questions (4-6 exchanges)
  const introQuestions = {
    A1: isGerman ? [
      { ai: 'Guten Tag! Wie heißt du?', expectedUser: 'Name introduction' },
      { ai: 'Woher kommst du?', expectedUser: 'Country/city' },
    ] : [
      { ai: 'Hello! What is your name?', expectedUser: 'Name introduction' },
      { ai: 'Where are you from?', expectedUser: 'Country/city' },
    ],
    B1: isGerman ? [
      { ai: 'Guten Tag! Bitte stellen Sie sich kurz vor.', expectedUser: 'Brief introduction' },
      { ai: 'Was machen Sie beruflich oder studieren Sie?', expectedUser: 'Work/study' },
    ] : [
      { ai: 'Good day! Please introduce yourself briefly.', expectedUser: 'Brief introduction' },
      { ai: 'What do you do for work or are you studying?', expectedUser: 'Work/study' },
    ],
    B2: isGerman ? [
      { ai: 'Guten Tag! Stellen Sie sich bitte vor.', expectedUser: 'Introduction' },
      { ai: 'Was ist Ihr beruflicher Hintergrund?', expectedUser: 'Professional background' },
    ] : [
      { ai: 'Good day! Please introduce yourself.', expectedUser: 'Introduction' },
      { ai: 'What is your professional background?', expectedUser: 'Professional background' },
    ],
  };

  // Build intro turns
  const dialogue: SpeakingDialogueTurn[] = [];
  const selectedIntro = introQuestions[level as keyof typeof introQuestions];
  
  selectedIntro.forEach((q) => {
    dialogue.push({
      speaker: 'ai',
      text: q.ai,
      expectedResponse: q.expectedUser,
    });
    dialogue.push({
      speaker: 'user',
      text: '',
      expectedResponse: q.expectedUser,
    });
  });

  // Generate task-based portion using AI
  const taskPrompt = buildDiagnosticTaskPrompt(level, language, lang, examName);
  
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert ${examName} diagnostic assessment creator. Generate natural, level-appropriate speaking tasks.`,
      },
      {
        role: 'user',
        content: taskPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const responseText = completion.choices[0].message.content || '';
  const taskTurns = parseDialogueFromAI(responseText);
  
  // Combine intro and task portions
  return [...dialogue, ...taskTurns];
}

/**
 * Build prompt for diagnostic task generation
 */
function buildDiagnosticTaskPrompt(
  level: ExamLevel,
  language: ExamLanguage,
  lang: string,
  examName: string
): string {
  const taskDescriptions = {
    A1: 'simple everyday situations like ordering food, asking for directions, or talking about daily routines',
    B1: 'planning a trip together, discussing hobbies and preferences, or sharing opinions about familiar topics',
    B2: 'discussing a current event or complex topic, problem-solving scenarios, or expressing and defending opinions',
  };

  const exchanges = level === 'A1' ? '4-5' : level === 'B1' ? '5-6' : '5-6';

  return `Generate ${exchanges} conversational exchanges in ${lang} for a ${examName} ${level} diagnostic speaking assessment.

Context: The user has already introduced themselves. Now continue the conversation with ${taskDescriptions[level as keyof typeof taskDescriptions]}.

Requirements:
1. Create a smooth transition from the introduction
2. Use ${level}-appropriate vocabulary and grammar
3. Make it feel like a natural conversation, not an interrogation
4. Include ${exchanges} complete exchanges (AI speaks, user responds)
5. End with a brief closing statement from the AI examiner

Format each turn as:
[AI] The AI's question or statement in ${lang}
[USER_EXPECTED] Brief description of expected response type
[USER] (leave blank)

Generate the dialogue now:`;
}

/**
 * Generate Part 1 dialogue (Personal Introduction)
 * This is standardized for all levels with difficulty variations
 */
function generatePersonalIntroductionDialogue(
  level: ExamLevel,
  language: ExamLanguage
): SpeakingDialogueTurn[] {
  const isGerman = language === 'german';

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

  const selectedQuestions = questions[level as keyof typeof questions];
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
  level: ExamLevel,
  partNumber: number,
  language: ExamLanguage,
  examName: string
): string {
  const lang = language === 'german' ? 'German' : 'English';
  
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

