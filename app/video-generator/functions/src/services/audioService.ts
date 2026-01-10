import * as textToSpeech from '@google-cloud/text-to-speech';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';

const ttsClient = new textToSpeech.TextToSpeechClient();

export interface AudioSegment {
  text: string;
  languageCode: string; // e.g., 'de-DE', 'en-US'
  voiceName?: string; // e.g., 'de-DE-Wavenet-F'
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number; // 0.25 to 4.0, default 1.0
  pitch?: number; // -20.0 to 20.0, default 0.0
}

export interface VocabularyAudioUrls {
  word: string;
  exampleSentence: string;
}

/**
 * Generate audio file from text using Google Cloud TTS
 */
export async function generateAudio(
  segment: AudioSegment,
  outputPath: string
): Promise<string> {
  console.log(`Generating audio for: "${segment.text}"`);
  
  const request = {
    input: { text: segment.text },
    voice: {
      languageCode: segment.languageCode,
      name: segment.voiceName,
      ssmlGender: segment.ssmlGender || ('NEUTRAL' as const),
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      speakingRate: segment.speakingRate || 1.0,
      pitch: segment.pitch || 0.0,
    },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  
  if (!response.audioContent) {
    throw new Error('No audio content received from TTS');
  }

  // Write audio to file
  fs.writeFileSync(outputPath, response.audioContent, 'binary');
  console.log(`Audio generated: ${outputPath}`);
  
  return outputPath;
}

/**
 * Generate both word and sentence audio for a vocabulary item
 */
export async function generateVocabularyAudio(
  word: string,
  article: string,
  exampleSentence: string,
  languageCode: string,
  outputDir: string
): Promise<{ wordPath: string; examplePath: string }> {
  const tempDir = outputDir || path.join(os.tmpdir(), `audio-gen-${Date.now()}`);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Generate word audio (with article if it's a noun)
  const wordText = article ? `${article} ${word}` : word;
  const wordPath = path.join(tempDir, 'word.mp3');

  console.log(`GENERATE AUDIO: >>>>>>>>>>>> Generating word audio for: "${wordText}"`);
  
  await generateAudio(
    {
      text: wordText,
      languageCode: languageCode,
      voiceName: languageCode === 'de-DE' ? 'de-DE-Wavenet-F' : 'en-US-Wavenet-D',
      speakingRate: 0.85, // Slightly slower for learning
    },
    wordPath
  );

  // Generate example sentence audio
  const examplePath = path.join(tempDir, 'example.mp3');
  
  await generateAudio(
    {
      text: exampleSentence,
      languageCode: languageCode,
      voiceName: languageCode === 'de-DE' ? 'de-DE-Wavenet-F' : 'en-US-Wavenet-D',
      speakingRate: 0.9,
    },
    examplePath
  );

  return { wordPath, examplePath };
}

/**
 * Upload audio file to Firebase Storage and get public URL
 */
export async function uploadAudioToStorage(
  localPath: string,
  storagePath: string
): Promise<string> {
  console.log(`Uploading audio to: ${storagePath}`);
  
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);
  
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: 'audio/mpeg',
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  // Make the file publicly accessible
  await file.makePublic();
  
  // Get the public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  
  console.log(`Audio uploaded successfully: ${publicUrl}`);
  return publicUrl;
}

/**
 * Download audio from Firebase Storage to temporary location
 */
export async function downloadAudioFromStorage(
  storageUrl: string,
  localPath: string
): Promise<string> {
  console.log(`Downloading audio from: ${storageUrl}`);
  
  // Extract the file path from the URL
  // Format: https://storage.googleapis.com/BUCKET_NAME/PATH/TO/FILE
  const url = new URL(storageUrl);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  const bucketName = pathParts[0];
  const filePath = pathParts.slice(1).join('/');
  
  console.log(`Bucket: ${bucketName}, File path: ${filePath}`);
  
  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(filePath);
  
  await file.download({ destination: localPath });
  
  console.log(`Audio downloaded to: ${localPath}`);
  return localPath;
}

/**
 * Get audio duration in seconds
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
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
 * Create an extended audio file that:
 * - Adds 2 seconds silence at start
 * - Plays audio
 * - Adds 2 seconds silence
 * - Plays audio again
 * - Adds 2 seconds silence at end
 * 
 * Result: 2s + audio + 2s + audio + 2s
 * 
 * Uses file-based concatenation for maximum reliability.
 */
export async function createExtendedAudio(
  originalAudioPath: string,
  outputPath: string
): Promise<{ path: string; duration: number }> {
  const tempDir = path.dirname(outputPath);
  const silencePath = path.join(tempDir, `silence_${Date.now()}.mp3`);
  const concatListPath = path.join(tempDir, `concat_list_${Date.now()}.txt`);

  try {
    console.log(`Creating extended audio from: ${originalAudioPath}`);
    
    // Step 1: Create a 2-second silence MP3 file
    await createSilenceMP3(silencePath, 2);
    
    // Step 2: Create concat file list
    // Format: silence + audio + silence + audio + silence
    const fileList = [
      `file '${silencePath}'`,
      `file '${originalAudioPath}'`,
      `file '${silencePath}'`,
      `file '${originalAudioPath}'`,
      `file '${silencePath}'`,
    ].join('\n');
    
    fs.writeFileSync(concatListPath, fileList);
    console.log('Audio concat list created');

    // Step 3: Concatenate using FFmpeg concat demuxer
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(outputPath)
        .on('start', (cmd: string) => {
          console.log('FFmpeg audio concat command:', cmd);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    const duration = await getAudioDuration(outputPath);
    console.log(`Extended audio created: ${outputPath} (${duration.toFixed(2)}s)`);

    return { path: outputPath, duration };
  } finally {
    // Clean up temp files
    if (fs.existsSync(silencePath)) {
      fs.unlinkSync(silencePath);
    }
    if (fs.existsSync(concatListPath)) {
      fs.unlinkSync(concatListPath);
    }
  }
}

/**
 * Create a silent MP3 file of specified duration
 * Uses a simple approach: create WAV then convert to MP3
 */
async function createSilenceMP3(outputPath: string, durationSeconds: number): Promise<void> {
  const tempWavPath = outputPath.replace('.mp3', '_temp.wav');
  
  try {
    // Create silent WAV
    const sampleRate = 44100;
    const numChannels = 2;
    const bitsPerSample = 16;
    const numSamples = Math.ceil(sampleRate * durationSeconds);
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(fileSize);

    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    fs.writeFileSync(tempWavPath, buffer);

    // Convert WAV to MP3
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(tempWavPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    console.log(`Created ${durationSeconds}s silence MP3: ${outputPath}`);
  } finally {
    // Clean up temp WAV
    if (fs.existsSync(tempWavPath)) {
      fs.unlinkSync(tempWavPath);
    }
  }
}

/**
 * Generate and upload vocabulary audio to Firebase Storage
 * Returns the storage URLs for both audio files
 */
export async function generateAndUploadVocabularyAudio(
  appId: string,
  wordId: string,
  word: string,
  article: string,
  exampleSentence: string,
  languageCode: string
): Promise<VocabularyAudioUrls> {
  const tempDir = path.join(os.tmpdir(), `audio-gen-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Generate audio files
    const { wordPath, examplePath } = await generateVocabularyAudio(
      word,
      article,
      exampleSentence,
      languageCode,
      tempDir
    );

    // Upload to Firebase Storage
    const wordStoragePath = `vocabulary-audio/${appId}/${wordId}/word.mp3`;
    const exampleStoragePath = `vocabulary-audio/${appId}/${wordId}/example.mp3`;

    const wordUrl = await uploadAudioToStorage(wordPath, wordStoragePath);
    const exampleUrl = await uploadAudioToStorage(examplePath, exampleStoragePath);

    return {
      word: wordUrl,
      exampleSentence: exampleUrl,
    };
  } finally {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

