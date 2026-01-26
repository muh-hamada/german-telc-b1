import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import { getOpenAIKey } from './api-keys';
import { ExamLanguage, ExamLevel } from './types';
import dialoguesData from './speaking-dialogues.json';

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
  text?: string;
  instruction?: {
    de: string;
    ar: string;
    en: string;
    ru: string;
    es: string;
    fr: string;
  };
  aiAudioUrl?: string; // Will be generated separately
  audio_url?: string; // Pre-generated audio URL from JSON
}

/**
 * Cloud Function to return a pre-generated speaking dialogue
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

    const { level, language, practicedDialogueIds } = req.body;

    console.log('[generateSpeakingDialogue] Request received:', {
      level,
      language,
      practicedDialogueIds,
    });

    // Validate input
    if (!['A1', 'B1', 'B2'].includes(level)) {
      res.status(400).json({ error: 'Invalid level: ' + level });
      return;
    }

    if (!['german', 'english', 'spanish'].includes(language)) {
      console.error('[generateSpeakingDialogue] Invalid language:', language);
      res.status(400).json({ error: 'Invalid language: ' + language });
      return;
    }

    try {
      // Use static dialogue from JSON with rotation logic
      const { dialogueId, dialogue } = getStaticDialogue(level, language, practicedDialogueIds);

      console.log('[generateSpeakingDialogue] Static dialogue retrieved:', dialogueId);

      res.status(200).json({
        dialogueId,
        dialogue,
        estimatedMinutes: calculateEstimatedTime(dialogue),
      });
    } catch (error: any) {
      console.error('Error retrieving speaking dialogue:', error);
      res.status(404).json({
        error: 'Dialogue not found',
        message: error.message,
      });
    }
  }
);

interface DialogueWithId {
  id: string;
  turns: SpeakingDialogueTurn[];
}

/**
 * Retrieve a pre-generated dialogue from the JSON data with rotation logic
 */
function getStaticDialogue(
  level: ExamLevel,
  language: ExamLanguage,
  practicedDialogueIds?: string[]
): { dialogueId: string; dialogue: SpeakingDialogueTurn[] } {
  const levelKey = level.toLowerCase() as keyof typeof dialoguesData;
  const levelData = dialoguesData[levelKey];

  if (!levelData) {
    throw new Error(`No dialogues found for level: ${level}`);
  }

  const dialogueData = (levelData as any)[language];
  if (!dialogueData) {
    throw new Error(`No dialogue found for level: ${level} and language: ${language}`);
  }

  // Check if dialogueData is an array of dialogues with IDs (new schema)
  if (Array.isArray(dialogueData)) {
    // New schema: array of dialogue objects with id field
    const availableDialogues = dialogueData as DialogueWithId[];
    
    if (availableDialogues.length === 0) {
      throw new Error(`No dialogues available for level: ${level} and language: ${language}`);
    }

    // If no practice history provided, return the first dialogue
    if (!practicedDialogueIds || practicedDialogueIds.length === 0) {
      const firstDialogue = availableDialogues[0];
      return {
        dialogueId: firstDialogue.id,
        dialogue: firstDialogue.turns,
      };
    }

    // Count frequency of each dialogue ID in practice history
    const counts = new Map<string, number>();
    
    // Initialize all available dialogues with count 0
    availableDialogues.forEach(d => counts.set(d.id, 0));
    
    // Count how many times each dialogue was practiced
    practicedDialogueIds.forEach(id => {
      if (counts.has(id)) {
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    });

    // Find the minimum count (least practiced)
    const minCount = Math.min(...Array.from(counts.values()));
    
    // Find the first dialogue with the minimum count
    const leastPracticedDialogue = availableDialogues.find(d => counts.get(d.id) === minCount);
    
    if (!leastPracticedDialogue) {
      // Fallback to first dialogue if something goes wrong
      const firstDialogue = availableDialogues[0];
      return {
        dialogueId: firstDialogue.id,
        dialogue: firstDialogue.turns,
      };
    }

    console.log('[getStaticDialogue] Selected dialogue:', leastPracticedDialogue.id, 'with count:', minCount);
    
    return {
      dialogueId: leastPracticedDialogue.id,
      dialogue: leastPracticedDialogue.turns,
    };
  } else {
    // Old schema: single dialogue array (for B1, B2 that haven't been updated yet)
    // Generate a unique ID for backward compatibility
    const dialogueId = `dialogue-${level.toLowerCase()}-${language}`;
    return {
      dialogueId,
      dialogue: dialogueData as SpeakingDialogueTurn[],
    };
  }
}

/**
 * Generate a unified dialogue covering all 3 parts of the exam:
 * 1. Personal Introduction
 * 2. Planning Something Together
 * 3. Sharing an Opinion
 * 
 * NOTE: Currently unused in favor of getStaticDialogue
 */
// @ts-ignore - Kept for future use as requested
async function generateUnifiedDialogue(
  level: ExamLevel,
  language: ExamLanguage
): Promise<SpeakingDialogueTurn[]> {
  const languageMap: Record<string, string> = {
    'german': 'German',
    'english': 'English',
    'spanish': 'Spanish'
  };
  const lang = languageMap[language] || 'English';
  const examName = language === 'spanish' ? `DELE ${lang}` : `TELC ${lang}`;

  const prompt = `Generate a realistic ${examName} ${level} speaking assessment dialogue.
The dialogue MUST cover all three parts of the exam in a single flow:

1. **Part 1: Personal Introduction** (AI asks 2-3 introductory questions)
2. **Part 2: Planning Task** (AI and user plan an event or activity together)
3. **Part 3: Opinion Sharing** (AI asks the user's opinion on a specific topic)

Requirements:
- Difficulty: Strictly match ${level} level.
- Language: Entirely in ${lang}.
- Format: Use [AI] for AI turns and [USER_EXPECTED] for describing the user's turn.
- Total Exchanges: Around 8-10 complete exchanges.
- Smooth transitions between the parts.

Format for each turn (NO JSON, JUST PLAIN TEXT with markers):
[AI] AI text
[USER_EXPECTED] Description of expected user response
[USER] (leave blank)

Generate the full unified dialogue now:`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert ${examName} examiner. Generate comprehensive, natural-sounding assessment dialogues in JSON-like text format.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0].message.content || '';
  return parseDialogueFromAI(responseText);
}

/**
 * Parse AI-generated dialogue into structured format
 * NOTE: Currently unused in favor of getStaticDialogue
 */
// @ts-ignore - Kept for future use as requested
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
        });
        
        // Add user turn
        dialogue.push({
          speaker: 'user',
          text: currentExpected, // Put expected response in text for user turns
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
      });
      dialogue.push({
        speaker: 'user',
        text: currentExpected,
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
