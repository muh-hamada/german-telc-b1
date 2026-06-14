#!/usr/bin/env node

/**
 * Generate Explanations for German B2 Listening Questions
 * 
 * This script:
 * 1. Reads listening exam data from Firebase Firestore
 * 2. For exams missing audio_transcript: downloads audio and transcribes via OpenAI Whisper
 * 3. For statements missing explanations: generates multilingual explanations via GPT-4
 * 4. Saves results back to Firestore
 * 
 * Usage:
 *   NODE_PATH=app/functions/node_modules node scripts/js/generate-listening-explanations.js [options]
 * 
 * Options:
 *   --part <1|2|3>         Which listening part to process (default: all)
 *   --exam <id>            Process only a specific exam ID
 *   --dry-run              Don't write to Firestore, just show what would be done
 *   --transcribe-only      Only transcribe audio, skip explanation generation
 *   --explain-only         Only generate explanations (skip transcription, requires existing transcripts)
 *   --force                Re-generate even if transcript/explanation already exists
 * 
 * Environment:
 *   OPENAI_API_KEY         Required. Your OpenAI API key.
 * 
 * Requires:
 *   - firebase-admin (from app/functions/node_modules)
 *   - Service account JSON in project root
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

// ============ Configuration ============

const PROJECT_ID = 'telc-b1-german';
const COLLECTION_NAME = 'german_b2_telc_exam_data';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REQUIRED_LANGUAGES = ['de', 'en', 'ar', 'fr', 'es', 'ru'];

const LISTENING_PARTS = {
  1: 'listening-part1',
  2: 'listening-part2',
  3: 'listening-part3',
};

// ============ Parse Arguments ============

const args = process.argv.slice(2);
const options = {
  part: null,       // null = all parts
  examId: null,     // null = all exams
  dryRun: false,
  transcribeOnly: false,
  explainOnly: false,
  force: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--part':
      options.part = parseInt(args[++i]);
      break;
    case '--exam':
      options.examId = parseInt(args[++i]);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--transcribe-only':
      options.transcribeOnly = true;
      break;
    case '--explain-only':
      options.explainOnly = true;
      break;
    case '--force':
      options.force = true;
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

// ============ Validation ============

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it using: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

// ============ Firebase Init ============

function initializeFirebase() {
  if (admin.apps.length) return;

  const serviceAccountPaths = [
    path.resolve(process.cwd(), 'telc-b1-german-firebase-adminsdk-fbsvc-1e05ca1870.json'),
    path.resolve(__dirname, '../../telc-b1-german-firebase-adminsdk-fbsvc-1e05ca1870.json'),
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(__dirname, '../../service-account.json'),
  ];

  for (const file of serviceAccountPaths) {
    try {
      const serviceAccount = require(file);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID,
      });
      console.log(`✓ Firebase initialized with: ${path.basename(file)}`);
      return;
    } catch (e) {
      // Continue
    }
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
  console.log('✓ Firebase initialized with application-default credentials');
}

// ============ Audio Download ============

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `listening-audio-${Date.now()}.mp3`);
    const proto = url.startsWith('https') ? https : http;

    proto.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} downloading audio`));
        return;
      }

      const fileStream = fs.createWriteStream(tmpFile);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(tmpFile);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// ============ OpenAI Whisper Transcription ============

async function transcribeAudio(audioFilePath) {
  const FormData = (await import('node-fetch')).default ? null : null;
  
  // Use native fetch with form data for file upload
  const fileBuffer = fs.readFileSync(audioFilePath);
  const boundary = '----FormBoundary' + Date.now().toString(16);
  
  const fileName = path.basename(audioFilePath);
  
  // Build multipart form data manually
  const parts = [];
  
  // File part
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: audio/mpeg\r\n\r\n`
  );
  parts.push(fileBuffer);
  parts.push('\r\n');
  
  // Model part
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `whisper-1\r\n`
  );
  
  // Language hint (German)
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language"\r\n\r\n` +
    `de\r\n`
  );
  
  // Response format
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
    `text\r\n`
  );
  
  parts.push(`--${boundary}--\r\n`);
  
  // Combine into single buffer
  const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
  const body = Buffer.concat(bodyParts);
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${errorText}`);
  }

  const transcript = await response.text();
  return transcript.trim();
}

// ============ OpenAI GPT-4: Split Transcript + Generate Explanations ============

/**
 * Uses GPT-4 to:
 * 1. Split the full transcript into per-statement audio_transcript segments
 * 2. Generate multilingual explanations for each statement
 * 
 * This is done in a single call so the AI can intelligently match transcript
 * sections to statements and produce accurate explanations.
 */
async function splitAndExplain(fullTranscript, statements, partNumber) {
  const contextDescription = getPartContext(partNumber);
  
  const statementsJson = statements.map(s => ({
    id: s.id,
    statement: s.statement,
    is_correct: s.is_correct,
  }));

  const prompt = `You are an expert German language teacher preparing explanations for a TELC B2 German listening comprehension exam.

Context: ${contextDescription}

The full audio transcript is:
---
${fullTranscript}
---

The exam has these statements that students must mark as correct (+) or false (-):
${JSON.stringify(statementsJson, null, 2)}

For EACH statement, you must:
1. Extract the exact portion of the transcript that is relevant to that statement (the "audio_transcript" — this is the part of the audio the student needs to understand to answer this specific question). Keep it verbatim from the transcript.
2. Generate a concise explanation (2-3 sentences) of WHY the statement is correct or incorrect based on the transcript. Reference specific words or phrases that support or contradict the statement.
3. Provide the explanation in 6 languages: "de", "en", "ar", "fr", "es", "ru"

Return a JSON array with one object per statement, in the same order:
[
  {
    "id": <statement id>,
    "audio_transcript": "<the exact verbatim portion of the transcript relevant to this statement>",
    "explanation": {
      "de": "<German explanation>",
      "en": "<English explanation>",
      "ar": "<Arabic explanation>",
      "fr": "<French explanation>",
      "es": "<Spanish explanation>",
      "ru": "<Russian explanation>"
    }
  },
  ...
]

Important:
- The audio_transcript must be copied verbatim from the transcript above (not paraphrased).
- Each audio_transcript segment should contain ONLY the part relevant to its statement.
- Explanations should be concise but specific, quoting key phrases from the transcript.

Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GPT-4 API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON (handle potential markdown wrapping)
  let jsonStr = content;
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  const results = JSON.parse(jsonStr);
  
  if (!Array.isArray(results)) {
    throw new Error('Expected JSON array from GPT-4');
  }

  // Validate results
  for (const result of results) {
    if (!result.audio_transcript || typeof result.audio_transcript !== 'string') {
      throw new Error(`Missing audio_transcript for statement ${result.id}`);
    }
    if (!result.explanation || typeof result.explanation !== 'object') {
      throw new Error(`Missing explanation for statement ${result.id}`);
    }
    for (const lang of REQUIRED_LANGUAGES) {
      if (!result.explanation[lang] || typeof result.explanation[lang] !== 'string' || result.explanation[lang].trim().length === 0) {
        throw new Error(`Missing or empty "${lang}" in explanation for statement ${result.id}`);
      }
    }
  }

  return results;
}

/**
 * For Part 2: generates explanations using the exam-level transcript.
 * Uses a single GPT-4 call for all statements.
 */
async function generateExplanationsForPart2(examTranscript, statements) {
  return splitAndExplain(examTranscript, statements, 2);
}

function getPartContext(partNumber) {
  switch (partNumber) {
    case 1:
      return 'Hörverstehen Teil 1 (Global Comprehension) - Students hear 5 short news clips played one after another. Each clip is a separate news item. Students must decide if 5 statements (one per clip) are correct (+) or false (-).';
    case 2:
      return 'Hörverstehen Teil 2 (Detail Comprehension) - Students hear one long conversation/interview. They must decide if 10 statements about the conversation are correct (+) or false (-). All statements relate to the same audio.';
    case 3:
      return 'Hörverstehen Teil 3 (Selective Comprehension) - Students hear 5 short announcements/messages (voicemail, radio ad, public announcement, etc.). Each statement relates to a separate announcement. Students must decide if statements are correct (+) or false (-).';
    default:
      return 'German B2 TELC listening comprehension';
  }
}

// ============ Main Processing ============

async function processListeningPart(db, partNumber, docId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Processing: ${docId} (Listening Part ${partNumber})`);
  console.log(`${'='.repeat(60)}\n`);

  const docRef = db.collection(COLLECTION_NAME).doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log(`  ⚠ Document "${docId}" does not exist. Skipping.`);
    return;
  }

  const rawData = docSnap.data();
  const data = rawData.data || rawData;
  const exams = data.exams || [];
  let modified = false;

  for (let examIdx = 0; examIdx < exams.length; examIdx++) {
    const exam = exams[examIdx];

    // Filter by exam ID if specified
    if (options.examId !== null && exam.id !== options.examId) continue;

    console.log(`  ─── Exam ${exam.id}: ${exam.title || '(untitled)'} ───`);

    // Determine if we need transcription
    const needsTranscription = !options.explainOnly && examNeedsTranscription(exam, partNumber);
    
    if (needsTranscription) {
      console.log(`    📥 Downloading audio: ${exam.audio_url?.slice(0, 80)}...`);
      
      try {
        const audioFile = await downloadFile(exam.audio_url);
        console.log(`    🎤 Transcribing with Whisper...`);
        const fullTranscript = await transcribeAudio(audioFile);
        
        // Clean up temp file
        fs.unlinkSync(audioFile);
        
        console.log(`    ✓ Transcript length: ${fullTranscript.length} chars`);
        
        // For Part 2: transcript goes at exam level (one conversation for all statements)
        if (partNumber === 2) {
          exam.audio_transcript = fullTranscript;
          modified = true;
          console.log(`    ✓ Saved exam-level transcript`);
        } else {
          // For Part 1 & 3: we need to split transcript into per-statement segments
          // The audio typically has numbered sections (Nummer 41, 42, etc.)
          const segments = splitTranscriptByStatements(fullTranscript, exam.statements);
          
          for (let si = 0; si < exam.statements.length; si++) {
            if (!exam.statements[si].audio_transcript || options.force) {
              exam.statements[si].audio_transcript = segments[si] || fullTranscript;
              modified = true;
            }
          }
          console.log(`    ✓ Split transcript into ${segments.length} segments`);
        }
      } catch (error) {
        console.error(`    ✗ Transcription failed: ${error.message}`);
        continue;
      }
    } else if (!options.explainOnly) {
      console.log(`    ⏭  Transcript already exists`);
    }

    // Generate explanations
    if (!options.transcribeOnly) {
      for (let si = 0; si < exam.statements.length; si++) {
        const stmt = exam.statements[si];
        
        // Skip if explanation already exists (unless --force)
        if (stmt.explanation && !options.force) {
          continue;
        }

        // Get the relevant transcript for this statement
        const transcript = getTranscriptForStatement(exam, stmt, partNumber);
        
        if (!transcript) {
          console.log(`    ⚠ Statement ${stmt.id}: No transcript available, skipping explanation`);
          continue;
        }

        console.log(`    💡 Generating explanation for statement ${stmt.id}...`);
        
        try {
          const explanation = await generateExplanation(
            stmt.statement,
            stmt.is_correct,
            transcript,
            partNumber
          );
          
          if (options.dryRun) {
            console.log(`    [DRY RUN] Would set explanation for statement ${stmt.id}:`);
            console.log(`      de: ${explanation.de.slice(0, 80)}...`);
          } else {
            exam.statements[si].explanation = explanation;
            modified = true;
            console.log(`    ✓ Statement ${stmt.id}: explanation generated`);
          }
          
          // Rate limiting - wait between API calls
          await sleep(500);
        } catch (error) {
          console.error(`    ✗ Statement ${stmt.id}: ${error.message}`);
        }
      }
    }
  }

  // Save back to Firestore
  if (modified && !options.dryRun) {
    console.log(`\n  💾 Saving updates to Firestore...`);
    
    // Preserve the wrapper structure
    if (rawData.data) {
      await docRef.update({ data: data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await docRef.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    console.log(`  ✓ Saved successfully!`);
  } else if (options.dryRun) {
    console.log(`\n  [DRY RUN] No changes written to Firestore.`);
  } else {
    console.log(`\n  ℹ No changes needed.`);
  }
}

// ============ Helpers ============

function examNeedsTranscription(exam, partNumber) {
  if (partNumber === 2) {
    // Part 2: check exam-level transcript
    return !exam.audio_transcript || options.force;
  } else {
    // Part 1 & 3: check per-statement transcripts
    return exam.statements?.some(s => !s.audio_transcript) || options.force;
  }
}

function getTranscriptForStatement(exam, stmt, partNumber) {
  if (partNumber === 2) {
    // Part 2: use exam-level transcript for all statements
    return exam.audio_transcript || null;
  } else {
    // Part 1 & 3: use per-statement transcript
    return stmt.audio_transcript || null;
  }
}

function splitTranscriptByStatements(fullTranscript, statements) {
  // Try to split by "Nummer XX" markers
  const segments = [];
  const ids = statements.map(s => s.id);
  
  for (let i = 0; i < ids.length; i++) {
    const currentId = ids[i];
    const nextId = ids[i + 1];
    
    // Look for "Nummer XX" or just the number pattern
    const patterns = [
      new RegExp(`Nummer\\s+${currentId}[.\\s,]`, 'i'),
      new RegExp(`Nr\\.?\\s*${currentId}[.\\s,]`, 'i'),
      new RegExp(`${currentId}[.\\s]`, 'i'),
    ];
    
    let startIdx = -1;
    for (const pattern of patterns) {
      const match = fullTranscript.search(pattern);
      if (match !== -1) {
        startIdx = match;
        break;
      }
    }
    
    let endIdx = fullTranscript.length;
    if (nextId) {
      const nextPatterns = [
        new RegExp(`Nummer\\s+${nextId}[.\\s,]`, 'i'),
        new RegExp(`Nr\\.?\\s*${nextId}[.\\s,]`, 'i'),
      ];
      for (const pattern of nextPatterns) {
        const match = fullTranscript.search(pattern);
        if (match !== -1) {
          endIdx = match;
          break;
        }
      }
    }
    
    if (startIdx !== -1) {
      // Extract segment and clean up the "Nummer XX" prefix
      let segment = fullTranscript.slice(startIdx, endIdx).trim();
      segment = segment.replace(/^(Nummer|Nr\.?)\s*\d+[.,\s]*/i, '').trim();
      segments.push(segment);
    } else {
      // Couldn't find the marker, use equal division as fallback
      const chunkSize = Math.floor(fullTranscript.length / statements.length);
      segments.push(fullTranscript.slice(i * chunkSize, (i + 1) * chunkSize).trim());
    }
  }
  
  return segments;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ Main Entry ============

async function main() {
  initializeFirebase();
  const db = admin.firestore();

  console.log('\n📋 German B2 Listening - Explanation Generator');
  console.log(`   Options: part=${options.part || 'all'}, exam=${options.examId ?? 'all'}, dryRun=${options.dryRun}, force=${options.force}`);
  console.log(`   Mode: ${options.transcribeOnly ? 'transcribe-only' : options.explainOnly ? 'explain-only' : 'full (transcribe + explain)'}`);

  const partsToProcess = options.part 
    ? { [options.part]: LISTENING_PARTS[options.part] }
    : LISTENING_PARTS;

  for (const [partNum, docId] of Object.entries(partsToProcess)) {
    await processListeningPart(db, parseInt(partNum), docId);
  }

  console.log('\n✅ Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
