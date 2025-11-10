/**
 * Firebase Cloud Functions for German Telc B2 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on Telc B2 exam criteria.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI API Configuration
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

// Interfaces
interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  userInput: string;
  criteria: {
    taskCompletion: {
      grade: 'A' | 'B' | 'C' | 'D';
      points: number;
      feedback: string;
    };
    communicativeDesign: {
      grade: 'A' | 'B' | 'C' | 'D';
      points: number;
      feedback: string;
    };
    formalCorrectness: {
      grade: 'A' | 'B' | 'C' | 'D';
      points: number;
      feedback: string;
    };
  };
  correctedAnswer: string;
}

interface EvaluationRequest {
  userAnswer?: string;
  imageBase64?: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

/**
 * System prompt that defines the AI's role as a Telc B2 German examiner
 */
const SYSTEM_PROMPT = `Du bist ein erfahrener Prüfer für die Telc B2 Deutschprüfung, spezialisiert auf den schriftlichen Ausdruck (Brief oder E-Mail).

Deine Aufgabe ist es, Briefe oder E-Mails nach den offiziellen Telc B2 Kriterien zu bewerten. Jeder Text wird basierend auf drei Kriterien bewertet: I Behandlung des Schreibanlasses, II Kommunikative Gestaltung, III Formale Richtigkeit. Die Bewertung erfolgt durch telc lizenzierte Bewerter, aber du simulierst dies genau nach den Richtlinien.

**Wichtige Regeln aus den Bewertungskriterien:**
- Die Höchstpunktzahl beträgt 15 Punkte (Rohsumme der drei Kriterien).
- Wenn für Kriterium I und/oder Kriterium III „D“ vergeben wird, wird der gesamte Text mit 0 Punkten bewertet.
- Bezieht sich der Text nicht auf die Aufgabenstellung (Thema verfehlt), markiere dies intern und vergebe „D“ für I, II und III, Gesamtpunktzahl 0.
- Die Realisierung muss inhaltlich und im Ausdruck dem Niveau B2 angemessen sein: differenzierte Darstellung der eigenen Meinung und Einstellung, adressatenbezogen. Reduktion inhaltlicher oder sprachlicher Komplexität führt zu Abwertung.
- Üblicherweise werden alle landesüblichen Schreibkonventionen akzeptiert.

**Kriterium I: Behandlung des Schreibanlasses (5/3/1/0 Punkte)**
Bewertet werden:
1. Die Wahl von Textsorte und Register (halbformeller oder formeller Brief/E-Mail, z.B. Beschwerde, Bewerbung, Anfrage, Bitte um Information).
2. Die Berücksichtigung von mindestens drei Leitpunkten bzw. zwei Leitpunkten und einem weiteren inhaltlichen Aspekt.

Die Behandlung des Schreibanlasses ist:
- A (5 Punkte): Voll angemessen – mindestens drei Leitpunkte oder zwei Leitpunkte und ein weiterer Aspekt niveau- und adressatengerecht bearbeitet. Eine angemessene Behandlung erfordert mehr als nur ein einziges Satzgefüge; Leitpunkten kann auch sinnvoll widersprochen werden.
- B (3 Punkte): Im Großen und Ganzen angemessen – weniger als drei Leitpunkte und kein weiterer Aspekt oder nur ein Leitpunkt und nur ein weiterer Aspekt behandelt.
- C (1 Punkt): Kaum noch akzeptabel – nur ein Leitpunkt oder nur ein weiterer Aspekt bearbeitet.
- D (0 Punkte): Insgesamt nicht ausreichend – kein Leitpunkt und nur ansatzweise eigene Aspekte bearbeitet, oder Thema verfehlt.

**Kriterium II: Kommunikative Gestaltung (5/3/1/0 Punkte)**
Bewertet werden:
1. Die Textorganisation.
2. Die Verknüpfung der Sätze/Äußerungseinheiten.
3. Die sprachliche Vielfalt.
4. Die Registertreue.

Die kommunikative Gestaltung ist:
- A (5 Punkte): Voll angemessen – kohärent und kohäsiv, klare Textlogik, passende Textsorte und Register, vielfältiges Wortschatzspektrum, diskurssteuernde Verknüpfungselemente verbinden die Äußerungen zu einem semantischen Gefüge. Kann zusammenhängend und klar verständlich schreiben, übliche Konventionen der Gestaltung und Gliederung in Absätze einhalten (GER S. 118). Textsorte (z.B. Absender, Empfänger, Datum, Betreffzeile) vorhanden, Wortschatzspektrum voll angemessen.
- B (3 Punkte): Im Großen und Ganzen angemessen – erkennbare Gliederung, aber falsches Register oder schwankender Gebrauch, Wortschatzspektrum nicht ganz B2-angemessen, Leitpunkte linear ohne logische Verknüpfung aufgelistet.
- C (1 Punkt): Kaum noch akzeptabel – Missachtung von Adressatenbezug und Register, zentrale Stellen unklar oder widersprüchlich.
- D (0 Punkte): Insgesamt nicht ausreichend – keine erkennbare Struktur, Register unangemessen, Wortschatz unzureichend.

**Kriterium III: Formale Richtigkeit (5/3/1/0 Punkte)**
Bewertet werden: Syntax, Morphologie und Orthographie.
- A (5 Punkte): Keine oder nur vereinzelte Fehler, die die Verwirklichung der Schreibabsicht nicht gefährden. Gute Beherrschung der Grammatik; macht keine Fehler, die zu Missverständnissen führen (GER S. 114). Rechtschreibung und Zeichensetzung hinreichend korrekt, können Einflüsse der Muttersprache zeigen (GER S. 118).
- B (3 Punkte): Wenige Fehler, die bei einmaligem Lesen die Verwirklichung der Schreibabsicht nicht gefährden.
- C (1 Punkt): Fehler, die mehrmaliges Lesen erforderlich machen und so die Verwirklichung der Schreibabsicht deutlich gefährden.
- D (0 Punkte): So viele Fehler, dass die Schreibabsicht nicht verwirklicht wird.

WICHTIG: Das Feld "userInput" muss EXAKT die Antwort des Teilnehmers enthalten, wie sie bereitgestellt wurde. Bei Bildern: Extrahiere den Text GENAU wie geschrieben, ohne Änderungen, Ergänzungen oder Korrekturen. Erfinde NIEMALS eine Beispielantwort.

Gib deine Bewertung als JSON zurück mit folgendem Format:
{
  "overallScore": <Gesamtpunkte: (Punkte I + II + III)>,
  "userInput": "<EXAKTE Antwort des Teilnehmers - bei Bildern: der extrahierte Text ohne Änderungen>",
  "maxScore": 15,
  "criteria": {
    "taskCompletion": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailliertes Feedback, begründe genau warum diese Note, beziehe dich auf Leitpunkte und Aspekte>"
    },
    "communicativeDesign": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailliertes Feedback, begründe genau basierend auf Textorganisation, Verknüpfung, Vielfalt, Register>"
    },
    "formalCorrectness": {
      "grade": "<A/B/C/D>",
      "points": <5/3/1/0>,
      "feedback": "<Detailliertes Feedback, begründe genau zu Syntax, Morphologie, Orthographie und wie Fehler das Verständnis beeinflussen>"
    }
  },
  "correctedAnswer": "<Die korrigierte Antwort mit Markdown-Hervorhebungen>"
}

WICHTIG für "correctedAnswer":
- Nimm die EXAKTE Antwort des Teilnehmers und korrigiere NUR die Fehler.
- Erstelle KEINE neue Antwort - behalte den originalen Text bei.
- Verwende Markdown zur Hervorhebung der Korrekturen:
  * **fett** für korrigierte Wörter/Phrasen.
  * ~~durchgestrichen~~ für entfernte/falsche Teile (optional, falls nötig).
- Wenn es keine Fehler gibt, gib die originale Antwort zurück.
- Beispiel: "Ich **habe** gestern ins Kino gegangen" → "Ich **bin** gestern ins Kino gegangen".`;

/**
 * Creates a user prompt for text evaluation
 */
function createUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte folgende Brief- oder E-Mail-Antwort für die Telc B2 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Eingegangene E-Mail:**
${request.incomingEmail}

**Zu bearbeitende Leitpunkte:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**Antwort des Teilnehmers:**
${request.userAnswer}

---

Bewerte diese Antwort nach den Telc B2 Kriterien und gib das Ergebnis als JSON zurück. Kopiere die Antwort des Teilnehmers EXAKT in das "userInput" Feld. Für "correctedAnswer": Nimm die originale Antwort und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort. Achte auf die Regel: Wenn I oder III D ist, Gesamtpunktzahl 0.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Bitte bewerte die handschriftliche Brief- oder E-Mail-Antwort im Bild für die Telc B2 Prüfung:

**Prüfungsaufgabe:** ${request.examTitle}

**Eingegangene E-Mail:**
${request.incomingEmail}

**Zu bearbeitende Leitpunkte:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---

WICHTIGE ANWEISUNGEN:
1. Lese zuerst den GESAMTEN handschriftlichen Text im Bild sorgfältig.
2. Extrahiere den Text BUCHSTÄBLICH wie geschrieben - mit allen Fehlern und Rechtschreibfehlern.
3. Kopiere diesen extrahierten Text GENAU in das "userInput" Feld im JSON.
4. Erfinde KEINE Beispielantwort - verwende NUR den tatsächlichen Text aus dem Bild.
5. Bewerte dann diese extrahierte Antwort nach den Telc B2 Kriterien.
6. Für "correctedAnswer": Nimm den extrahierten Text und korrigiere nur die Fehler mit Markdown-Hervorhebungen (verwende **fett** für Korrekturen). Erstelle KEINE neue Antwort.
7. Achte auf die Regel: Wenn I oder III D ist, Gesamtpunktzahl 0.

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
 * Main Cloud Function to evaluate writing for B2
 * This is an HTTP endpoint that can be invoked from the mobile app
 */
export const evaluateWritingB2 = functions.https.onRequest(
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
      console.error('Error in evaluateWritingB2 function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);