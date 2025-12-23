import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { QuestionData, ScreenshotSet } from '../types';

const VIEWPORT_WIDTH = 1080;
const VIEWPORT_HEIGHT = 1920;
const FPS = 30;

// Frontend app URL - adjust based on deployment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
 * Capture intro screen (2 seconds at 30 FPS = 60 frames)
 */
async function captureIntro(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing intro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/intro?appId=${questionData.appId}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 500)); // Extra buffer

  const duration = 2; // seconds
  const frameCount = duration * FPS;
  const screenshots: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} intro frames`);
  return screenshots;
}

/**
 * Capture question screen with countdown timer (10 seconds)
 */
async function captureQuestion(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing question screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/question?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}&timer=10`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 500));

  const duration = 10; // seconds
  const frameCount = duration * FPS;
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
  console.log(`Captured ${screenshots.length} question frames`);
  return screenshots;
}

/**
 * Capture answer reveal screen (4 seconds)
 */
async function captureAnswer(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing answer screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/answer?appId=${questionData.appId}&examId=${questionData.examId}&questionIndex=${questionData.questionIndex}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 500));

  const duration = 4; // seconds
  const frameCount = duration * FPS;
  const screenshots: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} answer frames`);
  return screenshots;
}

/**
 * Capture outro screen (3 seconds)
 */
async function captureOutro(
  browser: Browser,
  questionData: QuestionData,
  outputDir: string
): Promise<string[]> {
  console.log('Capturing outro screen...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `${FRONTEND_URL}/outro?appId=${questionData.appId}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for screen to be ready
  await page.waitForFunction(() => (window as any).screenReady === true, { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 500));

  const duration = 3; // seconds
  const frameCount = duration * FPS;
  const screenshots: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: filename });
    screenshots.push(filename);
  }

  await page.close();
  console.log(`Captured ${screenshots.length} outro frames`);
  return screenshots;
}

