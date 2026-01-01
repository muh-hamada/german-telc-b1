import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { GoogleGenAI } from '@google/genai';

const language = process.argv[2];
const level = process.argv[3];
const examPart = process.argv[4];
const examId = process.argv[5];
if (!language || !level || !examPart || !examId) {
    console.error('Usage: node script_v2.ts <language> <level> <exam-part> <exam-id>');
    process.exit(1);
}

// Load segments JSON dynamically based on arguments
const jsonFilePath = path.join(import.meta.dirname, `${language}-${level}-${examPart}`, `${examId}.json`);
const segmentsJSON = JSON.parse(await fs.readFile(jsonFilePath, 'utf-8'));

const defaultSpeed = 1.0;

interface SpeechSegment {
    type: 'speech';
    text: string;
    voiceId: string;
    speed?: number;
    id?: string;       // unique id for caching
    repeated?: boolean; // if true, use cached audio instead of calling API
}

interface PauseSegment {
    type: 'pause';
    durationSeconds: number;
}

interface ReadySegment {
    type: 'ready';
    id: string; // e.g. "nummer-41", "part-1-intro"
}

type Segment = SpeechSegment | PauseSegment | ReadySegment;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY environment variable');
}

// Initialize Google GenAI client
const genAI = new GoogleGenAI({ apiKey });

// Map voice IDs to Google's prebuilt voices
// Google has: Puck, Charon, Kore, Fenrir, Aoede
const voiceIds = {
    instructor: 'Kore',   // female
    moderator: 'Puck',    // male
    person1: 'Aoede',     // female
    person2: 'Kore',      // female
    person3: 'Fenrir',    // male
    person4: 'Puck',      // male
    person5: 'Charon',    // male
};

const rawSegments: Segment[] = segmentsJSON.map((segment: any) => {
    if (segment.type === 'ready') {
        return {
            type: 'ready' as const,
            id: segment.id as string,
        };
    }
    if (segment.type === 'speech') {
        return {
            type: 'speech' as const,
            text: segment.text as string,
            voiceId: voiceIds[segment.voiceId as keyof typeof voiceIds],
            speed: segment.speed as number | undefined,
            id: segment.id as string | undefined,
            repeated: segment.repeated as boolean | undefined,
        };
    }
    return {
        type: 'pause' as const,
        durationSeconds: segment.durationSeconds as number,
    };
});

// Insert 1-second pause between consecutive speech segments
const segments: Segment[] = [];
for (let i = 0; i < rawSegments.length; i++) {
    const current = rawSegments[i];
    const prev = segments[segments.length - 1];

    if (prev?.type === 'speech' && current.type === 'speech') {
        segments.push({ type: 'pause', durationSeconds: 1 });
    }
    segments.push(current);
}

const readySegmentsDir = path.join(import.meta.dirname, language + '-ready-segments');

// Cache for speech segments with id - stores id -> generated file path
const speechCache = new Map<string, string>();

async function generateSegment(filePath: string, segment: Segment) {
    if (segment.type === 'ready') {
        // Copy existing audio file from ready segments folder
        const sourcePath = path.join(readySegmentsDir, `${segment.id}.mp3`);
        await fs.copyFile(sourcePath, filePath);
        console.log(`Copied ready segment: ${segment.id} -> ${filePath}`);
        return;
    }

    if (segment.type === 'speech') {
        // Check if this is a repeated segment - use cached version
        if (segment.repeated && segment.id && speechCache.has(segment.id)) {
            const cachedPath = speechCache.get(segment.id)!;
            await fs.copyFile(cachedPath, filePath);
            console.log(`Used cached segment: ${segment.id} -> ${filePath}`);
            return;
        }

        const speedValue = segment.speed || defaultSpeed;

        // Generate audio using Google Gemini API
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: segment.text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { 
                            voiceName: segment.voiceId 
                        },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error('No audio data received from Gemini API');
        }

        console.log(`Audio data received from Gemini API: ${audioData.length} bytes`);

        // Decode base64 PCM data
        const pcmBuffer = Buffer.from(audioData, 'base64');
        
        // Convert PCM to MP3 (Google returns PCM s16le, mono, 24kHz)
        const tempPcmPath = filePath.replace('.mp3', '.pcm');
        await fs.writeFile(tempPcmPath, pcmBuffer);

        // If speed adjustment is needed, apply it during conversion
        const audioFilter = speedValue !== 1.0 ? `atempo=${Math.max(0.5, Math.min(2.0, speedValue))}` : undefined;

        await new Promise<void>((resolve, reject) => {
            const command = ffmpeg()
                .input(tempPcmPath)
                .inputOptions(['-f', 's16le', '-ar', '24000', '-ac', '1'])
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .audioFrequency(44100)
                .audioChannels(2)
                .output(filePath);

            if (audioFilter) {
                command.audioFilters(audioFilter);
            }

            command
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        await fs.unlink(tempPcmPath); // cleanup temp file
        console.log(`Generated speech${speedValue !== 1.0 ? ` with speed ${speedValue}` : ''}: ${filePath}`);

        // Cache this segment if it has an id (for potential repeated use)
        if (segment.id) {
            speechCache.set(segment.id, filePath);
        }
    } else {
        // generate silence using raw PCM converted to MP3
        const sampleRate = 44100;
        const channels = 2;
        const bytesPerSample = 2;
        const totalSamples = sampleRate * segment.durationSeconds * channels;
        const pcmBuffer = Buffer.alloc(totalSamples * bytesPerSample); // silence = zeros

        const tempPcmPath = filePath.replace('.mp3', '.pcm');
        await fs.writeFile(tempPcmPath, pcmBuffer);

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(tempPcmPath)
                .inputOptions(['-f', 's16le', '-ar', '44100', '-ac', '2'])
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .audioFrequency(44100)
                .format('mp3')
                .output(filePath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        await fs.unlink(tempPcmPath); // cleanup temp file
        console.log(`Generated ${segment.durationSeconds}s silence: ${filePath}`);
    }
}

async function generateExamAudio() {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-exam-'));

    try {
        const segmentFiles: string[] = [];

        for (let i = 0; i < segments.length; i++) {
            const fileName = `${i.toString().padStart(3, '0')}.mp3`;
            const filePath = path.join(tempDir, fileName);
            await generateSegment(filePath, segments[i]);
            segmentFiles.push(filePath);
        }

        // Create concat list
        const listPath = path.join(tempDir, 'concat.txt');
        const listContent = segmentFiles.map(f => `file '${path.basename(f)}'`).join('\n');
        await fs.writeFile(listPath, listContent);

        const outputPath = `${language}-${level}-listening-question-${examPart}-${examId}.mp3`;

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .audioFrequency(44100)
                .audioChannels(2)
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        console.log(`Success! File saved as ${outputPath}`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Optional cleanup
        // await fs.rm(tempDir, { recursive: true, force: true });
    }
}

generateExamAudio();

