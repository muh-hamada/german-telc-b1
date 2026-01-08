import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as path from 'path';
import * as fs from 'fs';
import { QuestionData, ScreenshotSet, VocabularyData } from '../types';

const VIEWPORT_WIDTH = 1080;
const VIEWPORT_HEIGHT = 1920;
const FPS = 20;

// Configuration from environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const EXAM_DOCUMENT = process.env.EXAM_DOCUMENT || 'reading-part2';

// Duration constants (in seconds) - configurable via environment variables
const INTRO_DURATION = parseInt(process.env.VIDEO_INTRO_DURATION || '2', 10);
const QUESTION_DURATION = parseInt(process.env.VIDEO_QUESTION_DURATION || '10', 10);
const ANSWER_DURATION = parseInt(process.env.VIDEO_ANSWER_DURATION || '4', 10);
const OUTRO_DURATION = parseInt(process.env.VIDEO_OUTRO_DURATION || '3', 10);

/**
 * Capture screenshots for all video segments
 */
export async function captureVideoScreenshots(
  questionData: QuestionData,
  outputDir: string
): Promise<ScreenshotSet> {
  console.log('Starting screenshot capture...');
  
  const browser = await launchBrowser();
  
  try {
    // Create directories
    const introDir = path.join(outputDir, 'intro');
    const questionDir = path.join(outputDir, 'question');
    const answerDir = path.join(outputDir, 'answer');
    const outroDir = path.join(outputDir, 'outro');

    [introDir, questionDir, answerDir, outroDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Capture each segment
    const introScreenshots = await captureIntro(browser, questionData, introDir);
    const questionScreenshots = await captureQuestion(browser, questionData, questionDir);
    const answerScreenshots = await captureAnswer(browser, questionData, answerDir);
    const outroScreenshots = await captureOutro(browser, questionData, outroDir);

    console.log('Screenshot capture completed');

    return {
      intro: introScreenshots,
      question: questionScreenshots,
      answer: answerScreenshots,
      outro: outroScreenshots,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Launch Puppeteer browser with appropriate settings
 */
async function launchBrowser(): Promise<Browser> {
  const isLocal = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
  
  return await puppeteer.launch({
    args: isLocal ? puppeteer.defaultArgs() : chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: isLocal 
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Common path for macOS
      : await chromium.executablePath(),
    headless: (isLocal ? true : chromium.headless) as any,
  });
}

/**
 * Capture intro screen
 */
async function captureIntro(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing intro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/intro?appId=${questionData.appId}&doc=${EXAM_DOCUMENT}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });
  
  const frameCount = INTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    // Set the frame time manually and wait for it to be applied
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} intro frames (${INTRO_DURATION}s)`);
  return screenshots;
}

/**
 * Capture question screen with countdown timer
 */
async function captureQuestion(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing question screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/question?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}&timer=${QUESTION_DURATION}&doc=${EXAM_DOCUMENT}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });
  
  const frameCount = QUESTION_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS; // milliseconds per frame

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    // Set the frame time manually and wait for it to be applied
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} question frames (${QUESTION_DURATION}s)`);
  return screenshots;
}

/**
 * Capture answer reveal screen
 */
async function captureAnswer(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing answer screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/answer?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}&doc=${EXAM_DOCUMENT}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });

  const frameCount = ANSWER_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    // Set the frame time manually and wait for it to be applied
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} answer frames (${ANSWER_DURATION}s)`);
  return screenshots;
}

/**
 * Capture outro screen
 */
async function captureOutro(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing outro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/outro?appId=${questionData.appId}&doc=${EXAM_DOCUMENT}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });

  const frameCount = OUTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    // Set the frame time manually and wait for it to be applied
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} outro frames (${OUTRO_DURATION}s)`);
  return screenshots;
}

/**
 * Capture screenshots for vocabulary video (word and example screens)
 */
export async function captureVocabularyScreenshots(
  vocabularyData: VocabularyData,
  audioDurations: { word: number; example: number },
  outputDir: string
): Promise<ScreenshotSet> {
  console.log('Starting vocabulary screenshot capture...');
  
  const browser = await launchBrowser();
  
  try {
    // Create directories
    const introDir = path.join(outputDir, 'intro');
    const wordDir = path.join(outputDir, 'question'); // Use 'question' for word screen
    const exampleDir = path.join(outputDir, 'answer'); // Use 'answer' for example screen
    const outroDir = path.join(outputDir, 'outro');

    [introDir, wordDir, exampleDir, outroDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Capture each segment
    const introScreenshots = await captureIntroVocabulary(browser, vocabularyData, introDir);
    const wordScreenshots = await captureVocabularyWord(browser, vocabularyData, audioDurations.word, wordDir);
    const exampleScreenshots = await captureVocabularyExample(browser, vocabularyData, audioDurations.example, exampleDir);
    const outroScreenshots = await captureOutroVocabulary(browser, vocabularyData, outroDir);

    console.log('Vocabulary screenshot capture completed');

    return {
      intro: introScreenshots,
      question: wordScreenshots, // Map to question for compatibility
      answer: exampleScreenshots, // Map to answer for compatibility
      outro: outroScreenshots,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Capture intro screen for vocabulary video
 */
async function captureIntroVocabulary(
  browser: Browser,
  vocabularyData: VocabularyData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing vocabulary intro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/intro?appId=${vocabularyData.appId}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });
  
  const frameCount = INTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} intro frames (${INTRO_DURATION}s)`);
  return screenshots;
}

/**
 * Capture vocabulary word screen
 */
async function captureVocabularyWord(
  browser: Browser,
  vocabularyData: VocabularyData,
  audioDuration: number,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing vocabulary word screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/vocabulary-word?appId=${vocabularyData.appId}&wordId=${vocabularyData.wordId}&capture=true`;
  console.log('URL:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 60000 });
  
  // Audio already has padding and repetition built in, just use the duration directly
  const duration = Math.ceil(audioDuration);
  const frameCount = duration * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} word frames (${duration}s)`);
  return screenshots;
}

/**
 * Capture vocabulary example screen
 */
async function captureVocabularyExample(
  browser: Browser,
  vocabularyData: VocabularyData,
  audioDuration: number,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing vocabulary example screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/vocabulary-example?appId=${vocabularyData.appId}&wordId=${vocabularyData.wordId}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 60000 });
  
  // Audio already has padding and repetition built in, just use the duration directly
  const duration = Math.ceil(audioDuration);
  const frameCount = duration * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} example frames (${duration}s)`);
  return screenshots;
}

/**
 * Capture outro screen for vocabulary video
 */
async function captureOutroVocabulary(
  browser: Browser,
  vocabularyData: VocabularyData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing vocabulary outro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/outro?appId=${vocabularyData.appId}&capture=true`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });

  const frameCount = OUTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  for (let i = 0; i < frameCount; i++) {
    const timeOffset = i * frameInterval;
    
    await page.evaluate(async (t) => {
      if ((window as any).seekTo) {
        await (window as any).seekTo(t);
      }
    }, timeOffset);

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} outro frames (${OUTRO_DURATION}s)`);
  return screenshots;
}

