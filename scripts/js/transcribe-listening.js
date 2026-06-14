#!/usr/bin/env node

/**
 * Transcribe Listening Questions (Multi-Exam)
 * 
 * Step 1 of the explanation generation workflow:
 * 1. Reads listening exam data from Firebase Firestore
 * 2. Downloads audio and transcribes via OpenAI Whisper
 * 3. Saves transcript + question data to a local JSON file for manual review
 * 
 * After running this script, bring the output JSON to the AI assistant for:
 * - Splitting the transcript into per-statement segments
 * - Generating explanations
 * - Then use upload-listening-explanations.js to push results to Firebase
 * 
 * Usage:
 *   NODE_PATH=app/functions/node_modules node scripts/js/transcribe-listening.js --collection <name> --part <1|2|3> --exam <id> [--language <code>]
 * 
 * Options:
 *   --collection <name>    Firestore collection (required). Examples:
 *                          german_b2_telc_exam_data, english_b1_telc_exam_data,
 *                          german_a2_telc_exam_data, b1_telc_exam_data
 *   --part <1|2|3>         Which listening part to process (required)
 *   --exam <id>            Process only a specific exam ID (required)
 *   --language <code>      Language hint for Whisper (default: auto-detect from collection)
 *   --force                Re-transcribe even if transcript exists locally
 * 
 * Environment:
 *   OPENAI_API_KEY         Required. Your OpenAI API key.
 * 
 * Output:
 *   scripts/js/listening-data/<collection-prefix>/part<N>-exam<ID>.json
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

// ============ Configuration ============

const PROJECT_ID = 'telc-b1-german';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BASE_OUTPUT_DIR = path.resolve(__dirname, 'listening-data');

const LISTENING_PARTS = {
  1: 'listening-part1',
  2: 'listening-part2',
  3: 'listening-part3',
};

// Map collection prefixes to Whisper language hints
const LANGUAGE_MAP = {
  'german': 'de',
  'b1_telc': 'de',  // b1_telc_exam_data is German B1
  'english': 'en',
  'spanish': 'es',
};

// ============ Parse Arguments ============

const args = process.argv.slice(2);
const options = {
  collection: null,
  part: null,
  examId: null,
  language: null,
  force: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--collection':
      options.collection = args[++i];
      break;
    case '--part':
      options.part = parseInt(args[++i]);
      break;
    case '--exam':
      options.examId = parseInt(args[++i]);
      break;
    case '--language':
      options.language = args[++i];
      break;
    case '--force':
      options.force = true;
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

// Derive language from collection name if not specified
function detectLanguage(collectionName) {
  for (const [prefix, lang] of Object.entries(LANGUAGE_MAP)) {
    if (collectionName.startsWith(prefix)) return lang;
  }
  return null; // Let Whisper auto-detect
}

// Derive a short prefix for output directory
function collectionPrefix(collectionName) {
  return collectionName.replace('_telc_exam_data', '').replace('_exam_data', '');
}

// ============ Validation ============

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it using: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

if (!options.collection) {
  console.error('❌ Error: --collection is required (e.g., german_b2_telc_exam_data)');
  process.exit(1);
}

if (!options.part || !LISTENING_PARTS[options.part]) {
  console.error('❌ Error: --part is required (1, 2, or 3)');
  process.exit(1);
}

if (options.examId === null) {
  console.error('❌ Error: --exam is required (the exam ID to process)');
  process.exit(1);
}

const COLLECTION_NAME = options.collection;
const whisperLanguage = options.language || detectLanguage(COLLECTION_NAME);
const OUTPUT_DIR = path.join(BASE_OUTPUT_DIR, collectionPrefix(COLLECTION_NAME));

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
  const fileBuffer = fs.readFileSync(audioFilePath);
  const boundary = '----FormBoundary' + Date.now().toString(16);
  const fileName = path.basename(audioFilePath);

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

  // Language hint
  if (whisperLanguage) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\n` +
      `${whisperLanguage}\r\n`
    );
  }

  // Response format
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
    `text\r\n`
  );

  parts.push(`--${boundary}--\r\n`);

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

// ============ Main ============

async function main() {
  initializeFirebase();
  const db = admin.firestore();

  const docId = LISTENING_PARTS[options.part];
  const outputFile = path.join(OUTPUT_DIR, `part${options.part}-exam${options.examId}.json`);

  console.log(`\n📋 Transcribe Listening Part ${options.part}, Exam ${options.examId}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Document: ${docId}`);
  console.log(`   Language: ${whisperLanguage || 'auto-detect'}`);
  console.log(`   Output: ${outputFile}\n`);

  // Check if output already exists
  if (!options.force && fs.existsSync(outputFile)) {
    const existing = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    if (existing.transcript) {
      console.log('⏭  Output file already exists with transcript. Use --force to re-transcribe.');
      console.log(`   File: ${outputFile}`);
      process.exit(0);
    }
  }

  // Fetch exam data from Firestore
  console.log('📥 Fetching exam data from Firestore...');
  const docRef = db.collection(COLLECTION_NAME).doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.error(`❌ Document "${docId}" does not exist in Firestore`);
    process.exit(1);
  }

  const rawData = docSnap.data();
  const data = rawData.data || rawData;
  const exams = data.exams || [];
  const exam = exams.find(e => e.id === options.examId);

  if (!exam) {
    console.error(`❌ Exam with id=${options.examId} not found. Available IDs: ${exams.map(e => e.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`✓ Found exam: ${exam.title || '(untitled)'}`);
  
  // Detect schema: some collections use 'statements', others use 'questions'
  const items = exam.statements || exam.questions || [];
  const schemaType = exam.statements ? 'statements' : 'questions';
  console.log(`  Schema: ${schemaType} (${items.length} items)`);
  console.log(`  Audio URL: ${exam.audio_url}`);

  // Download and transcribe
  console.log('\n📥 Downloading audio...');
  const audioFile = await downloadFile(exam.audio_url);
  console.log(`✓ Downloaded to: ${audioFile}`);

  console.log('🎤 Transcribing with Whisper...');
  const transcript = await transcribeAudio(audioFile);
  console.log(`✓ Transcript length: ${transcript.length} chars`);

  // Clean up temp file
  fs.unlinkSync(audioFile);

  // Build output JSON
  const output = {
    collection: COLLECTION_NAME,
    part: options.part,
    examId: options.examId,
    docId: docId,
    title: exam.title || `Exam ${exam.id}`,
    audio_url: exam.audio_url,
    transcript: transcript,
    schemaType: schemaType,
  };

  // Map items based on schema type
  if (schemaType === 'statements') {
    output.statements = items.map(s => ({
      id: s.id,
      statement: s.statement,
      is_correct: s.is_correct,
      audio_transcript: s.audio_transcript || null,
      explanation: s.explanation || null,
    }));
  } else {
    // 'questions' schema (e.g., German A2)
    output.questions = items.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      audio_transcription: q.audio_transcription || null,
      explanation: q.explanation || null,
    }));
  }

  // Save output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Saved to: ${outputFile}`);
  console.log('\nNext step: Open this file and ask the AI assistant to split the transcript and generate explanations.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
