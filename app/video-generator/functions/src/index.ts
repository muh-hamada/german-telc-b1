// Load environment variables from .env file (for local development)
import * as dotenv from 'dotenv';
dotenv.config();

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { selectNextQuestion } from './services/questionSelector';
import { captureVideoScreenshots } from './services/screenshotCapture';
import { assembleVideo, getVideoDuration, cleanupTempFiles } from './services/videoAssembly';
import { uploadToYouTube, generateVideoMetadata } from './services/youtubeUpload';
import { markQuestionProcessed, markQuestionFailed, getVocabularyStats } from './services/trackingService';
import { getAppConfig } from './config/apps';
import { generateWordOfTheDayVideo } from './generators/wordOfTheDayGenerator';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Scheduled function to generate YouTube Shorts video
 * Runs daily at 10 AM UTC
 */
export const generateYouTubeShort = onSchedule({
  schedule: '0 10 * * *',
  timeoutSeconds: 1200, // 20 minutes
  memory: '4GiB',
  timeZone: 'UTC',
}, async (event) => {
  const appId = process.env.APP_ID || 'german-a1';
  console.log(`Starting video generation for ${appId}`);

  const startTime = Date.now();

  try {
    // Select next unprocessed question
    const questionData = await selectNextQuestion(appId);

    if (!questionData) {
      console.log('No unprocessed questions available');
      return;
    }

    console.log(`Processing question: exam ${questionData.examId}, question index ${questionData.questionIndex}`);

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), `video-gen-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Step 1: Capture screenshots
      const screenshots = await captureVideoScreenshots(questionData, tempDir);

      // Step 2: Assemble video
      const videoPath = await assembleVideo(screenshots, tempDir);

      // Step 3: Get video duration
      const duration = await getVideoDuration(videoPath);

      // Step 4: Generate metadata
      const appConfig = getAppConfig(appId);
      
      // Get question text for metadata
      let questionText = '';
      if ('situation' in questionData.question) {
        questionText = questionData.question.situation;
      } else if ('question' in questionData.question) {
        questionText = questionData.question.question;
      }

      const metadata = generateVideoMetadata(
        appId,
        appConfig.displayName,
        questionData.questionIndex,
        questionText
      );

      // Step 5: Upload to YouTube
      const { videoId, videoUrl } = await uploadToYouTube(videoPath, metadata);

      // Step 6: Mark as processed
      const processingTime = Date.now() - startTime;
      await markQuestionProcessed(
        appId,
        questionData.examId,
        questionData.questionIndex,
        {
          video_id: videoId,
          video_url: videoUrl,
          duration_seconds: Math.round(duration),
          processing_time_ms: processingTime,
        }
      );

      console.log(`Video generation completed successfully: ${videoUrl}`);
      console.log(`Processing time: ${(processingTime / 1000).toFixed(2)}s`);
    } finally {
      // Clean up temporary files
      cleanupTempFiles(tempDir);
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error generating video:', error);

    // Try to mark as failed if we have question data
    try {
      const questionData = await selectNextQuestion(appId);
      if (questionData) {
        await markQuestionFailed(
          appId,
          questionData.examId,
          questionData.questionIndex,
          error instanceof Error ? error.message : 'Unknown error',
          processingTime
        );
      }
    } catch (trackingError) {
      console.error('Error marking question as failed:', trackingError);
    }

    throw error;
  }
});

/**
 * HTTP function to manually trigger video generation
 * Useful for testing and manual runs
 */
export const generateVideoManual = onRequest({
  timeoutSeconds: 1200, // 20 minutes
  memory: '4GiB',
}, async (req, res) => {
  const appId = (req.query.appId as string) || process.env.APP_ID || 'german-a1';
  const examId = req.query.examId ? parseInt(req.query.examId as string) : undefined;
  const questionIndex = req.query.questionIndex ? parseInt(req.query.questionIndex as string) : undefined;

  console.log(`Manual video generation triggered for ${appId}`);

  const startTime = Date.now();

  try {
    // Select question
    let questionData;
    if (examId !== undefined && questionIndex !== undefined) {
      // Specific question requested
      const { getQuestion } = require('./services/questionSelector');
      questionData = await getQuestion(appId, examId, questionIndex);
    } else {
      // Next unprocessed question
      questionData = await selectNextQuestion(appId);
    }

    if (!questionData) {
      res.status(404).json({ error: 'No question found' });
      return;
    }

    console.log(`Processing question: exam ${questionData.examId}, question index ${questionData.questionIndex}`);

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), `video-gen-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Generate video
      const screenshots = await captureVideoScreenshots(questionData, tempDir);
      const videoPath = await assembleVideo(screenshots, tempDir);
      const duration = await getVideoDuration(videoPath);

      // Generate metadata
      const appConfig = getAppConfig(appId);
      
      // Get question text for metadata
      let questionText = '';
      if ('situation' in questionData.question) {
        questionText = questionData.question.situation;
      } else if ('question' in questionData.question) {
        questionText = questionData.question.question;
      }

      const metadata = generateVideoMetadata(
        appId,
        appConfig.displayName,
        questionData.questionIndex,
        questionText
      );

      // Upload to YouTube
      const { videoId, videoUrl } = await uploadToYouTube(videoPath, metadata);

      // Mark as processed
      const processingTime = Date.now() - startTime;
      await markQuestionProcessed(
        appId,
        questionData.examId,
        questionData.questionIndex,
        {
          video_id: videoId,
          video_url: videoUrl,
          duration_seconds: Math.round(duration),
          processing_time_ms: processingTime,
        }
      );

      res.json({
        success: true,
        videoUrl,
        videoId,
        processingTimeSeconds: (processingTime / 1000).toFixed(2),
        question: {
          appId,
          examId: questionData.examId,
          questionIndex: questionData.questionIndex,
        },
      });
    } finally {
      cleanupTempFiles(tempDir);
    }
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({
      error: 'Video generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * HTTP function to check processing stats
 */
export const getProcessingStats = onRequest(async (req, res) => {
  const appId = req.query.appId as string || 'german-a1';

  try {
    const { getProcessingStats } = require('./services/trackingService');
    const stats = await getProcessingStats(appId);

    res.json({
      appId,
      stats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Scheduled function to generate Word of the Day YouTube Shorts video
 * Runs twice daily at 9 AM and 9 PM UTC
 */
export const generateWordOfTheDayShort = onSchedule({
  schedule: '0 9,21 * * *', // 9 AM and 9 PM UTC
  timeoutSeconds: 1200, // 20 minutes
  memory: '4GiB',
  timeZone: 'UTC',
}, async (event) => {
  const appId = process.env.APP_ID || 'german-a1';
  console.log(`Starting Word of the Day video generation for ${appId}`);

  try {
    const result = await generateWordOfTheDayVideo(appId);

    if (result.success) {
      console.log(`Word of the Day video generated successfully: ${result.videoUrl}`);
      console.log(`Word: ${result.word}`);
    } else {
      console.error(`Word of the Day video generation failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error in scheduled Word of the Day generation:', error);
    throw error;
  }
});

/**
 * HTTP function to manually trigger Word of the Day video generation
 * Useful for testing and manual runs
 */
export const generateWordOfTheDayManual = onRequest({
  timeoutSeconds: 1200, // 20 minutes
  memory: '4GiB',
}, async (req, res) => {
  const appId = (req.query.appId as string) || process.env.APP_ID || 'german-a1';

  console.log(`Manual Word of the Day video generation triggered for ${appId}`);

  try {
    const result = await generateWordOfTheDayVideo(appId);

    if (result.success) {
      res.json({
        success: true,
        videoUrl: result.videoUrl,
        videoId: result.videoId,
        word: result.word,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error generating Word of the Day video:', error);
    res.status(500).json({
      success: false,
      error: 'Video generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * HTTP function to check vocabulary video stats
 */
export const getVocabularyVideoStats = onRequest(async (req, res) => {
  const appId = req.query.appId as string || 'german-a1';

  try {
    const stats = await getVocabularyStats(appId);

    res.json({
      appId,
      stats,
    });
  } catch (error) {
    console.error('Error getting vocabulary stats:', error);
    res.status(500).json({
      error: 'Failed to get vocabulary stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

