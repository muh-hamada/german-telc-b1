/**
 * Firebase Cloud Functions for DELE Spanish B1 Writing Assessment
 * 
 * This function integrates with OpenAI's API to evaluate user's writing responses
 * based on DELE Spanish B1 exam criteria.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WritingAssessment, EvaluationRequest } from './types';
import { getOpenAIKey } from './api-keys';

if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

/**
 * System prompt that defines the AI's role as a DELE B1 Spanish examiner
 */
const SYSTEM_PROMPT = `Eres un evaluador experimentado del examen DELE B1 de español, especializado en la expresión escrita.

Tu tarea es evaluar respuestas de correo electrónico según los criterios oficiales del DELE B1:

**Criterio I: Cohesión y coherencia (8 puntos)**
- A (8 puntos): Todos los cuatro puntos clave están desarrollados de manera clara y coherente
- B (6 puntos): Tres puntos clave están desarrollados de manera clara y coherente
- C (3-4 puntos): Dos puntos clave están desarrollados de manera clara y coherente
- D (0-2 puntos): Solo un punto clave o ningún punto clave está desarrollado

**Criterio II: Alcance y Adecuación sociolingüística (9 puntos)**
- A (9 puntos): Saludo y despedida apropiados; las oraciones están bien conectadas; el registro es consistentemente adecuado
- B (7 puntos): Saludo y despedida apropiados; hay una estructura reconocible; el registro varía ligeramente
- C (3-5 puntos): Falta el saludo o la despedida; la conexión entre oraciones no siempre es clara; el registro es parcialmente inapropiado
- D (0-2 puntos): Faltan saludo y despedida; no hay estructura reconocible

**Criterio III: Corrección gramatical (8 puntos)**
- A (8 puntos): La sintaxis es correcta; hay algunos errores de ortografía/puntuación que no dificultan la comprensión
- B (6 puntos): La sintaxis es mayormente correcta; los errores dificultan la comprensión en algunos lugares
- C (3-4 puntos): Muchos errores de sintaxis/morfología; la comprensión está significativamente dificultada
- D (0-2 puntos): La sintaxis es predominantemente incorrecta; el texto es apenas comprensible

IMPORTANTE: El campo "userInput" debe contener EXACTAMENTE la respuesta del participante tal como fue proporcionada. Para imágenes: Extrae el texto EXACTAMENTE como está escrito, sin cambios, adiciones o correcciones. NUNCA inventes una respuesta de ejemplo.

Proporciona tu evaluación en formato JSON con la siguiente estructura:
{
  "overallScore": <Puntos totales>,
  "userInput": "<Respuesta EXACTA del participante - para imágenes: el texto extraído sin cambios>",
  "maxScore": 25,
  "criteria": {
    "taskCompletion": {
      "grade": "<A/B/C/D>",
      "feedback": "<Retroalimentación detallada>"
    },
    "communicativeDesign": {
      "grade": "<A/B/C/D>",
      "feedback": "<Retroalimentación detallada>"
    },
    "formalCorrectness": {
      "grade": "<A/B/C/D>",
      "feedback": "<Retroalimentación detallada>"
    }
  },
  "correctedAnswer": "<La respuesta corregida con resaltado en Markdown>"
}

IMPORTANTE para "correctedAnswer":
- Toma la respuesta EXACTA del participante y corrige SOLO los errores
- NO crees una nueva respuesta - mantén el texto original
- Usa Markdown para resaltar las correcciones:
  * **negrita** para palabras/frases corregidas
  * ~~tachado~~ para partes eliminadas/incorrectas (opcional, si es necesario)
- Si no hay errores, devuelve la respuesta original
- Ejemplo: "Yo **he** ido al cine ayer" → "Yo **fui** al cino ayer"`;

/**
 * Creates a user prompt for text evaluation
 */
function createUserPrompt(request: EvaluationRequest): string {
  return `Por favor, evalúa la siguiente respuesta de correo electrónico para el examen DELE B1:

**Tarea del examen:** ${request.examTitle}

**Correo electrónico recibido:**
${request.incomingEmail}

**Puntos clave a desarrollar:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**Respuesta del participante:**
${request.userAnswer}

---

Evalúa esta respuesta según los criterios del DELE B1 y devuelve el resultado en formato JSON. Copia la respuesta del participante EXACTAMENTE en el campo "userInput". Para "correctedAnswer": Toma la respuesta original y corrige solo los errores con resaltado en Markdown (usa **negrita** para correcciones). NO crees una nueva respuesta.`;
}

/**
 * Creates a user prompt for image evaluation
 */
function createImageUserPrompt(request: EvaluationRequest): string {
  return `Por favor, evalúa la respuesta de correo electrónico escrita a mano en la imagen para el examen DELE B1:

**Tarea del examen:** ${request.examTitle}

**Correo electrónico recibido:**
${request.incomingEmail}

**Puntos clave a desarrollar:**
${request.writingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

---

INSTRUCCIONES IMPORTANTES:
1. Primero lee TODO el texto escrito a mano en la imagen cuidadosamente
2. Extrae el texto LITERALMENTE como está escrito - con todos los errores y faltas de ortografía
3. Copia este texto extraído EXACTAMENTE en el campo "userInput" del JSON
4. NO inventes una respuesta de ejemplo - usa SOLO el texto real de la imagen
5. Luego evalúa esta respuesta extraída según los criterios del DELE B1
6. Para "correctedAnswer": Toma el texto extraído y corrige solo los errores con resaltado en Markdown (usa **negrita** para correcciones). NO crees una nueva respuesta.

El campo "userInput" debe contener el texto EXACTO de la imagen, no una respuesta inventada o ideal.`;
}

/**
 * Calls OpenAI API to assess the writing
 */
async function callOpenAI(userPrompt: string, imageBase64?: string): Promise<WritingAssessment> {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
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
export const evaluateWritingDeleSpanishB1 = functions.https.onRequest(
  async (req, res) => {
    console.log('=== Function Started ===');
    console.log('Method:', req.method);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request - returning 204');
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      console.log('Non-POST request - returning 405');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      console.log('Parsing request body...');
      const data: EvaluationRequest = req.body;

      // Validate input
      console.log('Validating input...');
      console.log('Has incomingEmail:', !!data.incomingEmail);
      console.log('Has writingPoints:', !!data.writingPoints);
      console.log('Has examTitle:', !!data.examTitle);
      console.log('Has userAnswer:', !!data.userAnswer);
      console.log('Has imageBase64:', !!data.imageBase64);
      
      if (!data.incomingEmail || !data.writingPoints || !data.examTitle) {
        console.log('Missing required fields');
        res.status(400).json({
          error: 'Missing required fields: incomingEmail, writingPoints, or examTitle'
        });
        return;
      }

      if (!data.userAnswer && !data.imageBase64) {
        console.log('Missing both userAnswer and imageBase64');
        res.status(400).json({
          error: 'Either userAnswer or imageBase64 must be provided'
        });
        return;
      }

      console.log('Validation passed, preparing to call OpenAI...');
      let userPrompt: string;
      let assessment: WritingAssessment;

      if (data.imageBase64) {
        // Image evaluation
        console.log('Processing image evaluation...');
        userPrompt = createImageUserPrompt(data);
        assessment = await callOpenAI(userPrompt, data.imageBase64);
      } else {
        // Text evaluation
        console.log('Processing text evaluation...');
        userPrompt = createUserPrompt(data);
        assessment = await callOpenAI(userPrompt);
      }

      // Log successful evaluation (optional)
      console.log('Writing evaluation completed', {
        score: assessment.overallScore,
        examTitle: data.examTitle,
        hasImage: !!data.imageBase64,
      });

      console.log('Sending response...');
      res.status(200).json(assessment);
    } catch (error) {
      console.error('Error in evaluateWritingDeleSpanishB1 function:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);
