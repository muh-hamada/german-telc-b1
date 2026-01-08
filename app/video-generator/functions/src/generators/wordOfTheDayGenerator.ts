import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { selectNextVocabularyWord, ensureVocabularyAudioExists } from '../services/vocabularySelector';
import { captureVocabularyScreenshots } from '../services/screenshotCapture';
import { assembleVideoWithAudio } from '../services/videoAssembly';
import { uploadToYouTube, generateVocabularyVideoMetadata } from '../services/youtubeUpload';
import { markVocabularyProcessed, markVocabularyFailed } from '../services/trackingService';
import { downloadAudioFromStorage, createExtendedAudio } from '../services/audioService';
import { getVideoDuration, cleanupTempFiles } from '../services/videoAssembly';
import { getAppConfig } from '../config/apps';

/**
 * Generate Word of the Day video
 * Main orchestration function that:
 * 1. Selects next unprocessed vocabulary word
 * 2. Ensures audio exists (generates if needed)
 * 3. Downloads audio files temporarily
 * 4. Captures video screenshots
 * 5. Assembles video with audio
 * 6. Uploads to YouTube
 * 7. Marks word as processed
 */
export async function generateWordOfTheDayVideo(appId: string): Promise<{
  success: boolean;
  videoUrl?: string;
  videoId?: string;
  word?: string;
  error?: string;
}> {
  const startTime = Date.now();
  console.log(`Starting Word of the Day video generation for ${appId}`);

  let tempDir: string | null = null;
  let vocabularyData;

  try {
    // Step 1: Select next unprocessed vocabulary word
    vocabularyData = await selectNextVocabularyWord(appId);
    
    if (!vocabularyData) {
      console.log('No unprocessed vocabulary words available');
      return {
        success: false,
        error: 'No unprocessed vocabulary words available',
      };
    }

    const { wordId, word } = vocabularyData;
    console.log(`Selected word: ${word.word} (ID: ${wordId})`);

    // Step 2: Ensure audio exists (generate if needed)
    const audioUrls = await ensureVocabularyAudioExists(vocabularyData);
    console.log('Audio URLs:', audioUrls);

    // Step 3: Create temporary directory
    tempDir = path.join(os.tmpdir(), `vocab-video-gen-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Step 4: Download audio files temporarily
    const wordAudioPath = path.join(tempDir, 'word_audio.mp3');
    const exampleAudioPath = path.join(tempDir, 'example_audio.mp3');

    await downloadAudioFromStorage(audioUrls.word, wordAudioPath);
    await downloadAudioFromStorage(audioUrls.exampleSentence, exampleAudioPath);

    // Step 5: Create extended audio files (2s + audio + 2s + audio + 2s)
    const extendedWordAudioPath = path.join(tempDir, 'word_audio_extended.mp3');
    const extendedExampleAudioPath = path.join(tempDir, 'example_audio_extended.mp3');
    
    const wordAudioResult = await createExtendedAudio(wordAudioPath, extendedWordAudioPath);
    const exampleAudioResult = await createExtendedAudio(exampleAudioPath, extendedExampleAudioPath);
    
    console.log(`Extended audio durations: word=${wordAudioResult.duration}s, example=${exampleAudioResult.duration}s`);

    // Step 6: Capture video screenshots
    const screenshots = await captureVocabularyScreenshots(
      vocabularyData,
      {
        word: wordAudioResult.duration,
        example: exampleAudioResult.duration,
      },
      tempDir
    );

    // Step 7: Assemble video with extended audio
    const videoPath = await assembleVideoWithAudio(
      screenshots,
      {
        intro: undefined,
        question: extendedWordAudioPath,
        answer: extendedExampleAudioPath,
        outro: undefined,
      },
      tempDir
    );

    // Step 8: Get video duration
    const videoDuration = await getVideoDuration(videoPath);
    console.log(`Final video duration: ${videoDuration}s`);

    // Step 9: Generate metadata for YouTube
    const appConfig = getAppConfig(appId);
    const translation = word.translations.en || '';
    const exampleSentence = word.exampleSentences[0].text;

    const metadata = generateVocabularyVideoMetadata(
      appId,
      appConfig.displayName,
      word.word,
      word.article,
      translation,
      exampleSentence
    );

    // Step 10: Upload to YouTube
    const { videoId, videoUrl } = await uploadToYouTube(videoPath, metadata);
    console.log(`Video uploaded: ${videoUrl}`);

    // Step 11: Mark as processed
    const processingTime = Date.now() - startTime;
    await markVocabularyProcessed(appId, wordId, word.word, {
      video_id: videoId,
      video_url: videoUrl,
      audio_urls: {
        word: audioUrls.word,
        example: audioUrls.exampleSentence,
      },
      duration_seconds: Math.round(videoDuration),
      processing_time_ms: processingTime,
    });

    console.log(`Word of the Day video generated successfully in ${(processingTime / 1000).toFixed(2)}s`);

    return {
      success: true,
      videoUrl,
      videoId,
      word: word.word,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error generating Word of the Day video:', error);

    // Try to mark as failed
    if (vocabularyData) {
      try {
        await markVocabularyFailed(
          appId,
          vocabularyData.wordId,
          vocabularyData.word.word,
          error instanceof Error ? error.message : 'Unknown error',
          processingTime
        );
      } catch (trackingError) {
        console.error('Error marking vocabulary as failed:', trackingError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Clean up temporary files
    if (tempDir) {
      cleanupTempFiles(tempDir);
    }
  }
}

