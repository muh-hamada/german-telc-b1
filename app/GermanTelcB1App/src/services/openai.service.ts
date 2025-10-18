/**
 * OpenAI Service for German Telc B1 Writing Assessment
 * 
 * This service integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc B1 exam criteria.
 */

// API Configuration
const OPENAI_API_KEY = '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // 'gpt-4o' supports JSON mode, or use 'gpt-3.5-turbo' for cost efficiency

interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  criteria: {
    taskCompletion: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    communicativeDesign: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    formalCorrectness: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
  };
  improvementTip: string;
}

interface EvaluationRequest {
  userAnswer: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

/**
 * System prompt that defines the AI's role as a Telc B1 German examiner
 */
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

/**
 * Creates a user prompt for the OpenAI API
 */
function createUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte folgende E-Mail-Antwort für die Telc B1 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Eingegangene E-Mail:**
${request.incomingEmail}

**Zu bearbeitende Leitpunkte:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**Antwort des Teilnehmers:**
${request.userAnswer}

---

Bewerte diese Antwort nach den Telc B1 Kriterien und gib das Ergebnis als JSON zurück.`;
}

/**
 * Calls OpenAI API to assess the writing
 */
async function callOpenAI(userPrompt: string): Promise<WritingAssessment> {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey || apiKey === '') {
    throw new Error('OpenAI API key is not configured. Please set the API key in openai.service.ts');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
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
 * Main function to evaluate writing using OpenAI
 */
export async function evaluateWriting(
  request: EvaluationRequest
): Promise<WritingAssessment> {
  const userPrompt = createUserPrompt(request);
  const assessment = await callOpenAI(userPrompt);
  return assessment;
}

/**
 * Mock assessment for testing when API key is not available
 */
export function getMockAssessment(): WritingAssessment {
  return {
    overallScore: 13,
    maxScore: 15,
    criteria: {
      taskCompletion: {
        grade: 'A',
        feedback: 'Alle vier Leitpunkte wurden sinnvoll und verständlich bearbeitet. Die Antwort geht auf alle Fragen der eingegangenen E-Mail ein.',
      },
      communicativeDesign: {
        grade: 'B',
        feedback: 'Anrede und Schluss sind passend. Es gibt eine gute Verbindung der Sätze, aber das Register schwankt leicht zwischen formell und informell.',
      },
      formalCorrectness: {
        grade: 'C',
        feedback: 'Viele Genusfehler und einige falsche Verbpositionen behindern das zügige Verständnis stellenweise. Achten Sie besonders auf die Artikel (der/die/das).',
      },
    },
    improvementTip: 'Achten Sie besonders auf die richtige Stellung des Verbs im Nebensatz (z.B. nach "weil" oder "dass"). Das Verb sollte am Ende des Nebensatzes stehen.',
  };
}

/**
 * Set OpenAI API key (for runtime configuration)
 */
let runtimeApiKey: string | null = null;

export function setOpenAIApiKey(apiKey: string): void {
  runtimeApiKey = apiKey;
}

export function getOpenAIApiKey(): string {
  return runtimeApiKey || OPENAI_API_KEY;
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = getOpenAIApiKey();
  return apiKey !== '' && apiKey !== null && apiKey !== undefined;
}

