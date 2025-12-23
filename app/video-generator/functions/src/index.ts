import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { selectNextQuestion } from './services/questionSelector';
import { captureVideoScreenshots } from './services/screenshotCapture';
import { assembleVideo, getVideoDuration, cleanupTempFiles } from './services/videoAssembly';
import { uploadToYouTube, generateVideoMetadata } from './services/youtubeUpload';
import { markQuestionProcessed, markQuestionFailed } from './services/trackingService';
import { getAppConfig } from './config/apps';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Scheduled function to generate YouTube Shorts video
 * Runs daily at 10 AM UTC
 */
export const generateYouTubeShort = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB',
  })
  .pubsub.schedule('0 10 * * *') // Daily at 10 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const appId = 'german-a1'; // Can be configured or randomized
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
        const metadata = generateVideoMetadata(
          appId,
          appConfig.displayName,
          questionData.questionIndex,
          questionData.question.situation
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
export const generateVideoManual = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onRequest(async (req, res) => {
    const appId = req.query.appId as string || 'german-a1';
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
        const metadata = generateVideoMetadata(
          appId,
          appConfig.displayName,
          questionData.questionId,
          questionData.question.situation
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
export const getProcessingStats = functions.https.onRequest(async (req, res) => {
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

