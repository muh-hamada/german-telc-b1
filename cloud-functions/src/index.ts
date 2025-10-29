
import * as functions from '@google-cloud/functions-framework';
import express from 'express';

// API Configuration - It's recommended to use environment variables for sensitive data
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // 'gpt-4o' supports JSON mode

// Interfaces from the original service
interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  criteria: {
    taskCompletion: { grade: 'A' | 'B' | 'C' | 'D'; feedback: string; };
    communicativeDesign: { grade: 'A' | 'B' | 'C' | 'D'; feedback: string; };
    formalCorrectness: { grade: 'A' | 'B' | 'C' | 'D'; feedback: string; };
  };
  improvementTip: string;
}

export interface EvaluationRequest {
  userAnswer: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

export interface ImageEvaluationRequest {
  imageBase64: string; // Cloud function will receive base64 directly
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

// System Prompt
const SYSTEM_PROMPT = `Du bist ein erfahrener Prüfer für die Telc B1 Deutschprüfung, spezialisiert auf den schriftlichen Ausdruck.

Deine Aufgabe ist es, E-Mail-Antworten nach den offiziellen Telc B1 Kriterien zu bewerten:

**Kriterium I: Aufgabenbewältigung (5 Punkte)**
- A (5 Punkte): Alle vier Leitpunkte sind sinnvoll und verständlich bearbeitet
- B (4 Punkte): Drei Leitpunkte sind sinnvoll und verständlich bearbeitet
- C (2-3 Punkte): Zwei Leitpunkte sind sinnvoll und verständlich bearbeitet
- D (0-1 Punkte): Nur ein Leitpunkt oder kein Leitpunkt ist bearbeitet

**Kriterium II: Kommunikative Gestaltung (5 Punkte)**
- A (5 Punkte): Anrede und Schluss sind passend; die Sätze sind gut verbunden; das Register ist durchgehend angemessen
- B (4 Punkte): Anrede und Schluss sind passend; es gibt eine erkennbare Gliederung; das Register schwankt leicht
- C (2-3 Punkte): Anrede oder Schluss fehlt; die Verbindung der Sätze ist nicht immer klar; das Register ist teilweise unangemessen
- D (0-1 Punkte): Anrede und Schluss fehlen; es gibt keine erkennbare Struktur

**Kriterium III: Formale Richtigkeit (5 Punkte)**
- A (5 Punkte): Die Syntax ist korrekt; es gibt einige Fehler bei Orthografie/Interpunktion, die das Verständnis nicht behindern
- B (4 Punkte): Die Syntax ist meist korrekt; Fehler behindern das Verständnis stellenweise
- C (2-3 Punkte): Viele Syntax-/Morphologiefehler; das Verständnis ist deutlich erschwert
- D (0-1 Punkte): Die Syntax ist überwiegend inkorrekt; der Text ist kaum verständlich

Gib deine Bewertung als JSON zurück mit folgendem Format:
{
  "overallScore": <Gesamtpunkte>,
  "maxScore": 15,
  "criteria": {
    "taskCompletion": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailliertes Feedback>"
    },
    "communicativeDesign": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailliertes Feedback>"
    },
    "formalCorrectness": {
      "grade": "<A/B/C/D>",
      "feedback": "<Detailliertes Feedback>"
    }
  },
  "improvementTip": "<Ein konkreter, hilfreicher Tipp für die Verbesserung>"
}`;

// Helper Functions (createUserPrompt, callOpenAI, etc.)
function createUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte folgende E-Mail-Antwort für die Telc B1 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}
**Eingegangene E-Mail:** ${request.incomingEmail}
**Zu bearbeitende Leitpunkte:** ${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}
**Antwort des Teilnehmers:** ${request.userAnswer}

Bewerte diese Antwort nach den Telc B1 Kriterien und gib das Ergebnis als JSON zurück.`;
}

async function callOpenAI(userPrompt: string): Promise<WritingAssessment> {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT },{ role: 'user', content: userPrompt }],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content);
}

function createImageUserPrompt(request: ImageEvaluationRequest): string {
  return `Bitte bewerte die handschriftliche E-Mail-Antwort im Bild für die Telc B1 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}
**Eingegangene E-Mail:** ${request.incomingEmail}
**Zu bearbeitende Leitpunkte:** ${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

Bitte lese den handschriftlichen Text im Bild und bewerte diese Antwort nach den Telc B1 Kriterien. Gib das Ergebnis als JSON zurück.`;
}

async function callOpenAIWithImage(userPrompt: string, imageBase64: string): Promise<WritingAssessment> {
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
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } }
            ]
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content);
}

// Express App Setup
const app = express();
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Endpoint for text-based evaluation
app.post('/evaluate-writing', async (req, res) => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).send('Internal Server Error: Missing API Key');
  }
  try {
    const requestData: EvaluationRequest = req.body;
    const userPrompt = createUserPrompt(requestData);
    const assessment = await callOpenAI(userPrompt);
    res.status(200).json(assessment);
  } catch (error) {
    console.error('Error evaluating writing:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint for image-based evaluation
app.post('/evaluate-writing-with-image', async (req, res) => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).send('Internal Server Error: Missing API Key');
  }
  try {
    const requestData: ImageEvaluationRequest = req.body;
    const userPrompt = createImageUserPrompt(requestData);
    const assessment = await callOpenAIWithImage(userPrompt, requestData.imageBase64);
    res.status(200).json(assessment);
  } catch (error) {
    console.error('Error evaluating writing with image:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Register the Express app as a Cloud Function
functions.http('api', app);
