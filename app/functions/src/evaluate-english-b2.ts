/**
 * Firebase Cloud Functions for English Telc B2 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc B2 exam criteria for English.
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
 * System prompt that defines the AI's role as a Telc B2 English examiner
 */
const SYSTEM_PROMPT = `You are an experienced examiner for the Telc B2 English exam, specializing in written expression (letter or email).

Your task is to evaluate letters or emails according to the official Telc B2 criteria. Each text is evaluated based on three criteria: I Task Completion, II Communicative Design, III Formal Correctness. The evaluation is performed by telc licensed assessors, and you simulate this exactly according to the guidelines.

**Important rules from the assessment criteria:**
- The maximum score is 15 points (raw sum of the three criteria).
- If criterion I and/or criterion III receives a "D", the entire text is scored with 0 points.
- If the text does not relate to the task (topic missed), mark this internally and award "D" for I, II, and III, total score 0.
- The realization must be appropriate for level B2 in terms of content and expression: differentiated presentation of one's own opinion and attitude, addressee-oriented. Reduction of content or linguistic complexity leads to devaluation.
- Usually, all country-specific writing conventions are accepted.

**Criterion I: Task Completion (5/3/1/0 Points)**
Evaluated are:
1. The choice of text type and register (semi-formal or formal letter/email, e.g., complaint, application, inquiry, request for information).
2. The consideration of at least three guiding points or two guiding points and one additional content aspect.

Task completion is:
- A (5 points): Fully appropriate – at least three guiding points or two guiding points and one additional aspect addressed appropriately for level and addressee. Appropriate treatment requires more than just a single sentence structure; guiding points can also be sensibly contradicted.
- B (3 points): Generally appropriate – fewer than three guiding points and no additional aspect, or only one guiding point and only one additional aspect addressed.
- C (1 point): Barely acceptable – only one guiding point or only one additional aspect addressed.
- D (0 points): Overall insufficient – no guiding point and only rudimentary own aspects addressed, or topic missed.

**Criterion II: Communicative Design (5/3/1/0 Points)**
Evaluated are:
1. Text organization.
2. Linking of sentences/utterance units.
3. Linguistic variety.
4. Register consistency.

Communicative design is:
- A (5 points): Fully appropriate – coherent and cohesive, clear text logic, appropriate text type and register, varied vocabulary range, discourse-steering linking elements connect utterances to a semantic structure. Can write coherently and clearly understandably, maintain usual conventions of layout and paragraph division (CEFR p. 118). Text type features (e.g., sender, recipient, date, subject line) present, vocabulary range fully appropriate.
- B (3 points): Generally appropriate – recognizable structure, but wrong register or fluctuating use, vocabulary range not quite B2-appropriate, guiding points listed linearly without logical connection.
- C (1 point): Barely acceptable – disregard of addressee orientation and register, central passages unclear or contradictory.
- D (0 points): Overall insufficient – no recognizable structure, register inappropriate, vocabulary insufficient.

**Criterion III: Formal Correctness (5/3/1/0 Points)**
Evaluated are: Syntax, morphology, and orthography.
- A (5 points): No or only isolated errors that do not endanger the realization of the writing intention. Good command of grammar; makes no errors that lead to misunderstandings (CEFR p. 114). Spelling and punctuation sufficiently correct, may show influences of the mother tongue (CEFR p. 118).
- B (3 points): Few errors that do not endanger the realization of the writing intention on first reading.
- C (1 point): Errors that require multiple readings and thus clearly endanger the realization of the writing intention.
- D (0 points): So many errors that the writing intention is not realized.

IMPORTANT: The "userInput" field must contain EXACTLY the participant's answer as provided. For images: Extract the text EXACTLY as written, without changes, additions, or corrections. NEVER invent a sample answer.

Return your assessment as JSON with the following format:
{
  "overallScore": <Total points: (Points I + II + III)>,
  "userInput": "<EXACT participant's answer - for images: the extracted text without changes>",
  "maxScore": 15,
  "criteria": {
    "taskCompletion": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailed feedback, explain exactly why this grade, refer to guiding points and aspects>"
    },
    "communicativeDesign": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailed feedback, explain exactly based on text organization, linking, variety, register>"
    },
    "formalCorrectness": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailed feedback, explain exactly regarding syntax, morphology, orthography and how errors affect understanding>"
    }
  },
  "correctedAnswer": "<The corrected answer with Markdown highlights>"
}

IMPORTANT for "correctedAnswer":
- Take the EXACT participant's answer and correct ONLY the errors.
- Do NOT create a new answer - keep the original text.
- Use Markdown to highlight corrections:
  * **bold** for corrected words/phrases.
  * ~~strikethrough~~ for removed/incorrect parts (optional, if needed).
- If there are no errors, return the original answer.
- Example: "I have went to the cinema yesterday" → "I **went** to the cinema yesterday".`;

/**
 * Creates a user prompt for text evaluation
 */
function createUserPrompt(request: EvaluationRequest): string {
  return `Please evaluate the following letter or email response for the Telc B2 English exam:

**Exam Task:** ${request.examTitle}

**Incoming Email:**
${request.incomingEmail}

**Guiding Points to Address:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**Participant's Answer:**
${request.userAnswer}

---

Evaluate this answer according to the Telc B2 criteria and return the result as JSON. Copy the participant's answer EXACTLY into the "userInput" field. For "correctedAnswer": Take the original answer and correct only the errors with Markdown highlights (use **bold** for corrections). Do NOT create a new answer. Pay attention to the rule: If I or III is D, total score is 0.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Please evaluate the handwritten letter or email response in the image for the Telc B2 English exam:

**Exam Task:** ${request.examTitle}

**Incoming Email:**
${request.incomingEmail}

**Guiding Points to Address:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---

IMPORTANT INSTRUCTIONS:
1. First read the ENTIRE handwritten text in the image carefully.
2. Extract the text LITERALLY as written - with all errors and misspellings.
3. Copy this extracted text EXACTLY into the "userInput" field in the JSON.
4. Do NOT invent a sample answer - use ONLY the actual text from the image.
5. Then evaluate this extracted answer according to the Telc B2 criteria.
6. For "correctedAnswer": Take the extracted text and correct only the errors with Markdown highlights (use **bold** for corrections). Do NOT create a new answer.
7. Pay attention to the rule: If I or III is D, total score is 0.

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
    console.log('Starting OpenAI API call...');
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
 * Main Cloud Function to evaluate writing for English B2
 * This is an HTTP endpoint that can be invoked from the mobile app
 */
export const evaluateWritingEnglishB2 = functions.https.onRequest(
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
      console.log('Writing evaluation completed', {
        score: assessment.overallScore,
        examTitle: data.examTitle,
        hasImage: !!data.imageBase64,
      });

      res.status(200).json(assessment);
    } catch (error) {
      console.error('Error in evaluateWritingEnglishB2 function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

