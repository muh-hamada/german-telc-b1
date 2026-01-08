import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { ScreenshotSet } from '../types';

const FPS = 20;

/**
 * Assemble video from screenshots using FFmpeg
 */
export async function assembleVideo(
  screenshots: ScreenshotSet,
  outputDir: string
): Promise<string> {
  console.log('Starting video assembly...');

  const segmentPaths = {
    intro: path.join(outputDir, 'intro_segment.mp4'),
    question: path.join(outputDir, 'question_segment.mp4'),
    answer: path.join(outputDir, 'answer_segment.mp4'),
    outro: path.join(outputDir, 'outro_segment.mp4'),
  };

  // Create video segments from screenshots
  await createSegment(screenshots.intro, segmentPaths.intro);
  await createSegment(screenshots.question, segmentPaths.question);
  await createSegment(screenshots.answer, segmentPaths.answer);
  await createSegment(screenshots.outro, segmentPaths.outro);

  // Concatenate all segments
  const finalVideoPath = path.join(outputDir, 'final_video.mp4');
  await concatenateSegments(
    [segmentPaths.intro, segmentPaths.question, segmentPaths.answer, segmentPaths.outro],
    finalVideoPath
  );

  console.log(`Video assembled: ${finalVideoPath}`);
  return finalVideoPath;
}

/**
 * Assemble video with audio tracks
 */
export async function assembleVideoWithAudio(
  screenshots: ScreenshotSet,
  audioPaths: { intro?: string; question?: string; answer?: string; outro?: string },
  outputDir: string
): Promise<string> {
  console.log('Starting video assembly with audio...');

  const segmentPaths = {
    intro: path.join(outputDir, 'intro_segment.mp4'),
    question: path.join(outputDir, 'question_segment.mp4'),
    answer: path.join(outputDir, 'answer_segment.mp4'),
    outro: path.join(outputDir, 'outro_segment.mp4'),
  };

  // Create video segments with audio
  await createSegmentWithAudio(screenshots.intro, audioPaths.intro || null, segmentPaths.intro);
  await createSegmentWithAudio(screenshots.question, audioPaths.question || null, segmentPaths.question);
  await createSegmentWithAudio(screenshots.answer, audioPaths.answer || null, segmentPaths.answer);
  await createSegmentWithAudio(screenshots.outro, audioPaths.outro || null, segmentPaths.outro);

  // Concatenate all segments (audio is preserved)
  const finalVideoPath = path.join(outputDir, 'final_video.mp4');
  await concatenateSegments(
    [segmentPaths.intro, segmentPaths.question, segmentPaths.answer, segmentPaths.outro],
    finalVideoPath
  );

  console.log(`Video with audio assembled: ${finalVideoPath}`);
  return finalVideoPath;
}

/**
 * Create a video segment from an array of screenshot paths (no audio)
 */
function createSegment(screenshotPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (screenshotPaths.length === 0) {
      reject(new Error('No screenshots provided for segment'));
      return;
    }

    // Get the directory containing the screenshots
    const inputDir = path.dirname(screenshotPaths[0]);
    const pattern = path.join(inputDir, 'frame_%04d.png');

    console.log(`Creating segment from ${screenshotPaths.length} frames: ${outputPath}`);

    ffmpeg()
      .input(pattern)
      .inputOptions([`-framerate ${FPS}`])
      .videoCodec('libx264')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        `-r ${FPS}`,
        '-an', // No audio for this segment type
      ])
      .output(outputPath)
      .on('start', (cmd: string) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`Segment created: ${outputPath}`);
        resolve();
      })
      .on('error', (err: Error) => {
        console.error(`Error creating segment: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

/**
 * Create a video segment with audio
 * If no audio is provided, creates silent audio track for compatibility
 */
function createSegmentWithAudio(
  screenshotPaths: string[], 
  audioPath: string | null,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (screenshotPaths.length === 0) {
      reject(new Error('No screenshots provided for segment'));
      return;
    }

    const inputDir = path.dirname(screenshotPaths[0]);
    const pattern = path.join(inputDir, 'frame_%04d.png');
    const videoDuration = screenshotPaths.length / FPS;

    console.log(`Creating segment from ${screenshotPaths.length} frames (${videoDuration}s) with audio: ${outputPath}`);

    let actualAudioPath = audioPath;
    let tempSilentAudio: string | null = null;

    // If no audio provided, create a silent audio file
    if (!audioPath || !fs.existsSync(audioPath)) {
      console.log(`No audio provided, creating ${videoDuration}s silent audio track`);
      tempSilentAudio = path.join(path.dirname(outputPath), `silent_${Date.now()}.wav`);
      await createSilentWav(tempSilentAudio, videoDuration);
      actualAudioPath = tempSilentAudio;
    }

    ffmpeg()
      .input(pattern)
      .inputOptions([`-framerate ${FPS}`])
      .input(actualAudioPath!)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        `-r ${FPS}`,
        '-map 0:v',  // Map video from input 0 (image sequence)
        '-map 1:a',  // Map audio from input 1 (audio file)
        '-shortest', // Match output to shortest stream
      ])
      .output(outputPath)
      .on('start', (cmd: string) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`Segment with audio created: ${outputPath}`);
        // Clean up temp silent audio if created
        if (tempSilentAudio && fs.existsSync(tempSilentAudio)) {
          fs.unlinkSync(tempSilentAudio);
        }
        resolve();
      })
      .on('error', (err: Error) => {
        console.error(`Error creating segment: ${err.message}`);
        // Clean up temp silent audio if created
        if (tempSilentAudio && fs.existsSync(tempSilentAudio)) {
          fs.unlinkSync(tempSilentAudio);
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Create a silent WAV file programmatically (no FFmpeg filters needed)
 */
function createSilentWav(outputPath: string, durationSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const sampleRate = 48000;
      const numChannels = 2;
      const bitsPerSample = 16;
      const numSamples = Math.ceil(sampleRate * durationSeconds);
      const dataSize = numSamples * numChannels * (bitsPerSample / 8);
      const fileSize = 44 + dataSize; // 44 byte header + data

      const buffer = Buffer.alloc(fileSize);

      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(fileSize - 8, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // fmt chunk size
      buffer.writeUInt16LE(1, 20); // audio format (PCM)
      buffer.writeUInt16LE(numChannels, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
      buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // block align
      buffer.writeUInt16LE(bitsPerSample, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);
      // Audio data is all zeros (silence) - already initialized by Buffer.alloc

      fs.writeFileSync(outputPath, buffer);
      console.log(`Created silent WAV: ${outputPath} (${durationSeconds}s)`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Concatenate multiple video segments into one final video
 * Uses simple concat demuxer - all segments must have compatible streams
 */
function concatenateSegments(segmentPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempDir = path.dirname(outputPath);
    const fileListPath = path.join(tempDir, 'filelist.txt');
    
    // Create file list for FFmpeg concat demuxer
    const fileListContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(fileListPath, fileListContent);

    console.log(`Concatenating ${segmentPaths.length} segments...`);
    console.log(`File list:\n${fileListContent}`);

    ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', (cmd: string) => {
        console.log('FFmpeg concat command:', cmd);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`Concatenating: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`Final video created: ${outputPath}`);
        // Clean up file list
        fs.unlinkSync(fileListPath);
        resolve();
      })
      .on('error', (err: Error) => {
        console.error(`Error concatenating segments: ${err.message}`);
        // Clean up file list
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Get video duration in seconds
 */
export function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Clean up temporary files and directories
 */
export function cleanupTempFiles(outputDir: string): void {
  try {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary directory: ${outputDir}`);
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

