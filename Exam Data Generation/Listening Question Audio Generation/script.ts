import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

const examPart = process.argv[2];
const examId = process.argv[3];
if (!examPart || !examId) {
    console.error('Usage: node script.ts <exam-part> <exam-id>');
    process.exit(1);
}

import part1Exam2SegmentsJSON from './german-b1-part-1/exam-2.json' with { type: 'json' };
import part1Exam3SegmentsJSON from './german-b1-part-1/exam-3.json' with { type: 'json' };
import part2Exam2SegmentsJSON from './german-b1-part-2/exam-2.json' with { type: 'json' };

const partsMap = {
    'part-1': {
        'exam-2': part1Exam2SegmentsJSON,
        'exam-3': part1Exam3SegmentsJSON,
    },
    'part-2': {
        'exam-2': part2Exam2SegmentsJSON,
    },
};

const segmentsJSON = partsMap[examPart][examId];

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

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
    throw new Error('Set ELEVENLABS_API_KEY');
}

const voiceIds = {
    instructor: '21m00Tcm4TlvDq8ikWAM', // Rachel - female
    moderator: 'ErXwobaYiN019PkySvjV',  // Antoni - male
    person1: 'EXAVITQu4vr4xnSDxMaL',    // Bella - female
    person2: 'MF3mGyEYCl7XYWbV9V6O',    // Elli - female
    person3: 'TxGEqnHWrfWFTfGW9XjX',    // Josh - male
    person4: 'VR6AewLTigWG4xSOukaG',    // Arnold - male
    person5: 'pNInz6obpgDQGcFmaJgB',    // Adam - male
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

const readySegmentsDir = path.join(import.meta.dirname, 'ready segements');

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
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${segment.voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey!,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: segment.text,
                model_id: 'eleven_flash_v2_5',
                language_code: 'de',
                speed: segment.speed || 1.0,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.85,
                    style: 0.0,
                    use_speaker_boost: true,
                },
                output_format: 'mp3_44100_128',
            }),
        });

        if (!response.ok) {
            throw new Error(`TTS failed: ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(buffer));
        console.log(`Generated speech: ${filePath}`);
        
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
                .inputOptions(['-f s16le', '-ar 44100', '-ac 2'])
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
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elevenlabs-exam-'));

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

        const outputPath = `german-b1-listening-question-${examPart}-${examId}.mp3`;

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