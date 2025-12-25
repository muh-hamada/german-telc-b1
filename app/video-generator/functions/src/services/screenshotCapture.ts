import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { QuestionData, ScreenshotSet } from '../types';

const VIEWPORT_WIDTH = 1080;
const VIEWPORT_HEIGHT = 1920;
const FPS = 30;

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
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
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

  const url = `${FRONTEND_URL}/intro?appId=${questionData.appId}&doc=${EXAM_DOCUMENT}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });
  
  // No extra buffer here, we want to capture the start of animations

  const frameCount = INTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  const startTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const targetTime = startTime + (i * frameInterval);
    const currentTime = Date.now();
    const delay = targetTime - currentTime;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

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

  const url = `${FRONTEND_URL}/question?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}&timer=${QUESTION_DURATION}&doc=${EXAM_DOCUMENT}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });
  
  // No extra buffer here, we want to capture the start of animations

  const frameCount = QUESTION_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS; // milliseconds per frame

  const startTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const targetTime = startTime + (i * frameInterval);
    const currentTime = Date.now();
    const delay = targetTime - currentTime;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

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

  const url = `${FRONTEND_URL}/answer?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}&doc=${EXAM_DOCUMENT}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });

  const frameCount = ANSWER_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  const startTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const targetTime = startTime + (i * frameInterval);
    const currentTime = Date.now();
    const delay = targetTime - currentTime;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

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

  const url = `${FRONTEND_URL}/outro?appId=${questionData.appId}&doc=${EXAM_DOCUMENT}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 30000 });

  const frameCount = OUTRO_DURATION * FPS;
  const screenshots: string[] = [];
  const frameInterval = 1000 / FPS;

  const startTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const targetTime = startTime + (i * frameInterval);
    const currentTime = Date.now();
    const delay = targetTime - currentTime;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} outro frames (${OUTRO_DURATION}s)`);
  return screenshots;
}

