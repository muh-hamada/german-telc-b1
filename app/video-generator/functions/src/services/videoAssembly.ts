import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { ScreenshotSet } from '../types';

const FPS = 30;

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
 * Create a video segment from an array of screenshot paths
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
      .inputFPS(FPS)
      .videoCodec('libx264')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
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
 * Concatenate multiple video segments into one final video
 */
function concatenateSegments(segmentPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a temporary file list for FFmpeg concat
    const fileListPath = path.join(path.dirname(outputPath), 'filelist.txt');
    const fileListContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    
    fs.writeFileSync(fileListPath, fileListContent);

    console.log(`Concatenating ${segmentPaths.length} segments...`);

    ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .videoCodec('libx264')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart', // Enable fast start for web playback
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

