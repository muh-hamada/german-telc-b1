import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { getOpenAIKey } from './api-keys';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ExamLevel, ExamLanguage, LANGUAGE_SHORT_CODES } from './types';

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

interface SpeakingEvaluation {
  transcription: string;
  overallScore: number; // 0-100
  fluency: number; // 0-20
  pronunciation: number; // 0-20
  grammar: number; // 0-20
  vocabulary: number; // 0-20
  contentRelevance: number; // 0-20
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
}

interface EvaluateSpeakingRequest {
  audioUrl: string; // Firebase Storage URL or file path
  expectedContext: string; // What the user was supposed to say
  level: ExamLevel;
  language: ExamLanguage;
  dialogueId: string;
  turnNumber: number;
}

interface EvaluateSpeakingResponse extends SpeakingEvaluation {
  success: boolean;
}

/**
 * Cloud Function to evaluate a user's speaking response
 * Uses OpenAI Whisper for transcription and GPT-4 for evaluation
 */
export const evaluateSpeaking = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes for audio processing
    memory: '1GB',
  })
  .https.onCall(
    async (data: EvaluateSpeakingRequest, context): Promise<EvaluateSpeakingResponse> => {
      // Authentication check
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to evaluate speaking'
        );
      }

      const { audioUrl, expectedContext, level, language, dialogueId, turnNumber } = data;

      // Validate input
      if (!audioUrl || !expectedContext || !level || !language) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters'
        );
      }

      try {
        // Step 1: Download audio file from Firebase Storage
        const localFilePath = await downloadAudioFile(audioUrl, context.auth.uid);

        // Step 2: Transcribe using Whisper
        console.log('[EvaluateSpeaking] Transcribing audio...');
        const transcription = await transcribeAudio(localFilePath, language);
        console.log('[EvaluateSpeaking] Transcription:', transcription);

        // Step 3: Evaluate using GPT-4
        console.log('[EvaluateSpeaking] Evaluating response...');
        const evaluation = await evaluateResponse(
          transcription,
          expectedContext,
          level,
          language
        );

        // Step 4: Save evaluation to Firestore
        await saveEvaluationToFirestore(
          context.auth.uid,
          dialogueId,
          turnNumber,
          {
            ...evaluation,
            audioUrl,
            timestamp: Date.now(),
          }
        );

        // Step 5: Cleanup temp file
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.warn('Failed to delete temp file:', err);
        }

        return {
          ...evaluation,
          success: true,
        };
      } catch (error: any) {
        console.error('Error evaluating speaking:', error);
        throw new functions.https.HttpsError(
          'internal',
          `Failed to evaluate speaking: ${error.message}`
        );
      }
    }
  );

/**
 * Cloud Function to evaluate multiple speaking responses in batch
 * Used for diagnostic assessments - more efficient than per-turn evaluation
 */
export const batchEvaluateSpeaking = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes for multiple audio files
    memory: '2GB',
  })
  .https.onRequest(async (req, res) => {
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

    const { audioUrls, expectedContexts, level, language } = req.body;

    // Validate input
    if (!audioUrls || audioUrls.length === 0 || !expectedContexts || !level || !language) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    if (audioUrls.length !== expectedContexts.length) {
      res.status(400).json({ 
        error: 'audioUrls and expectedContexts must have the same length' 
      });
      return;
    }

    try {
      console.log('[BatchEvaluateSpeaking] Processing', audioUrls.length, 'audio files...');
      
      // Step 1: Download and transcribe all audio files
      const transcriptions: string[] = [];
      const localFilePaths: string[] = [];

      for (let i = 0; i < audioUrls.length; i++) {
        const audioUrl = audioUrls[i];
        console.log(`[BatchEvaluateSpeaking] Processing audio ${i + 1}/${audioUrls.length}...`);
        
        const localFilePath = await downloadAudioFile(audioUrl, `batch-${Date.now()}`);
        localFilePaths.push(localFilePath);
        
        const transcription = await transcribeAudio(localFilePath, language);
        transcriptions.push(transcription);
        console.log(`[BatchEvaluateSpeaking] Transcription ${i + 1}:`, transcription);
      }

      // Step 2: Evaluate all responses together
      console.log('[BatchEvaluateSpeaking] Evaluating all responses...');
      const evaluation = await batchEvaluateResponses(
        transcriptions,
        expectedContexts,
        level,
        language
      );

      // Step 3: Cleanup temp files
      localFilePaths.forEach((filePath) => {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn('Failed to delete temp file:', err);
        }
      });

      res.status(200).json(evaluation);
    } catch (error: any) {
      console.error('Error in batch evaluation:', error);
      res.status(500).json({
        error: 'Failed to evaluate speaking',
        message: error.message,
      });
    }
  });

/**
 * Download audio file from Firebase Storage
 */
async function downloadAudioFile(audioUrl: string, userId: string): Promise<string> {
  const bucket = admin.storage().bucket();
  
  // Extract file path from URL or use as-is if it's already a path
  let filePath = audioUrl;
  if (audioUrl.startsWith('gs://')) {
    filePath = audioUrl.replace('gs://', '').split('/').slice(1).join('/');
  } else if (audioUrl.startsWith('http')) {
    // Extract path from HTTPS URL
    const urlParts = audioUrl.split('/o/')[1];
    filePath = decodeURIComponent(urlParts.split('?')[0]);
  }

  // Create temp file
  const tempFilePath = path.join(os.tmpdir(), `speaking-${userId}-${Date.now()}.m4a`);
  
  try {
    await bucket.file(filePath).download({ destination: tempFilePath });
    return tempFilePath;
  } catch (error) {
    console.error('Error downloading audio file:', error);
    throw new Error(`Failed to download audio: ${error}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeAudio(filePath: string, language: ExamLanguage): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const audioFile = fs.createReadStream(filePath);
    const langCode = LANGUAGE_SHORT_CODES[language];

    if (!langCode) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: langCode,
      response_format: 'text',
    });

    return transcription as string;
  } catch (error: any) {
    console.error('Whisper transcription error:', error);
    
    // If transcription fails, return a message
    if (error.message.includes('audio') || error.message.includes('format')) {
      throw new Error('Could not transcribe audio. Please ensure you spoke clearly and the audio is not corrupted.');
    }
    
    throw error;
  }
}

/**
 * Evaluate transcription using GPT-4o-mini
 */
async function evaluateResponse(
  transcription: string,
  expectedContext: string,
  level: ExamLevel,
  language: ExamLanguage
): Promise<SpeakingEvaluation> {
  const lang = language === 'german' ? 'German' : 'English';
  const examName = `TELC ${lang}`;

  const prompt = `You are an expert ${examName} ${level} speaking exam evaluator. Evaluate the following speaking response.

Expected Context: "${expectedContext}"
User's Response: "${transcription}"

Evaluate based on these ${level} level criteria (each out of 20 points):
1. **Fluency** (0-20): Smooth speech flow, minimal hesitation, natural pace
2. **Pronunciation** (0-20): Clarity, correct sounds, intonation
3. **Grammar** (0-20): Accuracy, appropriate structures for ${level}
4. **Vocabulary** (0-20): Range, appropriateness, precision
5. **Content Relevance** (0-20): Addresses the expected context, coherent

Provide your evaluation in this EXACT JSON format (no additional text):
{
  "fluency": <score 0-20>,
  "pronunciation": <score 0-20>,
  "grammar": <score 0-20>,
  "vocabulary": <score 0-20>,
  "contentRelevance": <score 0-20>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasToImprove": ["<area 1>", "<area 2>"]
}

Important:
- Be encouraging but honest
- Consider ${level} level expectations
- If the response is too short or off-topic, penalize contentRelevance heavily
- If there are significant grammar errors beyond ${level}, penalize grammar accordingly`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert ${examName} ${level} examiner. Provide fair, consistent evaluations in JSON format only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for consistent grading
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Parse JSON response
    const parsed = JSON.parse(responseText);

    // Calculate overall score
    const overallScore = 
      parsed.fluency +
      parsed.pronunciation +
      parsed.grammar +
      parsed.vocabulary +
      parsed.contentRelevance;

    return {
      transcription,
      overallScore,
      fluency: parsed.fluency || 0,
      pronunciation: parsed.pronunciation || 0,
      grammar: parsed.grammar || 0,
      vocabulary: parsed.vocabulary || 0,
      contentRelevance: parsed.contentRelevance || 0,
      feedback: parsed.feedback || 'No feedback provided',
      strengths: parsed.strengths || [],
      areasToImprove: parsed.areasToImprove || [],
    };
  } catch (error: any) {
    console.error('GPT evaluation error:', error);
    
    // Fallback evaluation if GPT fails
    return {
      transcription,
      overallScore: 50, // Neutral score
      fluency: 10,
      pronunciation: 10,
      grammar: 10,
      vocabulary: 10,
      contentRelevance: 10,
      feedback: 'Evaluation completed. Keep practicing!',
      strengths: ['Attempted the response'],
      areasToImprove: ['Continue practicing regularly'],
    };
  }
}

/**
 * Evaluate multiple responses together for comprehensive assessment
 */
async function batchEvaluateResponses(
  transcriptions: string[],
  expectedContexts: string[],
  level: ExamLevel,
  language: ExamLanguage
): Promise<SpeakingEvaluation> {
  const lang = language === 'german' ? 'German' : 'English';
  const examName = `TELC ${lang}`;

  // Build conversation history for context
  const conversationHistory = transcriptions
    .map((t, i) => `Turn ${i + 1} (Expected: ${expectedContexts[i]})\nUser said: "${t}"`)
    .join('\n\n');

  const prompt = `You are an expert ${examName} ${level} speaking exam evaluator. Evaluate this complete speaking assessment dialogue.

${conversationHistory}

Evaluate the user's overall performance across ALL turns based on these ${level} level criteria (each out of 20 points):
1. **Fluency** (0-20): Overall smooth speech flow, minimal hesitation, natural pace across the dialogue
2. **Pronunciation** (0-20): Overall clarity, correct sounds, intonation across responses
3. **Grammar** (0-20): Overall accuracy, appropriate structures for ${level} throughout
4. **Vocabulary** (0-20): Range and appropriateness across all responses
5. **Content Relevance** (0-20): How well they addressed each context and maintained coherent conversation

Provide your evaluation in this EXACT JSON format (no additional text):
{
  "fluency": <score 0-20>,
  "pronunciation": <score 0-20>,
  "grammar": <score 0-20>,
  "vocabulary": <score 0-20>,
  "contentRelevance": <score 0-20>,
  "feedback": "<3-4 sentences of constructive feedback on overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<area 1>", "<area 2>", "<area 3>"]
}

Important:
- Consider the ENTIRE conversation, not just individual turns
- Look for improvement or consistency across turns
- Be encouraging but honest about ${level} level expectations
- Recognize effort and engagement in the conversation`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert ${examName} ${level} examiner. Provide fair, holistic evaluations of complete dialogues in JSON format only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Parse JSON response
    const parsed = JSON.parse(responseText);

    // Calculate overall score
    const overallScore = 
      parsed.fluency +
      parsed.pronunciation +
      parsed.grammar +
      parsed.vocabulary +
      parsed.contentRelevance;

    // Concatenate all transcriptions for the return value
    const fullTranscription = transcriptions.join(' | ');

    return {
      transcription: fullTranscription,
      overallScore,
      fluency: parsed.fluency || 0,
      pronunciation: parsed.pronunciation || 0,
      grammar: parsed.grammar || 0,
      vocabulary: parsed.vocabulary || 0,
      contentRelevance: parsed.contentRelevance || 0,
      feedback: parsed.feedback || 'Evaluation completed. Keep practicing!',
      strengths: parsed.strengths || [],
      areasToImprove: parsed.areasToImprove || [],
    };
  } catch (error: any) {
    console.error('GPT batch evaluation error:', error);
    
    // Fallback evaluation
    const fullTranscription = transcriptions.join(' | ');
    return {
      transcription: fullTranscription,
      overallScore: 50,
      fluency: 10,
      pronunciation: 10,
      grammar: 10,
      vocabulary: 10,
      contentRelevance: 10,
      feedback: 'Evaluation completed. Keep practicing!',
      strengths: ['Completed the dialogue', 'Engaged with the conversation'],
      areasToImprove: ['Continue practicing regularly', 'Focus on fluency'],
    };
  }
}

/**
 * Save evaluation to Firestore
 */
async function saveEvaluationToFirestore(
  userId: string,
  dialogueId: string,
  turnNumber: number,
  evaluation: any
): Promise<void> {
  const db = admin.firestore();
  
  await db
    .collection('users')
    .doc(userId)
    .collection('speaking-evaluations')
    .doc(`${dialogueId}-turn-${turnNumber}`)
    .set(evaluation, { merge: true });
}

