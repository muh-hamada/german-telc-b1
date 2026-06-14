#!/usr/bin/env node

/**
 * Upload Writing Model Answers to Firebase
 * 
 * Reads a completed JSON file (with modalAnswer filled in for each exam)
 * and updates the corresponding Firestore document.
 * 
 * Usage:
 *   NODE_PATH=app/functions/node_modules node scripts/js/upload-writing-model-answers.js <file>
 * 
 * Example:
 *   NODE_PATH=app/functions/node_modules node scripts/js/upload-writing-model-answers.js scripts/js/writing-data/german-b1/writing.json
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ============ Configuration ============

const PROJECT_ID = 'telc-b1-german';

// ============ Parse Arguments ============

const inputFile = process.argv[2];

if (!inputFile) {
  console.error('❌ Usage: node upload-writing-model-answers.js <path-to-json-file>');
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
  if (!Array.isArray(data.exams)) errors.push('Missing "exams" array');

  if (data.exams) {
    for (const exam of data.exams) {
      const examLabel = `Exam ${exam.id}`;
      if (!exam.modalAnswer || typeof exam.modalAnswer !== 'string' || exam.modalAnswer.trim().length === 0) {
        errors.push(`${examLabel}: missing or empty "modalAnswer"`);
      }
    }
  }

  return errors;
}

// ============ Main ============

async function main() {
  console.log(`\n📋 Upload Writing Model Answers`);
  console.log(`   File: ${resolvedPath}\n`);

  // Read input
  const inputData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

  const COLLECTION_NAME = inputData.collection;
  const DOC_ID = inputData.docId;
  const exams = inputData.exams || [];

  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Document: ${DOC_ID}`);
  console.log(`   Exams to update: ${exams.length}`);

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

  // Fetch current document
  const docRef = db.collection(COLLECTION_NAME).doc(DOC_ID);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.error(`❌ Document "${DOC_ID}" does not exist in collection "${COLLECTION_NAME}"`);
    process.exit(1);
  }

  const rawData = docSnap.data();
  const data = rawData.data || rawData;
  const firestoreExams = data.exams || [];

  console.log(`\n   Firestore has ${firestoreExams.length} exams in this document`);

  // Update each exam with its modalAnswer
  let updatedCount = 0;
  for (const inputExam of exams) {
    const examIdx = firestoreExams.findIndex(e => e.id === inputExam.id);
    if (examIdx === -1) {
      console.error(`  ⚠ Exam with id=${inputExam.id} not found in Firestore, skipping`);
      continue;
    }
    firestoreExams[examIdx].modalAnswer = inputExam.modalAnswer;
    updatedCount++;
    console.log(`   ✓ Updated exam ${inputExam.id}: "${(inputExam.modalAnswer || '').substring(0, 50)}..."`);
  }

  // Save back to Firestore
  console.log(`\n💾 Saving ${updatedCount} updated exams to Firestore...`);
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
