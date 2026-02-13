/**
 * Firebase Cloud Functions for German Telc A2 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc A2 exam criteria.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getOpenAIKey } from './api-keys';

if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

interface ContentPoint {
  pointNumber: number;
  pointText: string;
  score: 3 | 1.5 | 0;
  feedback: string;
}

interface WritingAssessmentA2 {
  overallScore: number;
  maxScore: number;
  userInput: string;
  contentPoints: ContentPoint[];
  communicativeDesign: {
    score: 1 | 0.5 | 0;
    feedback: string;
  };
  correctedAnswer: string;
}

interface EvaluationRequest {
  userAnswer?: string;
  imageBase64?: string;
  examTitle: string;
  instructionHeader: string;
  taskPoints: Array<{
    id: string;
    text: string;
  }>;
}

/**
 * System prompt that defines the AI's role as a Telc A2 German examiner
 */
const SYSTEM_PROMPT = `Du bist ein erfahrener Prüfer für die Telc A2 Deutschprüfung (Start Deutsch 2), spezialisiert auf den schriftlichen Ausdruck Teil 2.

Deine Aufgabe ist es, Briefe/E-Mails nach den offiziellen Telc A2 Kriterien zu bewerten:

**Schreiben, Teil 2: Bewertungskriterien**

Bewerten Sie die Teilnehmerleistungen auf dem Antwortbogen S30 nach folgenden Kriterien:

**Erfüllung der Aufgabenstellung (pro Inhaltspunkt):**
- **3 Punkte**: Aufgabe voll erfüllt und verständlich
- **1,5 Punkte**: Aufgabe wegen sprachlicher und inhaltlicher Mängel nur teilweise erfüllt
- **0 Punkte**: Aufgabe nicht erfüllt und/oder unverständlich

**Kommunikative Gestaltung des Texts (K):**
- **1 Punkt**: Der Textsorte angemessen
- **0,5 Punkte**: Untypische oder fehlende Wendungen, z. B. keine Anrede
- **0 Punkte**: Keine textsortenspezifischen Wendungen

**Maximale Punktzahl: 10 Punkte** (3 Inhaltspunkte × 3 Punkte + 1 KG Punkt)

Der oder die Bewertende trägt seine bzw. ihre Bewertungen zunächst in dem Antwortbogen bei "Bewertung 1" und "telc Bewertung" ein. Bei Unstimmigkeiten überstimmt die telc Bewertung Bewertung 1.

**Wichtiger Hinweis zum A2-Niveau:**
Bei der Bewertung ist das Sprachniveau A2 (GER) zu berücksichtigen. Auf A2-Niveau wird erwartet, dass der Teilnehmer:
- Kurze, einfache Nachrichten und Briefe schreiben kann
- Einfache Alltagssprache verwendet
- Grundlegende Satzstrukturen und einfache Konnektoren (und, aber, weil, dann) beherrscht
- Einen begrenzten, aber für den Alltag ausreichenden Wortschatz einsetzt
Kleinere grammatische Fehler und ein begrenzter Wortschatz sind auf A2-Niveau akzeptabel, solange die Kommunikation verständlich bleibt.

WICHTIG: Das Feld "userInput" muss EXAKT die Antwort des Teilnehmers enthalten, wie sie bereitgestellt wurde. Bei Bildern: Extrahiere den Text GENAU wie geschrieben, ohne Änderungen, Ergänzungen oder Korrekturen. Erfinde NIEMALS eine Beispielantwort.

Gib deine Bewertung als JSON zurück mit folgendem Format:
{
  "overallScore": <Gesamtpunkte>,
  "userInput": "<EXAKTE Antwort des Teilnehmers - bei Bildern: der extrahierte Text ohne Änderungen>",
  "maxScore": 10,
  "contentPoints": [
    {
      "pointNumber": 1,
      "pointText": "<Text des Inhaltspunkts>",
      "score": <3 | 1.5 | 0>,
      "feedback": "<Detailliertes Feedback>"
    },
    // ... für alle 3 Inhaltspunkte
  ],
  "communicativeDesign": {
    "score": <1 | 0.5 | 0>,
    "feedback": "<Detailliertes Feedback>"
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
  return `Bitte bewerte folgende Brief/E-Mail-Antwort für die Telc A2 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Aufgabenstellung:**
${request.instructionHeader}

**Zu bearbeitende Punkte:**
${request.taskPoints.map((point, index) => `${index + 1}. ${point.text}`).join('\n')}

**Antwort des Teilnehmers:**
${request.userAnswer}

---

Bewerte diese Antwort nach den Telc A2 Kriterien und gib das Ergebnis als JSON zurück. Kopiere die Antwort des Teilnehmers EXAKT in das "userInput" Feld. Für "correctedAnswer": Nimm die originale Antwort und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte die handschriftliche Brief/E-Mail-Antwort im Bild für die Telc A2 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Aufgabenstellung:**
${request.instructionHeader}

**Zu bearbeitende Punkte:**
${request.taskPoints.map((point, index) => `${index + 1}. ${point.text}`).join('\n')}

---

WICHTIGE ANWEISUNGEN:
1. Lese zuerst den GESAMTEN handschriftlichen Text im Bild sorgfältig
2. Extrahiere den Text BUCHSTÄBLICH wie geschrieben - mit allen Fehlern und Rechtschreibfehlern
3. Kopiere diesen extrahierten Text GENAU in das "userInput" Feld im JSON
4. Erfinde KEINE Beispielantwort - verwende NUR den tatsächlichen Text aus dem Bild
5. Bewerte dann diese extrahierte Antwort nach den Telc A2 Kriterien
6. Für "correctedAnswer": Nimm den extrahierten Text und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort.

Das "userInput" Feld muss den EXAKTEN Text aus dem Bild enthalten, nicht eine erfundene oder ideale Antwort.`;
}

/**
 * Calls OpenAI API to assess the writing
 */
async function callOpenAI(userPrompt: string, imageBase64?: string): Promise<WritingAssessmentA2> {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    console.log('Starting OpenAI API call for A2 evaluation...');
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
        'Authorization': `Bearer ${apiKey}`,
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

    const assessment: WritingAssessmentA2 = JSON.parse(content);
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
export const evaluateWritingGermanA2 = functions.https.onRequest(
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
      if (!data.examTitle || !data.instructionHeader || !data.taskPoints) {
        res.status(400).json({
          error: 'Missing required fields: examTitle, instructionHeader, or taskPoints'
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
      let assessment: WritingAssessmentA2;

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
      console.error('Error in evaluateWritingGermanA2 function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);
