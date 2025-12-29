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
  aiAudioUrl?: string; // Will be generated separately
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

    const { level, language } = req.body;

    console.log('[generateSpeakingDialogue] Request received:', {
      level,
      language,
    });

    // Validate input
    if (!['A1', 'B1', 'B2'].includes(level)) {
      res.status(400).json({ error: 'Invalid level: ' + level });
      return;
    }

    if (!['german', 'english'].includes(language)) {
      console.error('[generateSpeakingDialogue] Invalid language:', language);
      res.status(400).json({ error: 'Invalid language: ' + language });
      return;
    }

    try {
      console.log('[generateSpeakingDialogue] Generating UNIFIED dialogue');
      const dialogue = await generateUnifiedDialogue(level, language);
      
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
 * Generate a unified dialogue covering all 3 parts of the exam:
 * 1. Personal Introduction
 * 2. Planning Something Together
 * 3. Sharing an Opinion
 */
async function generateUnifiedDialogue(
  level: ExamLevel,
  language: ExamLanguage
): Promise<SpeakingDialogueTurn[]> {
  const isGerman = language === 'german';
  const examName = isGerman ? 'TELC German' : 'TELC English';
  const lang = isGerman ? 'German' : 'English';

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
 */

/**
 * Build prompt for diagnostic task generation
 */

/**
 * Generate Part 1 dialogue (Personal Introduction)
 */

/**
 * Build prompt for AI to generate Part 2/3 dialogues
 */

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

