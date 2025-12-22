/**
 * Firebase Cloud Functions for German Telc B1 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc B1 exam criteria.
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
const MODEL = 'gpt-4o-mini';

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

WICHTIG: Das Feld "userInput" muss EXAKT die Antwort des Teilnehmers enthalten, wie sie bereitgestellt wurde. Bei Bildern: Extrahiere den Text GENAU wie geschrieben, ohne Änderungen, Ergänzungen oder Korrekturen. Erfinde NIEMALS eine Beispielantwort.

Gib deine Bewertung als JSON zurück mit folgendem Format:
{
  "overallScore": <Gesamtpunkte>,
  "userInput": "<EXAKTE Antwort des Teilnehmers - bei Bildern: der extrahierte Text ohne Änderungen>",
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
  "correctedAnswer": "<Die korrigierte Antwort mit Markdown-Hervorhebungen>"
}

WICHTIG für "correctedAnswer":
- Nimm die EXAKTE Antwort des Teilnehmers und korrigiere NUR die Fehler
- Erstelle KEINE neue Antwort - behalte den originalen Text bei
- Verwende Markdown zur Hervorhebung der Korrekturen:
  * **fett** für korrigierte Wörter/Phrasen
  * ~~durchgestrichen~~ für entfernte/falsche Teile (optional, falls nötig)
- Wenn es keine Fehler gibt, gib die originale Antwort zurück
- Beispiel: "Ich **habe** gestern ins Kino gegangen" → "Ich **bin** gestern ins Kino gegangen"`;

/**
 * Creates a user prompt for text evaluation
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

Bewerte diese Antwort nach den Telc B1 Kriterien und gib das Ergebnis als JSON zurück. Kopiere die Antwort des Teilnehmers EXAKT in das "userInput" Feld. Für "correctedAnswer": Nimm die originale Antwort und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte die handschriftliche E-Mail-Antwort im Bild für die Telc B1 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Eingegangene E-Mail:**
${request.incomingEmail}

**Zu bearbeitende Leitpunkte:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---

WICHTIGE ANWEISUNGEN:
1. Lese zuerst den GESAMTEN handschriftlichen Text im Bild sorgfältig
2. Extrahiere den Text BUCHSTÄBLICH wie geschrieben - mit allen Fehlern und Rechtschreibfehlern
3. Kopiere diesen extrahierten Text GENAU in das "userInput" Feld im JSON
4. Erfinde KEINE Beispielantwort - verwende NUR den tatsächlichen Text aus dem Bild
5. Bewerte dann diese extrahierte Antwort nach den Telc B1 Kriterien
6. Für "correctedAnswer": Nimm den extrahierten Text und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort.

Das "userInput" Feld muss den EXAKTEN Text aus dem Bild enthalten, nicht eine erfundene oder ideale Antwort.`;
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

    console.log('Making fetch request to OpenAI... Using model:', MODEL);
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
export const evaluateWritingB1 = functions.https.onRequest(
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
      console.error('Error in evaluateWriting function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

