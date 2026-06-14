#!/usr/bin/env node

/**
 * Upload Listening Explanations to Firebase
 * 
 * Step 3 of the explanation generation workflow:
 * Reads a completed JSON file (with audio_transcript + explanation filled in)
 * and updates the corresponding Firestore document.
 * 
 * Usage:
 *   NODE_PATH=app/functions/node_modules node scripts/js/upload-listening-explanations.js <file>
 * 
 * Example:
 *   NODE_PATH=app/functions/node_modules node scripts/js/upload-listening-explanations.js scripts/js/listening-data/part1-exam1.json
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ============ Configuration ============

const PROJECT_ID = 'telc-b1-german';
const REQUIRED_LANGUAGES = ['de', 'en', 'ar', 'fr', 'es', 'ru'];

// ============ Parse Arguments ============

const inputFile = process.argv[2];

if (!inputFile) {
  console.error('❌ Usage: node upload-listening-explanations.js <path-to-json-file>');
  process.exit(1);
}

const resolvedPath = path.resolve(inputFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found: ${resolvedPath}`);
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

// ============ Validation ============

function validateInput(data) {
  const errors = [];

  if (!data.collection) errors.push('Missing "collection"');
  if (!data.docId) errors.push('Missing "docId"');
  if (data.examId === undefined) errors.push('Missing "examId"');
  
  const items = data.statements || data.questions;
  const schemaType = data.statements ? 'statements' : 'questions';
  if (!Array.isArray(items)) errors.push('Missing "statements" or "questions" array');

  if (items) {
    for (const item of items) {
      const itemLabel = schemaType === 'statements' ? `Statement ${item.id}` : `Question ${item.id}`;
      const transcriptField = schemaType === 'statements' ? 'audio_transcript' : 'audio_transcription';
      
      if (!item[transcriptField]) {
        errors.push(`${itemLabel}: missing "${transcriptField}"`);
      }
      if (!item.explanation) {
        errors.push(`${itemLabel}: missing "explanation"`);
      } else if (typeof item.explanation === 'object') {
        for (const lang of REQUIRED_LANGUAGES) {
          if (!item.explanation[lang] || item.explanation[lang].trim().length === 0) {
            errors.push(`${itemLabel}: missing "${lang}" in explanation`);
          }
        }
      }
    }
  }

  return errors;
}

// ============ Main ============

async function main() {
  console.log(`\n📋 Upload Listening Explanations`);
  console.log(`   File: ${resolvedPath}\n`);

  // Read input
  const inputData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

  const COLLECTION_NAME = inputData.collection;
  const schemaType = inputData.statements ? 'statements' : 'questions';
  const items = inputData.statements || inputData.questions || [];

  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Part: ${inputData.part}`);
  console.log(`   Exam ID: ${inputData.examId}`);
  console.log(`   Document: ${inputData.docId}`);
  console.log(`   Schema: ${schemaType} (${items.length} items)`);

  // Validate
  const errors = validateInput(inputData);
  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  console.log('\n✓ Validation passed');

  // Initialize Firebase
  initializeFirebase();
  const db = admin.firestore();

  if (!COLLECTION_NAME) {
    console.error('❌ JSON file is missing "collection" field. Add it to specify the Firestore collection.');
    process.exit(1);
  }

  // Fetch current document
  const docRef = db.collection(COLLECTION_NAME).doc(inputData.docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.error(`❌ Document "${inputData.docId}" does not exist in Firestore`);
    process.exit(1);
  }

  const rawData = docSnap.data();
  const data = rawData.data || rawData;
  const exams = data.exams || [];
  const examIdx = exams.findIndex(e => e.id === inputData.examId);

  if (examIdx === -1) {
    console.error(`❌ Exam with id=${inputData.examId} not found in Firestore document`);
    process.exit(1);
  }

  // Update items with transcript and explanation
  const exam = exams[examIdx];
  const examItems = exam.statements || exam.questions || [];
  const inputItems = inputData.statements || inputData.questions || [];
  const transcriptField = schemaType === 'statements' ? 'audio_transcript' : 'audio_transcription';

  for (const inputItem of inputItems) {
    const itemIdx = examItems.findIndex(s => s.id === inputItem.id);
    if (itemIdx === -1) {
      console.error(`  ⚠ Item ${inputItem.id} not found in Firestore, skipping`);
      continue;
    }
    examItems[itemIdx][transcriptField] = inputItem[transcriptField];
    examItems[itemIdx].explanation = inputItem.explanation;
    // Also update is_correct if it was corrected
    if (schemaType === 'statements' && inputItem.is_correct !== undefined) {
      examItems[itemIdx].is_correct = inputItem.is_correct;
    }
  }

  // Save back to Firestore
  console.log('\n💾 Saving to Firestore...');
  if (rawData.data) {
    await docRef.update({ data: data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  } else {
    await docRef.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  console.log('✅ Done! Updated Firestore successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
