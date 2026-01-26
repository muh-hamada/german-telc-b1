import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { getOpenAIKey } from './api-keys';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ExamLevel, ExamLanguage, LANGUAGE_SHORT_CODES } from './types';

if (!admin.apps.length) {
  admin.initializeApp();
}

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

/**
 * Cloud Function to evaluate a user's speaking response
 * Uses OpenAI Whisper for transcription and GPT-4 for evaluation
 */
export const evaluateSpeaking = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes for audio processing
    memory: '1GB',
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

    const { audioUrl, expectedContext, level, language, dialogueId, turnNumber, userId, feedbackLanguage } = req.body;

    console.log('[EvaluateSpeaking] Request body:', {
      audioUrl,
      expectedContext,
      level,
      language,
      dialogueId,
      turnNumber,
      userId,
      feedbackLanguage,
    });

    // Validate input
    if (!audioUrl || !level || !language || !userId || !feedbackLanguage) {
      res.status(400).json({ error: 'Missing required parameters (audioUrl, level, language, feedbackLanguage, or userId)' });
      return;
    }

    // Use a fallback for expectedContext if it's missing or empty
    const context = expectedContext || 'General conversation';

    try {
      // Step 1: Download audio file from Firebase Storage
      const localFilePath = await downloadAudioFile(audioUrl, userId);
      const stats = fs.statSync(localFilePath);
      console.log(`[EvaluateSpeaking] Local audio file size: ${stats.size} bytes`);

      // Step 2: Transcribe using Whisper
      console.log('[EvaluateSpeaking] Expected Context:', context);
      console.log('[EvaluateSpeaking] Transcribing audio...');
      const whisperResult = await transcribeAudio(localFilePath, language);
      let transcription = whisperResult.text || '';
      
      // Step 2.5: Filter out known Whisper hallucinations for empty/noisy audio
      const hallucinations = [
        // English hallucinations
        'thank you for watching',
        'please subscribe',
        'subtitles by',
        'thanks for watching',
        'be sure to subscribe',
        'subscribe to my channel',
        // German hallucinations
        'untertitel der amara.org',
        'untertitelung der amara.org',
        'amara.org-community',
        'copyright wdr',
        'zdf',
        'vielen dank für das zuschauen',
        'vielen dank fürs zuschauen',
        'untertitel im auftrag des zdf',
        'mooji.org',
        'amara.org community',
        // Spanish hallucinations
        'gracias por ver',
        'gracias por vernos',
        'suscríbete',
        'suscríbete al canal',
        'subtítulos por',
        'subtítulos de amara.org',
        'subtitulado por',
        'comunidad de amara.org',
        'gracias por su atención',
        'muchas gracias por ver',
      ];
      
      const cleanTranscription = transcription.toLowerCase().trim();
      const isHallucination = hallucinations.some(h => cleanTranscription.includes(h)) || cleanTranscription.length < 2;
      
      if (isHallucination) {
        console.log('[EvaluateSpeaking] Hallucination detected, returning empty result:', transcription);
        
        // Cleanup temp file before returning
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.warn('Failed to delete temp file:', err);
        }

        res.status(200).json({
          transcription: '',
          overallScore: 0,
          fluency: 0,
          pronunciation: 0,
          grammar: 0,
          vocabulary: 0,
          contentRelevance: 0,
          feedback: 'No clear speech detected. Please speak louder or check your microphone.',
          strengths: [],
          areasToImprove: [],
          success: true,
        });
        return;
      }

      console.log('[EvaluateSpeaking] Transcription result:', {
        text: transcription,
        duration: whisperResult.duration,
        segments: whisperResult.segments?.length 
      });

      // Step 3: Evaluate using GPT-4
      console.log('[EvaluateSpeaking] Evaluating response...');
      const evaluation = await evaluateResponse(
        transcription,
        context,
        level,
        language,
        feedbackLanguage
      );

      console.log('[EvaluateSpeaking] Evaluation result:', JSON.stringify(evaluation));

      // Step 4: Cleanup temp file
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Failed to delete temp file:', err);
      }

      res.status(200).json({
        ...evaluation,
        success: true,
      });
    } catch (error: any) {
      console.error('Error evaluating speaking:', error);
      res.status(500).json({
        error: 'Failed to evaluate speaking',
        message: error.message,
      });
    }
  });

/**
 * Cloud Function to generate overall speaking assessment summary
 * Uses GPT-4 to create a comprehensive summary of all turn evaluations
 */
export const generateSpeakingSummary = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
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

    const { averageScores, totalScore, numEvaluations, level, language, feedbackLanguage } = req.body;

    console.log('[GenerateSpeakingSummary] Request body:', {
      averageScores,
      totalScore,
      numEvaluations,
      level,
      language,
      feedbackLanguage,
    });

    // Validate input
    if (!averageScores || !totalScore || !numEvaluations || !level || !language || !feedbackLanguage) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    try {
      const summary = await generateOverallSummary(
        averageScores,
        totalScore,
        numEvaluations,
        level,
        language,
        feedbackLanguage
      );

      res.status(200).json({
        feedback: summary,
        success: true,
      });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      res.status(500).json({
        error: 'Failed to generate summary',
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

  console.log('[EvaluateSpeaking] Downloading from path:', filePath);

  // Create temp file
  const tempFilePath = path.join(os.tmpdir(), `speaking-${userId}-${Date.now()}.m4a`);
  
  try {
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    // Verify downloaded file
    const stats = fs.statSync(tempFilePath);
    console.log('[EvaluateSpeaking] Downloaded file:', tempFilePath, 'Size:', stats.size, 'bytes');
    
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return tempFilePath;
  } catch (error) {
    console.error('Error downloading audio file:', error);
    throw new Error(`Failed to download audio: ${error}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeAudio(filePath: string, language: ExamLanguage): Promise<any> {
  try {
    // Check if file exists and has content
    const stats = fs.statSync(filePath);
    console.log(`[EvaluateSpeaking] Audio file to transcribe: ${filePath}, size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      throw new Error('Audio file is empty');
    }
    
    if (stats.size < 1000) {
      console.warn('[EvaluateSpeaking] Audio file is very small, might be corrupted');
    }

    const openai = getOpenAIClient();
    const audioFile = fs.createReadStream(filePath);
    const langCode = LANGUAGE_SHORT_CODES[language];

    if (!langCode) {
      throw new Error(`Unsupported language: ${language}`);
    }

    console.log('[EvaluateSpeaking] Sending to Whisper with language:', langCode);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: langCode,
      response_format: 'verbose_json',
    });

    console.log('[EvaluateSpeaking] Whisper Detection:', {
      duration: transcription.duration,
      language: transcription.language,
      text: transcription.text,
    });

    return transcription;
  } catch (error: any) {
    console.error('Whisper transcription error:', error);
    
    // If transcription fails, return a message
    if (error.message.includes('audio') || error.message.includes('format') || error.message.includes('empty')) {
      throw new Error('Could not transcribe audio. Please ensure you spoke clearly and the audio is not corrupted.');
    }
    
    throw error;
  }
}

/**
 * Generate overall speaking assessment summary using GPT-4
 */
async function generateOverallSummary(
  averageScores: {
    pronunciation: number;
    fluency: number;
    grammarAccuracy: number;
    vocabularyRange: number;
    contentRelevance: number;
  },
  totalScore: number,
  numEvaluations: number,
  level: ExamLevel,
  language: ExamLanguage,
  feedbackLanguage: string
): Promise<string> {
  const languageMap: Record<string, string> = {
    'german': 'German',
    'english': 'English',
    'spanish': 'Spanish'
  };
  const lang = languageMap[language] || 'English';
  
  // Determine exam name based on language
  const examName = language === 'spanish' ? `DELE ${lang}` : `TELC ${lang}`;

  // Map feedback language codes to full language names
  const feedbackLanguageMap: Record<string, string> = {
    'en': 'English',
    'de': 'German',
    'ar': 'Arabic',
    'es': 'Spanish',
    'fr': 'French',
    'ru': 'Russian',
  };
  const feedbackLanguageName = feedbackLanguageMap[feedbackLanguage] || 'English';

  const prompt = `You are an expert ${examName} ${level} speaking examiner. Generate a comprehensive overall summary for a speaking assessment.

The student completed ${numEvaluations} speaking exchanges with the following average scores:
- Pronunciation: ${averageScores.pronunciation}/20
- Fluency: ${averageScores.fluency}/20
- Grammar Accuracy: ${averageScores.grammarAccuracy}/20
- Vocabulary Range: ${averageScores.vocabularyRange}/20
- Content Relevance: ${averageScores.contentRelevance}/20
- Total Score: ${totalScore}/100

Generate a motivating and encouraging summary (2-3 sentences) in ${feedbackLanguageName} that:
1. Acknowledges their effort in completing ${numEvaluations} exchanges
2. Highlights their overall performance level
3. Provides encouragement for continued practice

The summary should be written entirely in ${feedbackLanguageName}. Return ONLY the summary text, no JSON, no formatting.`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert ${examName} ${level} examiner. Provide encouraging feedback in ${feedbackLanguageName}.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Slightly higher for more natural language
      max_tokens: 200,
    });

    const summary = completion.choices[0].message.content || `You completed ${numEvaluations} speaking exchanges. Your overall performance shows good progress!`;
    return summary.trim();
  } catch (error: any) {
    console.error('GPT summary generation error:', error);
    // Fallback to English if AI fails
    return `You completed ${numEvaluations} speaking exchanges. Your overall performance shows good progress!`;
  }
}

/**
 * Evaluate transcription using GPT-4o-mini
 */
async function evaluateResponse(
  transcription: string,
  expectedContext: string,
  level: ExamLevel,
  language: ExamLanguage,
  feedbackLanguage: string
): Promise<SpeakingEvaluation> {
  const languageMap: Record<string, string> = {
    'german': 'German',
    'english': 'English',
    'spanish': 'Spanish'
  };
  const lang = languageMap[language] || 'English';
  
  // Determine exam name based on language
  const examName = language === 'spanish' ? `DELE ${lang}` : `TELC ${lang}`;

  // Map feedback language codes to full language names
  const feedbackLanguageMap: Record<string, string> = {
    'en': 'English',
    'de': 'German',
    'ar': 'Arabic',
    'es': 'Spanish',
    'fr': 'French',
    'ru': 'Russian',
  };
  const feedbackLanguageName = feedbackLanguageMap[feedbackLanguage] || 'English';

  const prompt = `You are an expert ${examName} ${level} speaking exam evaluator. Evaluate the following speaking response for ONE SPECIFIC TURN in a dialogue.

Expected Context for this turn: "${expectedContext}"
User's Actual Response (transcription): "${transcription}"

CRITICAL INSTRUCTIONS FOR FEEDBACK:
1. BE SPECIFIC: Your feedback must relate directly to what the user said in THIS turn. Avoid generic praise or criticism.
2. NO REPETITION: Do not repeat the instructions or context from the "Expected Context" as your strengths or areas to improve.
3. CONCISE: Provide exactly 2 strengths and 2 areas to improve. Each must be a single, unique sentence.
4. VARIETY: Avoid generic phrases like "Clear pronunciation", "Good grammar", or "Expand your response". Instead, specify WHAT was pronounced well or WHICH grammar structure was used correctly/incorrectly.
5. NO HALLUCINATIONS: If the transcription is empty or gibberish (and was not caught by the silence filter), set all scores to 0 and transcription to "".
6. LANGUAGE REQUIREMENT: Provide ALL feedback, strengths, and areas to improve in ${feedbackLanguageName}. The user wants to receive their evaluation feedback in ${feedbackLanguageName}.

Evaluate the response holistically based on these ${level} level criteria. Assign a score from 0 to 20 for each category:
1. **Fluency** (0-20): Natural pace, smooth transitions, minimal hesitation.
2. **Pronunciation** (0-20): Intelligibility, clarity of sounds, appropriate intonation.
3. **Grammar** (0-20): Correct use of ${level} structures, syntax accuracy.
4. **Vocabulary** (0-20): Range of words used, appropriateness for the task and level.
5. **Content Relevance** (0-20): Did they actually answer the question or follow the context?

Scoring Guide:
- 18-20: Excellent, near-native for this level.
- 14-17: Good, very few errors.
- 10-13: Satisfactory, meets basic level requirements.
- 5-9: Weak, significant difficulties.
- 0-4: Very poor or irrelevant response.

Provide your evaluation in this EXACT JSON format (no markdown, no backticks, no other text):
{
  "transcription": "string (the user's response)",
  "fluency": <number>,
  "pronunciation": <number>,
  "grammar": <number>,
  "vocabulary": <number>,
  "contentRelevance": <number>,
  "feedback": "string (max 2 sentences)",
  "strengths": ["specific strength 1", "specific strength 2"],
  "areasToImprove": ["specific improvement 1", "specific improvement 2"]
}
`;

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
    
    // Parse JSON response - handle potential markdown blocks
    const cleanText = responseText.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', cleanText);
      throw new Error('AI evaluation format error');
    }

    // Ensure all scores are present and are numbers
    const fluency = Number(parsed.fluency) || 0;
    const pronunciation = Number(parsed.pronunciation) || 0;
    const grammar = Number(parsed.grammar) || 0;
    const vocabulary = Number(parsed.vocabulary) || 0;
    const contentRelevance = Number(parsed.contentRelevance) || 0;

    // Calculate overall score
    const overallScore = fluency + pronunciation + grammar + vocabulary + contentRelevance;

    return {
      transcription,
      overallScore,
      fluency,
      pronunciation,
      grammar,
      vocabulary,
      contentRelevance,
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


