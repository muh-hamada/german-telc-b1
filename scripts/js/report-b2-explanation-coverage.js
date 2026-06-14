#!/usr/bin/env node

/**
 * German B2 Explanation Coverage Report
 * 
 * Connects to Firebase Firestore and scans all German B2 exam content
 * to report which items have explanations and the overall coverage.
 * 
 * Usage:
 *   node scripts/js/report-b2-explanation-coverage.js
 * 
 * Requires either:
 *   - A service-account.json in project root or app/functions/
 *   - gcloud auth application-default login
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase project config
const PROJECT_ID = 'telc-b1-german';
const COLLECTION_NAME = 'german_b2_telc_exam_data';

// Required languages for multilingual explanations
const REQUIRED_LANGUAGES = ['en', 'de', 'ar', 'fr', 'es', 'ru'];

// Initialize Firebase Admin
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
      console.log(`✓ Initialized with service account: ${path.basename(file)}\n`);
      return;
    } catch (e) {
      // Continue to next file
    }
  }

  // Fallback to application default credentials
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
  console.log('✓ Initialized with application-default credentials\n');
}

// Check if an explanation object is valid (has all 6 languages with non-empty strings)
function isValidMultilingualExplanation(explanation) {
  if (!explanation || typeof explanation !== 'object') return false;
  return REQUIRED_LANGUAGES.every(
    (lang) => typeof explanation[lang] === 'string' && explanation[lang].trim().length > 0
  );
}

// Check partial explanation (has some but not all languages)
function getExplanationStatus(explanation) {
  if (!explanation || typeof explanation !== 'object') return { status: 'missing', languages: [] };
  if (typeof explanation === 'string') {
    return explanation.trim().length > 0
      ? { status: 'simple-string', languages: ['single'] }
      : { status: 'missing', languages: [] };
  }
  const presentLangs = REQUIRED_LANGUAGES.filter(
    (lang) => typeof explanation[lang] === 'string' && explanation[lang].trim().length > 0
  );
  if (presentLangs.length === 0) return { status: 'missing', languages: [] };
  if (presentLangs.length === REQUIRED_LANGUAGES.length) return { status: 'complete', languages: presentLangs };
  return { status: 'partial', languages: presentLangs };
}

// ============ Content Type Analyzers ============

function analyzeGrammarPart1(data) {
  const results = { section: 'Grammar Part 1 (Sprachbausteine Teil 1)', exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const questions = exam.questions || [];
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: questions.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (const q of questions) {
      // Check if any answer has explanation, or question itself has explanation
      let hasExplanation = false;
      
      if (q.explanation) {
        const status = getExplanationStatus(q.explanation);
        hasExplanation = status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string';
      }
      
      // Also check individual answers for explanation
      if (!hasExplanation && q.answers) {
        for (const answer of q.answers) {
          if (answer.explanation) {
            const status = getExplanationStatus(answer.explanation);
            if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
              hasExplanation = true;
              break;
            }
          }
        }
      }

      if (hasExplanation) {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Question ${q.id}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeGrammarPart2(data) {
  const results = { section: 'Grammar Part 2 (Sprachbausteine Teil 2)', exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const answers = exam.answers || {};
    const totalQuestions = Object.keys(answers).length;
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    // Grammar Part 2 has explanation as an object keyed by question number (e.g. "31", "32", ...)
    // Each value is a multilingual object {de, en, fr, es, ar, ru}
    const explanation = exam.explanation || exam.explanations || {};

    if (typeof explanation === 'object' && !Array.isArray(explanation)) {
      for (const questionId of Object.keys(answers)) {
        const questionExpl = explanation[questionId];
        const status = getExplanationStatus(questionExpl);
        if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
          examResult.withExplanation++;
        } else {
          examResult.withoutExplanation++;
          examResult.details.push(`  Question ${questionId}: NO explanation`);
        }
      }
    } else {
      examResult.withoutExplanation = totalQuestions;
      if (totalQuestions > 0) {
        examResult.details.push(`  All ${totalQuestions} questions missing explanations`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeReadingPart1(data) {
  const results = { section: 'Reading Part 1 (Leseverstehen Teil 1)', exams: [] };
  // Reading part 1 can be an array directly or have exams wrapper
  const exams = Array.isArray(data) ? data : (data?.exams || data || []);

  for (const exam of (Array.isArray(exams) ? exams : [])) {
    const texts = exam.texts || [];
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: texts.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (const text of texts) {
      const status = getExplanationStatus(text.explanation);
      if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Text ${text.id}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeReadingPart2(data) {
  const results = { section: 'Reading Part 2 (Leseverstehen Teil 2)', exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const questions = exam.questions || [];
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: questions.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (const q of questions) {
      const status = getExplanationStatus(q.explanation);
      if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Question ${q.id}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeReadingPart3(data) {
  const results = { section: 'Reading Part 3 (Leseverstehen Teil 3)', exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const situations = exam.situations || [];
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: situations.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (const situation of situations) {
      const status = getExplanationStatus(situation.explanation);
      if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Situation ${situation.id}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeListeningPart(data, partName) {
  const results = { section: partName, exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const statements = exam.statements || [];
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: statements.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (const stmt of statements) {
      const status = getExplanationStatus(stmt.explanation);
      if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Statement ${stmt.id}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeListeningPractice(data) {
  const results = { section: 'Listening Practice', exams: [] };
  const interviews = data?.interviews || [];

  for (let i = 0; i < interviews.length; i++) {
    const interview = interviews[i];
    const questions = interview.questions || interview.statements || [];
    const examResult = {
      examId: i,
      title: interview.title || `Interview ${i}`,
      totalQuestions: questions.length,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const explanation = q.explanation;
      if (explanation && ((typeof explanation === 'string' && explanation.trim().length > 0) ||
          (typeof explanation === 'object' && Object.keys(explanation).length > 0))) {
        examResult.withExplanation++;
      } else {
        examResult.withoutExplanation++;
        examResult.details.push(`  Question ${qi + 1}: NO explanation`);
      }
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeWriting(data) {
  const results = { section: 'Writing (Schriftlicher Ausdruck)', exams: [] };
  const exams = data?.exams || [];

  for (const exam of exams) {
    const examResult = {
      examId: exam.id,
      title: exam.title || `Exam ${exam.id}`,
      totalQuestions: 1,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
      note: 'For writing, "explanation" = modalAnswer (sample answer)',
    };

    // Writing tasks use modalAnswer as the explanation/reference
    const hasModalAnswer = exam.modalAnswer && 
      typeof exam.modalAnswer === 'string' && 
      exam.modalAnswer.trim().length > 0;

    if (hasModalAnswer) {
      examResult.withExplanation = 1;
    } else {
      examResult.withoutExplanation = 1;
      examResult.details.push(`  NO modalAnswer (sample answer)`);
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeGrammarStudy(data) {
  const results = { section: 'Grammar Study Questions', exams: [] };
  // Grammar study can be wrapped in {data: [...]} or be a direct array
  const groups = data?.data || (Array.isArray(data) ? data : []);

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const sentences = group.sentences || [];
    const examResult = {
      examId: gi,
      title: group.name || `Group ${gi}`,
      totalQuestions: 0,
      withExplanation: 0,
      withoutExplanation: 0,
      details: [],
    };

    for (let si = 0; si < sentences.length; si++) {
      const sentence = sentences[si];
      const options = sentence.question?.options || [];
      
      for (let oi = 0; oi < options.length; oi++) {
        examResult.totalQuestions++;
        const status = getExplanationStatus(options[oi].explanation);
        if (status.status === 'complete' || status.status === 'partial' || status.status === 'simple-string') {
          examResult.withExplanation++;
        } else {
          examResult.withoutExplanation++;
        }
      }
    }

    if (examResult.withoutExplanation > 0 && examResult.withoutExplanation <= 10) {
      examResult.details.push(`  ${examResult.withoutExplanation} options missing explanations`);
    } else if (examResult.withoutExplanation > 10) {
      examResult.details.push(`  ${examResult.withoutExplanation}/${examResult.totalQuestions} options missing explanations`);
    }

    results.exams.push(examResult);
  }

  return results;
}

function analyzeSpeaking(data, partName) {
  const results = { section: partName, exams: [] };
  
  // Speaking parts have various structures
  const items = data?.topics || data?.scenarios || data?.content ? [data.content] : [];
  
  const examResult = {
    examId: 0,
    title: partName,
    totalQuestions: Array.isArray(items) ? items.length : 0,
    withExplanation: 0,
    withoutExplanation: Array.isArray(items) ? items.length : 0,
    details: ['  Speaking sections typically do not have explanations'],
    note: 'Speaking sections are presentation/discussion format without right/wrong answers',
  };

  results.exams.push(examResult);
  return results;
}

// ============ Main Report ============

async function generateReport() {
  initializeFirebase();
  const db = admin.firestore();

  console.log('='.repeat(70));
  console.log('  GERMAN B2 TELC EXAM - EXPLANATION COVERAGE REPORT');
  console.log('  Collection: ' + COLLECTION_NAME);
  console.log('  Generated: ' + new Date().toISOString());
  console.log('='.repeat(70));
  console.log('');

  // Document IDs to check
  const sections = [
    'grammar-part1',
    'grammar-part2',
    'reading-part1',
    'reading-part2',
    'reading-part3',
    'listening-part1',
    'listening-part2',
    'listening-part3',
    'listening-practice',
    'writing',
    'grammer-study-questions',
    'speaking-part1',
    'speaking-part2',
    'speaking-part3',
  ];

  const allResults = [];
  let grandTotalQuestions = 0;
  let grandTotalWithExplanation = 0;

  for (const sectionId of sections) {
    try {
      const docRef = db.collection(COLLECTION_NAME).doc(sectionId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log(`⚠  Document "${sectionId}" does not exist in Firestore\n`);
        continue;
      }

      const rawData = docSnap.data();
      // Handle wrapped data (some docs have { data: ... } wrapper)
      const data = rawData?.data || rawData;

      let result;
      switch (sectionId) {
        case 'grammar-part1':
          result = analyzeGrammarPart1(data);
          break;
        case 'grammar-part2':
          result = analyzeGrammarPart2(data);
          break;
        case 'reading-part1':
          result = analyzeReadingPart1(data);
          break;
        case 'reading-part2':
          result = analyzeReadingPart2(data);
          break;
        case 'reading-part3':
          result = analyzeReadingPart3(data);
          break;
        case 'listening-part1':
          result = analyzeListeningPart(data, 'Listening Part 1 (Globalverstehen)');
          break;
        case 'listening-part2':
          result = analyzeListeningPart(data, 'Listening Part 2 (Detailverstehen)');
          break;
        case 'listening-part3':
          result = analyzeListeningPart(data, 'Listening Part 3 (Selektives Verstehen)');
          break;
        case 'listening-practice':
          result = analyzeListeningPractice(data);
          break;
        case 'writing':
          result = analyzeWriting(data);
          break;
        case 'grammer-study-questions':
          result = analyzeGrammarStudy(data);
          break;
        case 'speaking-part1':
          result = analyzeSpeaking(data, 'Speaking Part 1');
          break;
        case 'speaking-part2':
          result = analyzeSpeaking(data, 'Speaking Part 2');
          break;
        case 'speaking-part3':
          result = analyzeSpeaking(data, 'Speaking Part 3');
          break;
        default:
          continue;
      }

      allResults.push(result);

      // Print section results
      console.log(`─── ${result.section} ───`);
      console.log(`    Document: ${sectionId}`);

      let sectionTotal = 0;
      let sectionWithExpl = 0;

      for (const exam of result.exams) {
        sectionTotal += exam.totalQuestions;
        sectionWithExpl += exam.withExplanation;

        const coverage = exam.totalQuestions > 0
          ? ((exam.withExplanation / exam.totalQuestions) * 100).toFixed(1)
          : '0.0';
        const bar = generateBar(exam.withExplanation, exam.totalQuestions);

        console.log(`    ${exam.title}`);
        console.log(`      ${bar} ${coverage}% (${exam.withExplanation}/${exam.totalQuestions})`);
        
        if (exam.note) {
          console.log(`      Note: ${exam.note}`);
        }
      }

      const sectionCoverage = sectionTotal > 0
        ? ((sectionWithExpl / sectionTotal) * 100).toFixed(1)
        : '0.0';
      console.log(`    ► Section Total: ${sectionCoverage}% coverage (${sectionWithExpl}/${sectionTotal})`);
      console.log('');

      grandTotalQuestions += sectionTotal;
      grandTotalWithExplanation += sectionWithExpl;

    } catch (error) {
      console.error(`✗ Error reading "${sectionId}":`, error.message);
    }
  }

  // Print summary
  console.log('='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  const grandCoverage = grandTotalQuestions > 0
    ? ((grandTotalWithExplanation / grandTotalQuestions) * 100).toFixed(1)
    : '0.0';

  console.log(`  Overall Coverage: ${grandCoverage}% (${grandTotalWithExplanation}/${grandTotalQuestions} items have explanations)`);
  console.log('');
  console.log('  Per Section:');

  for (const result of allResults) {
    let total = 0;
    let withExpl = 0;
    for (const exam of result.exams) {
      total += exam.totalQuestions;
      withExpl += exam.withExplanation;
    }
    const pct = total > 0 ? ((withExpl / total) * 100).toFixed(1) : '0.0';
    const statusIcon = pct === '100.0' ? '✓' : pct === '0.0' ? '✗' : '◐';
    console.log(`    ${statusIcon} ${result.section}: ${pct}% (${withExpl}/${total})`);
  }

  console.log('');
  console.log('  Legend:');
  console.log('    ✓ = Full coverage (100%)');
  console.log('    ◐ = Partial coverage');
  console.log('    ✗ = No coverage (0%)');
  console.log('');
}

function generateBar(filled, total) {
  const width = 20;
  if (total === 0) return '[' + '░'.repeat(width) + ']';
  const filledCount = Math.round((filled / total) * width);
  return '[' + '█'.repeat(filledCount) + '░'.repeat(width - filledCount) + ']';
}

// Run
generateReport()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
