/**
 * Firebase Cloud Functions for English Telc B1 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc B1 English exam criteria.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WritingAssessment, EvaluationRequest } from './types';
import { OPENAI_API_KEY } from './api-keys';

if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

/**
 * System prompt that defines the AI's role as a Telc B1 English examiner
 */
const SYSTEM_PROMPT = `You are an experienced examiner for the Telc B1 English exam, specializing in writing assessment.

Your task is to evaluate email responses according to the official Telc B1 criteria:

**Criterion I: Task Management (5 points)**
- A (5 points): All four guiding points are processed meaningfully and understandably
- B (4 points): Three guiding points are processed meaningfully and understandably
- C (2-3 points): Two guiding points are processed meaningfully and understandably
- D (0-1 points): Only one guiding point or no guiding point is processed

**Criterion II: Communicative Design (5 points)**
- A (5 points): Salutation and closing are appropriate; sentences are well connected; the register is appropriate throughout
- B (4 points): Salutation and closing are appropriate; there is a recognizable structure; the register fluctuates slightly
- C (2-3 points): Salutation or closing is missing; the connection of sentences is not always clear; the register is partially inappropriate
- D (0-1 points): Salutation and closing are missing; there is no recognizable structure

**Criterion III: Formal Correctness (5 points)**
- A (5 points): Syntax is correct; there are some errors in orthography/punctuation that do not impede understanding
- B (4 points): Syntax is mostly correct; errors impede understanding in places
- C (2-3 points): Many syntax/morphology errors; understanding is significantly difficult
- D (0-1 points): Syntax is predominantly incorrect; the text is barely understandable

IMPORTANT: The "userInput" field must contain EXACTLY the participant's answer as provided. For images: Extract the text EXACTLY as written, without changes, additions, or corrections. NEVER invent an example answer.

Return your evaluation as JSON with the following format:
{
  "overallScore": <Total Points>,
  "userInput": "<EXACT answer of the participant - for images: the extracted text without changes>",
  "maxScore": 15,
  "criteria": {
    "taskCompletion": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailed feedback>"
    },
    "communicativeDesign": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailed feedback>"
    },
    "formalCorrectness": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailed feedback>"
    }
  },
  "correctedAnswer": "<The corrected answer with markdown highlights>"
}

IMPORTANT for "correctedAnswer":
- Take the EXACT answer of the participant and correct ONLY the errors
- Do NOT create a new answer - keep the original text
- Use Markdown to highlight corrections:
  * **bold** for corrected words/phrases
  * ~~strikethrough~~ for removed/wrong parts (optional, if needed)
- If there are no errors, return the original answer
- Example: "I **have** gone to the cinema yesterday" -> "I **went** to the cinema yesterday"`;

/**
 * Creates a user prompt for text evaluation
 */
function createUserPrompt(request: EvaluationRequest): string {
  return `Please evaluate the following email response for the Telc B1 English exam:

**Exam Task:** ${request.examTitle}

**Received Email:**
${request.incomingEmail}

**Guiding Points to Cover:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**Participant's Answer:**
${request.userAnswer}

---

Evaluate this answer according to the Telc B1 criteria and return the result as JSON. Copy the participant's answer EXACTLY into the "userInput" field. For "correctedAnswer": Take the original answer and correct only the errors with Markdown highlights (use **bold** for corrections). Do NOT create a new answer.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Please evaluate the handwritten email response in the image for the Telc B1 English exam:

**Exam Task:** ${request.examTitle}

**Received Email:**
${request.incomingEmail}

**Guiding Points to Cover:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---

IMPORTANT INSTRUCTIONS:
1. First read the ENTIRE handwritten text in the image carefully
2. Extract the text LITERALLY as written - with all mistakes and spelling errors
3. Copy this extracted text EXACTLY into the "userInput" field in the JSON
4. Do NOT invent an example answer - use ONLY the actual text from the image
5. Then evaluate this extracted answer according to the Telc B1 criteria
6. For "correctedAnswer": Take the extracted text and correct only the errors with Markdown highlights (use **bold** for corrections). Do NOT create a new answer.

The "userInput" field must contain the EXACT text from the image, not an invented or ideal answer.`;
}

/**
 * Calls OpenAI API to assess the writing
 */
async function callOpenAI(userPrompt: string, imageBase64?: string): Promise<WritingAssessment> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    console.log('Starting OpenAI API call (English B1)...');
    console.log('Has image:', !!imageBase64);
    
    // Build the message content
    let messageContent: any;
    
    if (imageBase64) {
      // Image evaluation
      console.log('Building image message content');
      messageContent = [
        { type: 'text', text: userPrompt },
        { 
          type: 'image_url', 
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high'
          }
        }
      ];
    } else {
      // Text evaluation
      console.log('Building text message content');
      messageContent = userPrompt;
    }

    console.log('Making fetch request to OpenAI...');
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: messageContent },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    console.log('OpenAI response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      );
    }

    console.log('Parsing OpenAI response...');
    const data = await response.json();
    console.log('OpenAI Response:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in OpenAI response. Full response:', data);
      throw new Error(`No response from OpenAI. Response structure: ${JSON.stringify(data)}`);
    }

    const assessment: WritingAssessment = JSON.parse(content);
    return assessment;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
    throw new Error('OpenAI API call failed with unknown error');
  }
}

/**
 * Main Cloud Function to evaluate writing
 * This is an HTTP endpoint that can be invoked from the mobile app
 */
export const evaluateWritingEnglishB1 = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const data: EvaluationRequest = req.body;

      // Validate input
      if (!data.incomingEmail || !data.writingPoints || !data.examTitle) {
        res.status(400).json({
          error: 'Missing required fields: incomingEmail, writingPoints, or examTitle'
        });
        return;
      }

      if (!data.userAnswer && !data.imageBase64) {
        res.status(400).json({
          error: 'Either userAnswer or imageBase64 must be provided'
        });
        return;
      }

      let userPrompt: string;
      let assessment: WritingAssessment;

      if (data.imageBase64) {
        // Image evaluation
        userPrompt = createImageUserPrompt(data);
        assessment = await callOpenAI(userPrompt, data.imageBase64);
      } else {
        // Text evaluation
        userPrompt = createUserPrompt(data);
        assessment = await callOpenAI(userPrompt);
      }

      // Log successful evaluation (optional)
      console.log('Writing evaluation completed (English B1)', {
        score: assessment.overallScore,
        examTitle: data.examTitle,
        hasImage: !!data.imageBase64,
      });

      res.status(200).json(assessment);
    } catch (error) {
      console.error('Error in evaluateWritingEnglishB1 function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);
